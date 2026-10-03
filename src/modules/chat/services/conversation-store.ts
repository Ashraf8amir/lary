import chatConfig from '@config/chat.config';
import { CacheService } from '@infrastructure/cache/cache.service';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { CHAT_CACHE_KEYS } from '../chat.constants';
import type { LlmMessage } from '../interfaces/llm-provider.interface';

@Injectable()
export class ConversationStore {
  constructor(
    private readonly cacheService: CacheService,
    @Inject(chatConfig.KEY)
    private readonly config: ConfigType<typeof chatConfig>,
  ) {}

  async getHistory(conversationId: string): Promise<LlmMessage[]> {
    const history = await this.cacheService.get<LlmMessage[]>(this.buildSessionKey(conversationId));

    return history ?? [];
  }

  async appendMessages(conversationId: string, newMessages: LlmMessage[]): Promise<void> {
    if (newMessages.length === 0) {
      return;
    }

    const existingMessages = await this.getHistory(conversationId);

    await this.cacheService.set(
      this.buildSessionKey(conversationId),
      [...existingMessages, ...newMessages],
      this.config.sessionTtlSeconds,
    );
  }

  async getSummary(conversationId: string): Promise<string | null> {
    const summary = await this.cacheService.get<string>(this.buildSummaryKey(conversationId));

    return summary ?? null;
  }

  async setSummary(conversationId: string, summary: string): Promise<void> {
    await this.cacheService.set(
      this.buildSummaryKey(conversationId),
      summary,
      this.config.sessionTtlSeconds,
    );
  }

  async getLastSummarizedCount(conversationId: string): Promise<number> {
    const count = await this.cacheService.get<number>(this.buildSummaryCountKey(conversationId));

    return count ?? 0;
  }

  async setLastSummarizedCount(conversationId: string, count: number): Promise<void> {
    await this.cacheService.set(
      this.buildSummaryCountKey(conversationId),
      count,
      this.config.sessionTtlSeconds,
    );
  }

  private buildSessionKey(conversationId: string): string {
    return `${CHAT_CACHE_KEYS.SESSION}${conversationId}`;
  }

  private buildSummaryKey(conversationId: string): string {
    return `${CHAT_CACHE_KEYS.SUMMARY}${conversationId}`;
  }

  private buildSummaryCountKey(conversationId: string): string {
    return `${CHAT_CACHE_KEYS.SUMMARY_COUNT}${conversationId}`;
  }
}
