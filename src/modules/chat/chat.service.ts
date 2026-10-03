import { WidgetSettingsService } from '@modules/widget-settings/widget-settings.service';
import { Injectable, Logger } from '@nestjs/common';

import { SUMMARY_MESSAGE_INTERVAL } from './chat.constants';
import { ChatResponse } from './interfaces/chat-response.interface';
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
    private readonly widgetSettingsService: WidgetSettingsService,
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
    const [recentHistory, conversationSummary, promptSettings] = await Promise.all([
      this.conversationStore.getHistory(conversationId),
      this.conversationStore.getSummary(conversationId),
      this.widgetSettingsService.getForSystemPrompt(storeId),
    ]);

    const safeHistory = this.conversationContext.getRecentHistory(recentHistory, 10);

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

    generationResult.messagesToSave.push({
      role: 'assistant',
      content: response.cleanReplyText,
    });

    await this.conversationStore.appendMessages(conversationId, generationResult.messagesToSave);

    this.triggerSummary(conversationId);

    return {
      replyText: response.cleanReplyText,
      cards: response.cards,
    };
  }

  private triggerSummary(conversationId: string): void {
    this.checkAndTriggerSummary(conversationId).catch((error) => {
      this.logger.error(`Failed to trigger summary for conversation ${conversationId}`, error);
    });
  }

  private async checkAndTriggerSummary(conversationId: string): Promise<void> {
    const [allMessages, lastSummarizedCount] = await Promise.all([
      this.conversationStore.getHistory(conversationId),
      this.conversationStore.getLastSummarizedCount(conversationId),
    ]);

    const totalMessageCount = allMessages.length;
    const unsummarizedMessageCount = totalMessageCount - lastSummarizedCount;

    if (unsummarizedMessageCount < SUMMARY_MESSAGE_INTERVAL) {
      return;
    }

    await this.chatSummaryPublisher.publishSummarize(conversationId, totalMessageCount);
  }
}
