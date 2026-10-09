import {
  Content,
  FunctionDeclaration,
  GenerateContentResponse,
  Part,
  Schema,
  Type,
} from '@google/genai';
import { Injectable } from '@nestjs/common';
import type {
  LlmMessage,
  LlmResponse,
  LlmToolCallRequest,
} from '../interfaces/llm-provider.interface';
import type {
  LlmTool,
  LlmToolParameterSchema,
  LlmToolProperty,
} from '../interfaces/tool.interface';

@Injectable()
export class GeminiContentMapper {
  toGeminiContents(messages: LlmMessage[]): Content[] {
    if (!Array.isArray(messages) || messages.length === 0) {
      return [];
    }

    const nonSystemMessages = messages.filter((msg) => msg.role !== 'system');
    const sanitizedMessages = this.sanitizeHistoricalToolMessages(nonSystemMessages);

    const contents: Content[] = [];

    for (const message of sanitizedMessages) {
      if (message.role === 'tool') {
        const toolPart = this.buildToolResponsePart(message);
        const lastContent = contents[contents.length - 1];

        if (
          lastContent &&
          lastContent.role === 'user' &&
          lastContent.parts?.some((p) => p.functionResponse)
        ) {
          lastContent.parts.push(toolPart);
        } else {
          contents.push({
            role: 'user',
            parts: [toolPart],
          });
        }
        continue;
      }

      if (message.role === 'assistant' && message.toolCalls && message.toolCalls.length > 0) {
        contents.push(this.formatAssistantToolCallMessage(message));
        continue;
      }

      contents.push({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content || '' }],
      });
    }

    return contents;
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
          id: call.id || `call_${call.name || 'tool'}_${Date.now()}_${index}`,
          toolName: call.name?.trim() || 'unknown_tool',
          arguments: (call.args as Record<string, unknown>) ?? {},
          thoughtSignature: part.thoughtSignature,
        });
      }
    }

    const textParts = parts
      .filter(
        (part): part is Part & { text: string } => typeof part.text === 'string' && !part.thought,
      )
      .map((part) => part.text);

    const text = textParts.length > 0 ? textParts.join('').trim() : null;

    return {
      text,
      toolCalls,
    };
  }

  // ---- internal helpers (message formatting) ----

  private buildToolResponsePart(message: LlmMessage): Part {
    let parsedResponse: Record<string, unknown>;
    try {
      const parsed =
        typeof message.content === 'string' ? JSON.parse(message.content) : message.content;
      parsedResponse =
        typeof parsed === 'object' && parsed !== null
          ? (parsed as Record<string, unknown>)
          : { result: parsed };
    } catch {
      parsedResponse = { result: message.content ?? '' };
    }

    return {
      functionResponse: {
        id: message.toolCallId,
        name: message.toolName ?? '',
        response: parsedResponse,
      },
    };
  }

  private sanitizeHistoricalToolMessages(messages: LlmMessage[]): LlmMessage[] {
    const lastUserIndex = messages.findLastIndex((m) => m.role === 'user');
    const result: LlmMessage[] = [];

    for (let idx = 0; idx < messages.length; idx++) {
      const msg = messages[idx];

      if (idx < lastUserIndex) {
        if (msg.role === 'tool') {
          continue;
        }
        if (msg.role === 'assistant' && msg.toolCalls?.length) {
          if (msg.content?.trim()) {
            result.push({
              role: 'assistant',
              content: msg.content.trim(),
            });
          }
          continue;
        }
      }

      result.push(msg);
    }

    return result;
  }

  private formatAssistantToolCallMessage(message: LlmMessage): Content {
    const parts: Part[] = [];

    if (message.content?.trim()) {
      parts.push({ text: message.content.trim() });
    }

    if (message.toolCalls && message.toolCalls.length > 0) {
      for (const call of message.toolCalls) {
        let argsObj: Record<string, unknown> = {};

        if (typeof call.arguments === 'string') {
          try {
            argsObj = JSON.parse(call.arguments);
          } catch {
            argsObj = {};
          }
        } else if (typeof call.arguments === 'object' && call.arguments !== null) {
          argsObj = call.arguments;
        }

        const partItem: Part = {
          functionCall: {
            id: call.id,
            name: call.toolName,
            args: argsObj,
          },
        };

        if (call.thoughtSignature) {
          partItem.thoughtSignature = call.thoughtSignature;
        }

        parts.push(partItem);
      }
    }

    return {
      role: 'model',
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
