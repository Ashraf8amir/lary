import { type ProductCard } from '@modules/products/interfaces/product-card.interface';

import { type LlmMessage, type LlmTokenUsage } from './llm-provider.interface';

export interface ChatResponse {
  replyText: string;
  cards: ProductCard[];
}

export interface BuildChatResponseResult {
  cleanReplyText: string;
  cards: ProductCard[];
}

export interface GenerateChatParams {
  history: LlmMessage[];
  userMessage: string;
  systemPrompt: string;
  storeId: string;
  conversationId: string;
}

export interface ChatGenerationResult {
  finalText: string;
  messagesToSave: LlmMessage[];
  cards: ProductCard[];
  tokenUsage?: LlmTokenUsage;
}

export interface PromptRelevantSettings {
  botName: string;
  supportContactInfo: string | null;
  conversationSummary?: string | null;
  customPersona?: string | null;
}

export interface ChatSummarizePayload {
  storeId: string;
  conversationId: string;
  totalMessagesCount: number;
}

export interface ChatPersistPayload {
  storeId: string;
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
  cards: ProductCard[];
}
