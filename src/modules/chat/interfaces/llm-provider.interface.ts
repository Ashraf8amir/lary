import { type LlmTool } from './tool.interface';

export interface LlmToolCallRequest {
  id: string;
  toolName: string;
  arguments: Record<string, unknown>;
  thoughtSignature?: string;
}

export type LlmMessageRole = 'user' | 'assistant' | 'tool' | 'system';

export interface LlmMessage {
  role: LlmMessageRole;
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolCalls?: LlmToolCallRequest[];
}

export interface LlmTokenUsage {
  promptTokens: number;
  candidateTokens: number;
  cachedTokens: number;
  totalTokens: number;
}

export interface LlmResponse {
  text: string | null;
  toolCalls: LlmToolCallRequest[];
  tokenUsage?: LlmTokenUsage;
}

export interface LlmProvider {
  generateResponse(
    messages: LlmMessage[],
    tools: LlmTool[],
    systemPrompt: string,
  ): Promise<LlmResponse>;
}

export interface SummaryProvider {
  generateSummary(prompt: string, systemPrompt: string): Promise<string | null>;
}
