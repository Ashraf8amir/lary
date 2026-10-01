import chatConfig from '@config/chat.config';
import { CacheService } from '@infrastructure/cache/cache.service';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { LlmMessage } from '../interfaces/llm-provider.interface';

const SESSION_KEY_PREFIX = 'chat:session:';

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

  private buildKey(conversationId: string): string {
    return `${SESSION_KEY_PREFIX}${conversationId}`;
  }
}
