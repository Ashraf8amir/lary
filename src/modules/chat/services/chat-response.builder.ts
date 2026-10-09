import { ProductCard } from '@modules/products/interfaces/product-card.interface';
import { Injectable } from '@nestjs/common';
import type { BuildChatResponseResult } from '../interfaces/chat.interface';

@Injectable()
export class ChatResponseBuilder {
  private static readonly DISPLAY_CARDS_REGEX = /\[DISPLAY_CARDS:\s*([^\]]+)\]/gi;

  build(finalText: string, allCards: ProductCard[]): BuildChatResponseResult {
    const matches = Array.from(finalText.matchAll(ChatResponseBuilder.DISPLAY_CARDS_REGEX));

    if (matches.length === 0) {
      return { cleanReplyText: finalText, cards: [] };
    }

    const selectedIds = new Set<string>();
    for (const match of matches) {
      for (const id of this.parseSelectedCardIds(match[1])) {
        selectedIds.add(id);
      }
    }

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
