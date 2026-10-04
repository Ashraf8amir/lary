import { CHAT_CONVERSATION_EXCHANGE } from '@/infrastructure/rabbitmq/rabbitmq.constant';
import { RabbitMqMessageHandler } from '@/infrastructure/rabbitmq/rabbitmq.message-handler';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { RetryableMessagingError } from '@shared/messaging/errors/retryable-messaging.error';
import type { RabbitMqMessage } from '@shared/messaging/message.contract';
import { ROUTING_KEYS } from '@shared/messaging/routing-keys';
import type { ChatSummarizePayload } from '../../interfaces/chat.interface';
import { ConversationStore } from '../../services/conversation-store';
import { ConversationSummarizer } from '../../services/conversation-summarizer';

@Injectable()
export class ChatSummaryConsumer {
  private readonly logger = new Logger(ChatSummaryConsumer.name);

  constructor(
    private readonly messageHandler: RabbitMqMessageHandler,
    private readonly conversationSummarizer: ConversationSummarizer,
    private readonly conversationStore: ConversationStore,
  ) {}

  @RabbitSubscribe({
    exchange: CHAT_CONVERSATION_EXCHANGE,
    routingKey: ROUTING_KEYS.ROUTING_KEY_CHAT_CONVERSATION_SUMMARIZE,
    queue: 'chat.conversation.summarize.queue',
    createQueueIfNotExists: false,
  })
  async handleSummarizeMessage(
    message: RabbitMqMessage<ChatSummarizePayload>,
  ): Promise<void | Nack> {
    return this.messageHandler.executeWithoutTransaction(message, () =>
      this.processSummarize(message.payload),
    );
  }

  private async processSummarize({
    storeId,
    conversationId,
    totalMessagesCount,
  }: ChatSummarizePayload): Promise<void> {
    this.logger.log(`Processing summary for store: ${storeId}, conversation: ${conversationId}`);

    const [existingSummary, lastSummarizedCount] = await Promise.all([
      this.conversationStore.getSummary(storeId, conversationId),
      this.conversationStore.getLastSummarizedCount(storeId, conversationId),
    ]);

    if (totalMessagesCount <= lastSummarizedCount) {
      this.logger.debug(
        `Skipping summary for ${conversationId}: already summarized up to ${lastSummarizedCount}`,
      );
      return;
    }

    const unsummarizedMessages = await this.conversationStore.getHistory(
      storeId,
      conversationId,
      lastSummarizedCount,
      totalMessagesCount - 1,
    );

    if (unsummarizedMessages.length === 0) {
      return;
    }

    let newSummary: string | null = null;
    try {
      newSummary = await this.conversationSummarizer.summarize(
        unsummarizedMessages,
        existingSummary,
      );
    } catch (error) {
      throw new RetryableMessagingError(
        error instanceof Error ? error.message : 'Gemini summarization failed',
      );
    }

    const updates: Promise<void>[] = [
      this.conversationStore.setLastSummarizedCount(storeId, conversationId, totalMessagesCount),
    ];

    if (newSummary) {
      updates.push(this.conversationStore.setSummary(storeId, conversationId, newSummary));
    }

    await Promise.all(updates);

    this.logger.log(
      `Summary state updated in Redis for store: ${storeId}, conversation: ${conversationId} (up to message ${totalMessagesCount})`,
    );
  }
}
