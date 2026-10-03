import { Injectable } from '@nestjs/common';

import type { LlmMessage } from '../interfaces/llm-provider.interface';

@Injectable()
export class ConversationContext {
  getRecentHistory(messages: LlmMessage[], humanTurnLimit = 10): LlmMessage[] {
    if (!messages.length) {
      return [];
    }

    const startIndex = this.findContextStartIndex(messages, humanTurnLimit);

    const context = messages.slice(startIndex);

    return this.removeIncompleteToolContext(context);
  }

  private findContextStartIndex(messages: LlmMessage[], humanTurnLimit: number): number {
    let humanTurnCount = 0;

    for (let index = messages.length - 1; index >= 0; index--) {
      if (this.isHumanTurn(messages[index])) {
        humanTurnCount++;
      }

      if (humanTurnCount >= humanTurnLimit) {
        return index;
      }
    }

    return 0;
  }

  private isHumanTurn(message: LlmMessage): boolean {
    return message.role === 'user' || (message.role === 'assistant' && !message.toolCalls?.length);
  }

  private removeIncompleteToolContext(messages: LlmMessage[]): LlmMessage[] {
    const context = [...messages];

    while (context.length > 0 && context[0].role === 'tool') {
      context.shift();
    }

    while (context.length > 0 && context[0].role !== 'user') {
      context.shift();
    }

    return context;
  }
}
