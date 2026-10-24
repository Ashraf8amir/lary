import { ForbiddenException, Injectable, Logger } from '@nestjs/common';

import { AssistantSettingsService } from '../assistant-settings/assistant-settings.service';
import { PlanFeature } from '../subscriptions/enums/plan.enums';
import { SubscriptionsService } from '../subscriptions/services/subscriptions.service';
import { HISTORY_TAIL_CEILING, SUMMARY_MESSAGE_INTERVAL } from './constants/chat.constants';
import type { ChatPersistPayload, ChatResponse } from './interfaces/chat.interface';
import { SystemPromptBuilder } from './prompts/system-prompt.builder';
import { ChatPersistPublisher } from './queues/publishers/chat-persist.publisher';
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
    private readonly chatPersistPublisher: ChatPersistPublisher,
    private readonly subscriptionsService: SubscriptionsService,
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

    const [fullHistory, conversationSummary, lastSummarizedCount] = await Promise.all([
      this.conversationStore.getHistory(storeId, conversationId),
      this.conversationStore.getSummary(storeId, conversationId),
      this.conversationStore.getLastSummarizedCount(storeId, conversationId),
    ]);

    const safeHistory = this.conversationContext.getPromptHistory(
      fullHistory.slice(Math.min(lastSummarizedCount, fullHistory.length)),
      HISTORY_TAIL_CEILING,
    );

    const hasCustomPersona = await this.subscriptionsService.hasFeature(
      storeId,
      PlanFeature.CUSTOM_PERSONA,
    );

    const promptSettingsEffective = {
      ...promptSettings,
      customPersona: hasCustomPersona ? promptSettings.customPersona : null,
      conversationSummary,
    };

    const systemPrompt = this.systemPromptBuilder.build(promptSettingsEffective);

    const generationResult = await this.chatGenerationService.generate({
      history: safeHistory,
      userMessage,
      systemPrompt,
      storeId,
      conversationId,
    });

    const usage = generationResult.tokenUsage;

    if (usage) {
      this.logger.debug(
        `Gemini tokens for store ${storeId}, conversation ${conversationId}: ` +
          `cached=${usage.cachedTokens}/${usage.promptTokens} prompt, ` +
          `${usage.candidateTokens} output, ${usage.totalTokens} total`,
      );
    }

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

    this.triggerPersist(storeId, conversationId, {
      storeId,
      conversationId,
      userMessage,
      assistantMessage: response.cleanReplyText,
      cards: response.cards,
    });

    this.triggerSummary(storeId, conversationId, totalMessageCount);

    this.subscriptionsService
      .trackNewConversation(storeId, generationResult.tokenUsage?.totalTokens ?? 0)
      .catch((err) => {
        this.logger.error(`Failed to track usage for store ${storeId}`, err);
      });

    return {
      replyText: response.cleanReplyText,
      cards: response.cards,
    };
  }

  private triggerPersist(
    storeId: string,
    conversationId: string,
    turnPayload: ChatPersistPayload,
  ): void {
    this.chatPersistPublisher.publishPersist(turnPayload).catch((error) => {
      this.logger.error(
        `Failed to queue chat turn persistence for store ${storeId}, conversation ${conversationId}`,
        error,
      );
    });
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
