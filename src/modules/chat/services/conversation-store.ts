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

  async getHistory(storeId: string, conversationId: string): Promise<LlmMessage[]> {
    const history = await this.cacheService.get<LlmMessage[]>(
      this.buildSessionKey(storeId, conversationId),
    );

    return Array.isArray(history) ? history.filter(Boolean) : [];
  }

  async appendMessages(
    storeId: string,
    conversationId: string,
    newMessages: LlmMessage[],
  ): Promise<void> {
    if (newMessages.length === 0) {
      return;
    }

    const existingMessages = await this.getHistory(storeId, conversationId);

    await this.cacheService.set(
      this.buildSessionKey(storeId, conversationId),
      [...existingMessages, ...newMessages],
      this.config.sessionTtlSeconds,
    );
  }

  async getSummary(storeId: string, conversationId: string): Promise<string | null> {
    const summary = await this.cacheService.get<string>(
      this.buildSummaryKey(storeId, conversationId),
    );

    return summary ?? null;
  }

  async setSummary(storeId: string, conversationId: string, summary: string): Promise<void> {
    await this.cacheService.set(
      this.buildSummaryKey(storeId, conversationId),
      summary,
      this.config.sessionTtlSeconds,
    );
  }

  async getLastSummarizedCount(storeId: string, conversationId: string): Promise<number> {
    const count = await this.cacheService.get<number>(
      this.buildSummaryCountKey(storeId, conversationId),
    );

    return count ?? 0;
  }

  async setLastSummarizedCount(
    storeId: string,
    conversationId: string,
    count: number,
  ): Promise<void> {
    await this.cacheService.set(
      this.buildSummaryCountKey(storeId, conversationId),
      count,
      this.config.sessionTtlSeconds,
    );
  }

  private buildSessionKey(storeId: string, conversationId: string): string {
    return `${CHAT_CACHE_KEYS.SESSION}${storeId}:${conversationId}`;
  }

  private buildSummaryKey(storeId: string, conversationId: string): string {
    return `${CHAT_CACHE_KEYS.SUMMARY}${storeId}:${conversationId}`;
  }

  private buildSummaryCountKey(storeId: string, conversationId: string): string {
    return `${CHAT_CACHE_KEYS.SUMMARY_COUNT}${storeId}:${conversationId}`;
  }
}
