import chatConfig from '@config/chat.config';
import { CacheService } from '@infrastructure/cache/cache.service';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { LlmMessage } from '../interfaces/llm-provider.interface';

const SESSION_KEY_PREFIX = 'chat:session:';
const SUMMARY_KEY_PREFIX = 'chat:summary:';
const SUMMARY_COUNT_KEY_PREFIX = 'chat:summary_count:';

@Injectable()
export class ConversationSessionService {
  constructor(
    private readonly cacheService: CacheService,
    @Inject(chatConfig.KEY)
    private readonly config: ConfigType<typeof chatConfig>,
  ) {}

  async getHistory(conversationId: string): Promise<LlmMessage[]> {
    const history = await this.cacheService.get<LlmMessage[]>(this.buildKey(conversationId));
    return history || [];
  }

  async appendMessages(conversationId: string, newMessages: LlmMessage[]): Promise<void> {
    const existing = await this.getHistory(conversationId);
    const updated = [...existing, ...newMessages];

    await this.cacheService.set(
      this.buildKey(conversationId),
      updated,
      this.config.sessionTtlSeconds,
    );
  }

  async getSummary(conversationId: string): Promise<string | null> {
    const summary = await this.cacheService.get<string>(this.buildSummaryKey(conversationId));
    return summary || null;
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

  // ################ bildKey methods ################################

  private buildKey(conversationId: string): string {
    return `${SESSION_KEY_PREFIX}${conversationId}`;
  }

  private buildSummaryKey(conversationId: string): string {
    return `${SUMMARY_KEY_PREFIX}${conversationId}`;
  }

  private buildSummaryCountKey(conversationId: string): string {
    return `${SUMMARY_COUNT_KEY_PREFIX}${conversationId}`;
  }
}
