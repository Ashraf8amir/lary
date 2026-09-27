import chatConfig from '@/config/chat.config';
import {
  FunctionDeclaration,
  GenerateContentResponse,
  GoogleGenAI,
  Schema,
  Type,
} from '@google/genai';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  LlmMessage,
  LlmProvider,
  LlmResponse,
  LlmTool,
  LlmToolCallRequest,
  LlmToolParameterSchema,
  LlmToolProperty,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class GeminiProvider implements LlmProvider {
  private readonly client: GoogleGenAI;

  constructor(
    @Inject(chatConfig.KEY)
    private readonly config: ConfigType<typeof chatConfig>,
  ) {
    this.client = new GoogleGenAI({ apiKey: this.config.geminiApiKey });
  }

  async generateResponse(
    messages: LlmMessage[],
    tools: LlmTool[],
    systemPrompt: string,
  ): Promise<LlmResponse> {
    const response = await this.client.models.generateContent({
      model: this.config.geminiModel,
      contents: this.toGeminiContents(messages),
      config: {
        systemInstruction: systemPrompt,
        tools:
          tools.length > 0
            ? [{ functionDeclarations: tools.map((tool) => this.toGeminiTool(tool)) }]
            : undefined,
      },
    });

    return this.parseGeminiResponse(response);
  }

  private toGeminiContents(messages: LlmMessage[]) {
    return messages.map((message) => {
      if (message.role === 'tool') {
        return {
          role: 'user' as const,
          parts: [
            {
              functionResponse: {
                name: message.toolName ?? '',
                response: { result: message.content },
                ...(message.toolCallId ? { id: message.toolCallId } : {}),
              },
            },
          ],
        };
      }

      if (message.role === 'assistant' && message.toolCalls && message.toolCalls.length > 0) {
        return {
          role: 'model' as const,
          parts: message.toolCalls.map((call) => ({
            functionCall: {
              name: call.toolName,
              args: call.arguments,
              ...(call.id ? { id: call.id } : {}),
            },
          })),
        };
      }

      return {
        role: message.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: message.content || '' }],
      };
    });
  }

  private toGeminiTool(tool: LlmTool): FunctionDeclaration {
    return {
      name: tool.name,
      description: tool.description,
      parameters: this.toGeminiParameterSchema(tool.parameters),
    };
  }

  private toGeminiParameterSchema(schema: LlmToolParameterSchema): Schema {
    const properties = schema.properties || {};
    const mappedProperties: Record<string, Schema> = {};

    for (const [key, property] of Object.entries(properties)) {
      mappedProperties[key] = this.toGeminiProperty(property);
    }

    const geminiSchema: Schema = {
      type: Type.OBJECT,
      properties: mappedProperties,
    };

    if (schema.required && schema.required.length > 0) {
      geminiSchema.required = schema.required;
    }

    return geminiSchema;
  }

  private toGeminiProperty(property: LlmToolProperty): Schema {
    const geminiProperty: Schema = {
      type: this.toGeminiType(property.type),
      description: property.description,
    };

    if (property.enum && property.enum.length > 0) {
      geminiProperty.enum = property.enum;
    }

    if (property.items) {
      geminiProperty.items = this.toGeminiProperty(property.items);
    }

    return geminiProperty;
  }

  private toGeminiType(type: LlmToolProperty['type']): Type {
    switch (type) {
      case 'string':
        return Type.STRING;

      case 'number':
        return Type.NUMBER;

      case 'boolean':
        return Type.BOOLEAN;

      case 'array':
        return Type.ARRAY;

      case 'object':
        return Type.OBJECT;

      default:
        throw new Error(`Unsupported Gemini schema type: ${type}`);
    }
  }

  private parseGeminiResponse(response: GenerateContentResponse): LlmResponse {
    const geminiFunctionCalls = response.functionCalls || [];

    const toolCalls: LlmToolCallRequest[] = geminiFunctionCalls.map((call, index) => {
      const callId = call.id || `call_${call.name || 'tool'}_${Date.now()}_${index}`;

      return {
        id: callId,
        toolName: call.name?.trim() || 'unknown_tool',
        arguments: (call.args as Record<string, unknown>) ?? {},
      };
    });

    let text: string | null = null;
    try {
      text = response.text || null;
    } catch {
      text = null;
    }

    return { text, toolCalls };
  }
}
