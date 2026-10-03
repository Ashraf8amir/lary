import { CHAT_CONVERSATION_EXCHANGE } from '@/infrastructure/rabbitmq/rabbitmq.constant';
import { RabbitMqMessageHandler } from '@/infrastructure/rabbitmq/rabbitmq.message-handler';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { NonRetryableMessagingError } from '@shared/messaging/errors/non-retryable-messaging.error';
import { RetryableMessagingError } from '@shared/messaging/errors/retryable-messaging.error';
import type { RabbitMqMessage } from '@shared/messaging/message.contract';
import { ROUTING_KEYS } from '@shared/messaging/routing-keys';
import { ConversationSessionService } from '../../services/conversation-store';
import { ConversationSummaryService } from '../../services/conversation-summarizer';
import { ChatSummarizePayload } from '../publishers/chat-summary.publisher';

@Injectable()
export class ChatSummaryConsumer {
  private readonly logger = new Logger(ChatSummaryConsumer.name);

  constructor(
    private readonly messageHandler: RabbitMqMessageHandler,
    private readonly summaryService: ConversationSummaryService,
    private readonly sessionService: ConversationSessionService,
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
    conversationId,
    totalMessagesCount,
  }: ChatSummarizePayload): Promise<void> {
    this.logger.log(`Processing summary for conversation: ${conversationId}`);

    const [allMessages, existingSummary] = await Promise.all([
      this.sessionService.getHistory(conversationId),
      this.sessionService.getSummary(conversationId),
    ]);

    if (!allMessages || allMessages.length === 0) {
      throw new NonRetryableMessagingError(`No history found for conversation: ${conversationId}`);
    }

    let newSummary: string | null = null;
    try {
      newSummary = await this.summaryService.summarize(allMessages, existingSummary);
    } catch (error) {
      throw new RetryableMessagingError(
        error instanceof Error ? error.message : 'Gemini summarization failed',
      );
    }

    if (newSummary) {
      await Promise.all([
        this.sessionService.setSummary(conversationId, newSummary),
        this.sessionService.setLastSummarizedCount(conversationId, totalMessagesCount),
      ]);
      this.logger.log(`Summary updated successfully in Redis for conversation: ${conversationId}`);
    }
  }
}
