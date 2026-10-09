import chatConfig from '@config/chat.config';
import { CacheService } from '@infrastructure/cache/cache.service';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { CHAT_CACHE_KEYS, SLIDING_WINDOW_LIMIT } from '../constants/chat.constants';
import type { LlmMessage } from '../interfaces/llm-provider.interface';

@Injectable()
export class ConversationStore {
  constructor(
    private readonly cacheService: CacheService,
    @Inject(chatConfig.KEY)
    private readonly config: ConfigType<typeof chatConfig>,
  ) {}

  async getHistory(
    storeId: string,
    conversationId: string,
    start = 0,
    stop = -1,
  ): Promise<LlmMessage[]> {
    return this.cacheService.lrange<LlmMessage>(
      this.buildSessionKey(storeId, conversationId),
      start,
      stop,
    );
  }

  async getRecentHistory(storeId: string, conversationId: string): Promise<LlmMessage[]> {
    const limit = SLIDING_WINDOW_LIMIT;
    return this.cacheService.lrange<LlmMessage>(
      this.buildSessionKey(storeId, conversationId),
      -limit,
      -1,
    );
  }

  async appendMessages(
    storeId: string,
    conversationId: string,
    newMessages: LlmMessage[],
  ): Promise<number> {
    const key = this.buildSessionKey(storeId, conversationId);

    return this.cacheService.rpushWithTtl<LlmMessage>(
      key,
      newMessages,
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
