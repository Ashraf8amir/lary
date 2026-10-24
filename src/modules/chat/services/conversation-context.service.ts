import { Injectable } from '@nestjs/common';

import type { LlmMessage } from '../interfaces/llm-provider.interface';

@Injectable()
export class ConversationContext {
  getPromptHistory(messages: LlmMessage[], maxMessages: number): LlmMessage[] {
    if (!messages.length) {
      return [];
    }

    const bounded =
      messages.length > maxMessages ? messages.slice(messages.length - maxMessages) : messages;

    return this.removeIncompleteToolContext(bounded);
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
