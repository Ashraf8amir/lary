import { ProductCard } from '@modules/products/interfaces/product-card.interface';
import { LlmMessage } from './llm-provider.interface';

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
}

export interface PromptRelevantSettings {
  botName: string;
  supportContactInfo: string | null;
  conversationSummary?: string | null;
}

export interface ChatSummarizePayload {
  storeId: string;
  conversationId: string;
  totalMessagesCount: number;
}
