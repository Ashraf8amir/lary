import { RabbitMqEventPublisherService } from '@/infrastructure/rabbitmq/publisher/rabbitmq-event-publisher.service';
import { CHAT_CONVERSATION_EXCHANGE } from '@/infrastructure/rabbitmq/rabbitmq.constant';
import { Injectable } from '@nestjs/common';
import { EVENTS } from '@shared/messaging/event.types';
import { ROUTING_KEYS } from '@shared/messaging/routing-keys';
import type { ChatSummarizePayload } from '../../interfaces/chat.interface';

@Injectable()
export class ChatSummaryPublisher {
  constructor(private readonly publisher: RabbitMqEventPublisherService) {}

  async publishSummarize(
    storeId: string,
    conversationId: string,
    totalMessagesCount: number,
  ): Promise<void> {
    await this.publisher.publish<ChatSummarizePayload>(
      CHAT_CONVERSATION_EXCHANGE,
      ROUTING_KEYS.ROUTING_KEY_CHAT_CONVERSATION_SUMMARIZE,
      EVENTS.CHAT_CONVERSATION_SUMMARIZE,
      {
        storeId,
        conversationId,
        totalMessagesCount,
      },
    );
  }
}
