import { GoogleGenAI } from '@google/genai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import chatConfig from '@config/chat.config';
import type { SummaryProvider } from '../interfaces/summary-provider.interface';

@Injectable()
export class GeminiSummaryProvider implements SummaryProvider {
  private readonly logger = new Logger(GeminiSummaryProvider.name);
  private readonly client: GoogleGenAI;
  private readonly modelName: string;

  constructor(
    @Inject(chatConfig.KEY)
    private readonly config: ConfigType<typeof chatConfig>,
  ) {
    this.client = new GoogleGenAI({ apiKey: this.config.geminiApiKey });

    this.modelName = this.config.geminiSummaryModel;
  }

  async generateSummary(prompt: string, systemPrompt: string): Promise<string | null> {
    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          maxOutputTokens: 200,
        },
      });

      return response.text?.trim() || null;
    } catch (error) {
      this.logger.error('Failed to generate conversation summary with Gemini', error);

      throw error;
    }
  }
}
