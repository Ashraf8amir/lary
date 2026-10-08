import { ForbiddenException, Injectable, Logger } from '@nestjs/common';

import { AssistantSettingsService } from '../assistant-settings/assistant-settings.service';
import { SLIDING_WINDOW_LIMIT, SUMMARY_MESSAGE_INTERVAL } from './constants/chat.constants';
import { ChatResponse } from './interfaces/chat.interface';
import { SystemPromptBuilder } from './prompts/system-prompt.builder';
import { ChatSummaryPublisher } from './queues/publishers/chat-summary.publisher';
import { ChatGenerationService } from './services/chat-generation.service';
import { ChatResponseBuilder } from './services/chat-response.builder';
import { ConversationContext } from './services/conversation-context.service';
import { ConversationStore } from './services/conversation-store';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly conversationStore: ConversationStore,
    private readonly conversationContext: ConversationContext,
    private readonly assistantSettingsService: AssistantSettingsService,
    private readonly systemPromptBuilder: SystemPromptBuilder,
    private readonly chatGenerationService: ChatGenerationService,
    private readonly chatResponseBuilder: ChatResponseBuilder,
    private readonly chatSummaryPublisher: ChatSummaryPublisher,
  ) {}

  async handleMessage(
    conversationId: string,
    storeId: string,
    userMessage: string,
  ): Promise<ChatResponse> {
    const promptSettings = await this.assistantSettingsService.getForPromptSettings(storeId);

    if (!promptSettings.isEnabled) {
      throw new ForbiddenException('Chat assistant is currently disabled for this store.');
    }

    const [recentHistory, conversationSummary] = await Promise.all([
      this.conversationStore.getHistory(storeId, conversationId),
      this.conversationStore.getSummary(storeId, conversationId),
    ]);

    const safeHistory = this.conversationContext.getRecentHistory(
      recentHistory,
      SLIDING_WINDOW_LIMIT,
    );

    const systemPrompt = this.systemPromptBuilder.build({
      ...promptSettings,
      conversationSummary,
    });

    const generationResult = await this.chatGenerationService.generate({
      history: safeHistory,
      userMessage,
      systemPrompt,
      storeId,
      conversationId,
    });

    const response = this.chatResponseBuilder.build(
      generationResult.finalText,
      generationResult.cards,
    );

    const messagesToPersist = [
      ...generationResult.messagesToSave,
      {
        role: 'assistant' as const,
        content: response.cleanReplyText,
      },
    ];

    const totalMessageCount = await this.conversationStore.appendMessages(
      storeId,
      conversationId,
      messagesToPersist,
    );

    this.triggerSummary(storeId, conversationId, totalMessageCount);

    return {
      replyText: response.cleanReplyText,
      cards: response.cards,
    };
  }

  private triggerSummary(storeId: string, conversationId: string, totalMessageCount: number): void {
    this.checkAndTriggerSummary(storeId, conversationId, totalMessageCount).catch((error) => {
      this.logger.error(
        `Failed to trigger summary for store ${storeId}, conversation ${conversationId}`,
        error,
      );
    });
  }

  private async checkAndTriggerSummary(
    storeId: string,
    conversationId: string,
    totalMessageCount: number,
  ): Promise<void> {
    const lastSummarizedCount = await this.conversationStore.getLastSummarizedCount(
      storeId,
      conversationId,
    );

    const unsummarizedMessageCount = totalMessageCount - lastSummarizedCount;

    if (unsummarizedMessageCount < SUMMARY_MESSAGE_INTERVAL) {
      return;
    }

    await this.chatSummaryPublisher.publishSummarize(storeId, conversationId, totalMessageCount);
  }
}
