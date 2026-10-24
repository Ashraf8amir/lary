import { Injectable } from '@nestjs/common';
import { EVENTS } from '@shared/messaging/event.types';
import { ROUTING_KEYS } from '@shared/messaging/routing-keys';

import { RabbitMqEventPublisherService } from '@/infrastructure/rabbitmq/publisher/rabbitmq-event-publisher.service';
import { CHAT_CONVERSATION_EXCHANGE } from '@/infrastructure/rabbitmq/rabbitmq.constant';

import type { ChatPersistPayload } from '../../interfaces/chat.interface';

@Injectable()
export class ChatPersistPublisher {
  constructor(private readonly publisher: RabbitMqEventPublisherService) {}

  async publishPersist(payload: ChatPersistPayload): Promise<void> {
    await this.publisher.publish<ChatPersistPayload>(
      CHAT_CONVERSATION_EXCHANGE,
      ROUTING_KEYS.ROUTING_KEY_CHAT_CONVERSATION_PERSIST,
      EVENTS.CHAT_CONVERSATION_PERSIST,
      payload,
    );
  }
}
