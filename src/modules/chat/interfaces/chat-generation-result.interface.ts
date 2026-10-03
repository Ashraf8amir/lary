import { ProductCard } from '@modules/products/interfaces/product-card.interface';
import { LlmMessage } from './llm-provider.interface';

export interface ChatGenerationResult {
  finalText: string;
  messagesToSave: LlmMessage[];
  cards: ProductCard[];
}
