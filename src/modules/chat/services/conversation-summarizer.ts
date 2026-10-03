import { Inject, Injectable } from '@nestjs/common';

import { SUMMARY_PROVIDER } from '../chat.constants';
import type { LlmMessage } from '../interfaces/llm-provider.interface';
import type { SummaryProvider } from '../interfaces/summary-provider.interface';
import { SUMMARY_SYSTEM_PROMPT } from '../prompts/summary-system.builder';

@Injectable()
export class ConversationSummarizer {
  constructor(
    @Inject(SUMMARY_PROVIDER)
    private readonly summaryProvider: SummaryProvider,
  ) {}

  async summarize(messages: LlmMessage[], existingSummary?: string | null): Promise<string | null> {
    const humanConversation = this.buildHumanConversation(messages);

    if (!humanConversation) {
      return existingSummary ?? null;
    }

    const prompt = this.buildSummaryPrompt(humanConversation, existingSummary);

    const generatedSummary = await this.summaryProvider.generateSummary(
      prompt,
      SUMMARY_SYSTEM_PROMPT,
    );

    return generatedSummary || existingSummary || null;
  }

  private buildHumanConversation(messages: LlmMessage[]): string {
    return messages
      .filter((message) => this.isSummarizableMessage(message))
      .map((message) => {
        const speaker = message.role === 'user' ? 'العميل' : 'المساعد';

        return `${speaker}: ${message.content}`;
      })
      .join('\n')
      .trim();
  }

  private isSummarizableMessage(message: LlmMessage): boolean {
    if (message.role === 'user') {
      return true;
    }

    return (
      message.role === 'assistant' && Boolean(message.content) && !message.content.startsWith('[')
    );
  }

  private buildSummaryPrompt(humanConversation: string, existingSummary?: string | null): string {
    const promptParts: string[] = [];

    if (existingSummary?.trim()) {
      promptParts.push(`[الملخص السابق للمحادثة]:\n${existingSummary.trim()}`);
    }

    promptParts.push(`[سجل المحادثة الجديد]:\n${humanConversation}`);

    promptParts.push('حدّث وركّز ملخص العميل بناءً على المعطيات السابقة.');

    return promptParts.join('\n\n');
  }
}
