export interface LlmToolProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: LlmToolProperty;
}

export interface LlmToolParameterSchema {
  type: 'object';
  properties: Record<string, LlmToolProperty>;
  required?: string[];
}

export interface LlmTool {
  name: string;
  description: string;
  parameters: LlmToolParameterSchema;
}

export type LlmMessageRole = 'user' | 'assistant' | 'tool';

export interface LlmToolCallRequest {
  id?: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface LlmMessage {
  role: LlmMessageRole;
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolCalls?: LlmToolCallRequest[];
}

export interface LlmResponse {
  text: string | null;
  toolCalls: LlmToolCallRequest[];
}

export interface LlmProvider {
  generateResponse(
    messages: LlmMessage[],
    tools: LlmTool[],
    systemPrompt: string,
  ): Promise<LlmResponse>;
}
