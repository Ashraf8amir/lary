import { ProductCard } from '@modules/products/interfaces/product-card.interface';
import { Injectable } from '@nestjs/common';

export interface BuildChatResponseResult {
  cleanReplyText: string;
  cards: ProductCard[];
}

@Injectable()
export class ChatResponseBuilder {
  private static readonly DISPLAY_CARDS_REGEX = /\[DISPLAY_CARDS:\s*([^\]]+)\]/i;

  build(finalText: string, allCards: ProductCard[]): BuildChatResponseResult {
    const match = finalText.match(ChatResponseBuilder.DISPLAY_CARDS_REGEX);

    if (!match) {
      return {
        cleanReplyText: finalText,
        cards: [],
      };
    }

    const selectedIds = this.parseSelectedCardIds(match[1]);

    const cleanReplyText = finalText.replace(ChatResponseBuilder.DISPLAY_CARDS_REGEX, '').trim();

    const cards = allCards.filter((card) => selectedIds.has(card.variantId));

    return {
      cleanReplyText,
      cards: this.deduplicateCards(cards),
    };
  }

  private parseSelectedCardIds(value: string): Set<string> {
    return new Set(
      value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    );
  }

  private deduplicateCards(cards: ProductCard[]): ProductCard[] {
    const uniqueCards = new Map<string, ProductCard>();

    for (const card of cards) {
      uniqueCards.set(card.variantId, card);
    }

    return Array.from(uniqueCards.values());
  }
}
