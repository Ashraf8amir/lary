import { GoogleGenAI } from '@google/genai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import chatConfig from '@/config/chat.config';
import { LlmMessage } from '../interfaces/llm-provider.interface';
import { SUMMARY_SYSTEM_PROMPT } from '../prompts/summary-system.builder';

@Injectable()
export class ConversationSummaryService {
  private readonly logger = new Logger(ConversationSummaryService.name);
  private readonly client: GoogleGenAI;
  private readonly modelName = this.config.geminiSummaryModel;

  constructor(
    @Inject(chatConfig.KEY)
    private readonly config: ConfigType<typeof chatConfig>,
  ) {
    this.client = new GoogleGenAI({ apiKey: this.config.geminiApiKey });
  }

  async summarize(messages: LlmMessage[], existingSummary?: string | null): Promise<string | null> {
    try {
      const humanConversation = messages
        .filter((m) => {
          if (m.role === 'user') return true;
          return m.role === 'assistant' && m.content && !m.content.startsWith('[');
        })
        .map((m) => `${m.role === 'user' ? 'العميل' : 'المساعد'}: ${m.content}`)
        .join('\n');

      if (!humanConversation.trim()) {
        return existingSummary || null;
      }

      const promptParts: string[] = [];

      if (existingSummary?.trim()) {
        promptParts.push(`[الملخص السابق للمحادثة]:\n${existingSummary.trim()}\n`);
      }

      promptParts.push(`[سجل المحادثة الجديد]:\n${humanConversation}\n`);
      promptParts.push('حدّث وركّز ملخص العميل بناءً على المعطيات السابقة.');

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: promptParts.join('\n') }],
          },
        ],
        config: {
          systemInstruction: SUMMARY_SYSTEM_PROMPT,
          temperature: 0.2,
          maxOutputTokens: 200,
        },
      });

      const summaryText = response.text?.trim();
      return summaryText || existingSummary || null;
    } catch (error) {
      this.logger.error('Failed to generate conversation summary', error);
      throw error;
    }
  }
}
