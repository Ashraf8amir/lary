import chatConfig from '@/config/chat.config';
import { GoogleGenAI } from '@google/genai';
import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  LlmMessage,
  LlmProvider,
  LlmResponse,
  LlmTool,
} from '../interfaces/llm-provider.interface';
import { GeminiContentMapper } from '../mapper/gemini-content.mapper';

@Injectable()
export class GeminiProvider implements LlmProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenAI;

  constructor(
    @Inject(chatConfig.KEY)
    private readonly config: ConfigType<typeof chatConfig>,
    private readonly mapper: GeminiContentMapper,
  ) {
    this.client = new GoogleGenAI({ apiKey: this.config.geminiApiKey });
  }

  async generateResponse(
    messages: LlmMessage[],
    tools: LlmTool[],
    systemPrompt: string,
  ): Promise<LlmResponse> {
    try {
      const contents = this.mapper.toGeminiContents(messages);

      console.log('====== [GEMINI CONTENTS PAYLOAD] ======');
      console.log(JSON.stringify(contents, null, 2));
      console.log('=======================================');

      const response = await this.client.models.generateContent({
        model: this.config.geminiModel,
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          tools:
            tools.length > 0
              ? [{ functionDeclarations: tools.map((tool) => this.mapper.toGeminiTool(tool)) }]
              : undefined,
        },
      });
      return this.mapper.parseGeminiResponse(response);
    } catch (error: any) {
      this.handleGenerationError(error);
    }
  }

  private handleGenerationError(error: any): never {
    this.logger.error(`Error generating response from Gemini: ${error.message}`, error.stack);

    if (this.isRateLimitError(error)) {
      throw new HttpException(
        'The service is currently rate-limited. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (this.isServiceUnavailableError(error)) {
      throw new HttpException(
        'The service is currently under heavy load. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    throw new HttpException(
      'An error occurred while generating a response. Please try again later.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private isRateLimitError(error: any): boolean {
    return (
      error.status === 429 ||
      error.status === 'RESOURCE_EXHAUSTED' ||
      error.message?.includes('429') ||
      error.message?.includes('RESOURCE_EXHAUSTED')
    );
  }

  private isServiceUnavailableError(error: any): boolean {
    return (
      error.status === 503 ||
      error.status === 'UNAVAILABLE' ||
      error.message?.includes('503') ||
      error.message?.includes('UNAVAILABLE')
    );
  }
}
