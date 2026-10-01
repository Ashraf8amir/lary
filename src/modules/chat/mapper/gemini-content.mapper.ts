import { FunctionDeclaration, GenerateContentResponse, Schema, Type } from '@google/genai';
import { Injectable } from '@nestjs/common';
import {
  LlmMessage,
  LlmResponse,
  LlmTool,
  LlmToolCallRequest,
  LlmToolParameterSchema,
  LlmToolProperty,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class GeminiContentMapper {
  toGeminiContents(messages: LlmMessage[]) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return [];
    }

    const chatMessages = messages.filter((msg) => msg.role !== 'system');

    const lastToolIndex = this.findLastToolIndex(chatMessages);

    return chatMessages.map((message, index) => {
      if (message.role === 'tool') {
        return this.formatToolMessage(message, index === lastToolIndex);
      }

      if (message.role === 'assistant' && message.toolCalls && message.toolCalls.length > 0) {
        return this.formatAssistantToolCallMessage(message);
      }

      return {
        role: message.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: message.content || '' }],
      };
    });
  }

  toGeminiTool(tool: LlmTool): FunctionDeclaration {
    const declaration: FunctionDeclaration = {
      name: tool.name,
      description: tool.description,
    };

    if (tool.parameters && Object.keys(tool.parameters.properties || {}).length > 0) {
      declaration.parameters = this.toGeminiParameterSchema(tool.parameters);
    }

    return declaration;
  }

  parseGeminiResponse(response: GenerateContentResponse): LlmResponse {
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const toolCalls: LlmToolCallRequest[] = [];

    for (const [index, part] of parts.entries()) {
      if (part.functionCall) {
        const call = part.functionCall;
        toolCalls.push({
          id: (call as any).id || `call_${call.name || 'tool'}_${Date.now()}_${index}`,
          toolName: call.name?.trim() || 'unknown_tool',
          arguments: (call.args as Record<string, unknown>) ?? {},
          // حفظ الـ thoughtSignature القادم من Gemini مع الـ part
          thoughtSignature: (part as any).thoughtSignature,
        } as any);
      }
    }

    let text: string | null = null;
    const textParts = parts.filter((p: any) => typeof p.text === 'string').map((p: any) => p.text);
    if (textParts.length > 0) {
      text = textParts.join('').trim();
    }

    // لو في toolCalls، نحفظ الـ parts الأصلية كـ JSON عشان نضمن عدم ضياع التوقيع
    let rawPartsContent = text;
    if (toolCalls.length > 0 && parts.length > 0) {
      rawPartsContent = JSON.stringify(parts);
    }

    return {
      text: rawPartsContent,
      toolCalls,
    };
  }

  // ---- internal helpers (message formatting) ----

  private findLastToolIndex(messages: LlmMessage[]): number {
    if (!Array.isArray(messages)) return -1;

    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'tool') {
        return i;
      }
    }
    return -1;
  }

  private formatToolMessage(message: LlmMessage, isLastTool: boolean) {
    let content = message.content ?? '';

    if (!isLastTool && content) {
      content = this.pruneOldToolContent(content);
    }

    let parsedResponse: Record<string, any>;
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      parsedResponse = typeof parsed === 'object' && parsed !== null ? parsed : { result: parsed };
    } catch {
      parsedResponse = { result: content };
    }

    return {
      role: 'user' as const,
      parts: [
        {
          functionResponse: {
            name: message.toolName ?? '',
            response: parsedResponse,
            ...(message.toolCallId ? { id: message.toolCallId } : {}),
          },
        },
      ],
    };
  }

  private pruneOldToolContent(rawContent: string): string {
    if (!rawContent || typeof rawContent !== 'string') {
      return rawContent;
    }

    try {
      const parsed = JSON.parse(rawContent);

      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.products)) {
        const totalCount = parsed.totalFound || parsed.products.length;

        const previewLimit = 5;
        const displayed = parsed.products.slice(0, previewLimit).map((p: any) => {
          if (!p || typeof p !== 'object') return String(p);
          const name = p.name ?? 'Unknown';
          const price = p.price ? ` (${p.price})` : '';
          return `${name}${price}`;
        });

        return JSON.stringify({
          status: 'success',
          totalFound: totalCount,
          displayedProducts: displayed,
          ...(totalCount > previewLimit
            ? { note: `Showing top ${previewLimit} of ${totalCount} items` }
            : {}),
        });
      }
    } catch {
      // If parsing fails, return the raw content as-is
    }

    return rawContent;
  }

  private formatAssistantToolCallMessage(message: LlmMessage) {
    const parts: any[] = [];

    // إذا كان هناك نص عادي مع طلب الأداة
    if (
      message.content &&
      typeof message.content === 'string' &&
      !message.content.startsWith('[')
    ) {
      if (message.content.trim()) {
        parts.push({ text: message.content });
      }
    }

    // إعادة بناء الـ parts من toolCalls بدون أي تكرار
    if (message.toolCalls && message.toolCalls.length > 0) {
      for (const call of message.toolCalls) {
        let argsObj = {};

        if (typeof call.arguments === 'string') {
          try {
            argsObj = JSON.parse(call.arguments);
          } catch {
            argsObj = {};
          }
        } else if (typeof call.arguments === 'object' && call.arguments !== null) {
          argsObj = call.arguments;
        }

        const partItem: any = {
          functionCall: {
            name: call.toolName,
            args: argsObj,
          },
        };

        // تمرير الـ thoughtSignature من مكان واحد فقط (toolCalls)
        if ((call as any).thoughtSignature) {
          partItem.thoughtSignature = (call as any).thoughtSignature;
        }

        parts.push(partItem);
      }
    }

    return {
      role: 'model' as const,
      parts: parts.length > 0 ? parts : [{ text: '' }],
    };
  }

  // ---- internal helpers (tool/schema formatting) ----

  private toGeminiParameterSchema(schema?: LlmToolParameterSchema): Schema {
    if (!schema) {
      return { type: Type.OBJECT };
    }

    const properties = schema.properties || {};
    const propertyKeys = Object.keys(properties);

    const geminiSchema: Schema = {
      type: Type.OBJECT,
    };

    if (propertyKeys.length > 0) {
      const mappedProperties: Record<string, Schema> = {};

      for (const [key, property] of Object.entries(properties)) {
        mappedProperties[key] = this.toGeminiProperty(property);
      }

      geminiSchema.properties = mappedProperties;
    }

    if (schema.required && Array.isArray(schema.required) && schema.required.length > 0) {
      geminiSchema.required = schema.required;
    }

    if (schema.description) {
      geminiSchema.description = schema.description;
    }

    return geminiSchema;
  }

  private toGeminiProperty(property: LlmToolProperty): Schema {
    const geminiProperty: Schema = {
      type: this.toGeminiType(property.type),
    };

    if (property.description) {
      geminiProperty.description = property.description;
    }

    if (property.enum && property.enum.length > 0) {
      geminiProperty.enum = property.enum;
    }

    if (property.type === 'array') {
      geminiProperty.items = property.items
        ? this.toGeminiProperty(property.items)
        : { type: Type.STRING };
    }

    if (property.type === 'object' && property.properties) {
      const mappedProperties: Record<string, Schema> = {};
      for (const [key, prop] of Object.entries(property.properties)) {
        mappedProperties[key] = this.toGeminiProperty(prop);
      }
      geminiProperty.properties = mappedProperties;

      if (property.required && property.required.length > 0) {
        geminiProperty.required = property.required;
      }
    }

    return geminiProperty;
  }

  private toGeminiType(type: LlmToolProperty['type']): Type {
    switch (type?.toLowerCase()) {
      case 'string':
        return Type.STRING;
      case 'number':
        return Type.NUMBER;
      case 'integer':
        return Type.INTEGER;
      case 'boolean':
        return Type.BOOLEAN;
      case 'array':
        return Type.ARRAY;
      case 'object':
        return Type.OBJECT;
      default: {
        throw new Error(`Unsupported Gemini schema type: ${type}`);
      }
    }
  }
}
