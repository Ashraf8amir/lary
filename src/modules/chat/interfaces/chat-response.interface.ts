import { ProductCard } from '@modules/products/interfaces/product-card.interface';

export interface ChatResponse {
  replyText: string;
  cards: ProductCard[];
}
