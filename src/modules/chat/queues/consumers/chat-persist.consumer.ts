import chatConfig from '@config/chat.config';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NonRetryableMessagingError } from '@shared/messaging/errors/non-retryable-messaging.error';
import type { RabbitMqMessage } from '@shared/messaging/message.contract';
import { ROUTING_KEYS } from '@shared/messaging/routing-keys';
import { ClientSession } from 'mongoose';
import { isValidObjectId } from 'mongoose';

import { CHAT_CONVERSATION_EXCHANGE } from '@/infrastructure/rabbitmq/rabbitmq.constant';
import { RabbitMqMessageHandler } from '@/infrastructure/rabbitmq/rabbitmq.message-handler';
import { SubscriptionsService } from '@/modules/subscriptions/services/subscriptions.service';

import type { ChatPersistPayload } from '../../interfaces/chat.interface';
import { ChatPersistenceRepository } from '../../repositories/chat-persistence.repository';

const MILLIS_PER_DAY = 86_400_000;

@Injectable()
export class ChatPersistConsumer {
  private readonly logger = new Logger(ChatPersistConsumer.name);

  constructor(
    private readonly messageHandler: RabbitMqMessageHandler,
    private readonly persistenceRepository: ChatPersistenceRepository,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(chatConfig.KEY)
    private readonly config: ConfigType<typeof chatConfig>,
  ) {}

  @RabbitSubscribe({
    exchange: CHAT_CONVERSATION_EXCHANGE,
    routingKey: ROUTING_KEYS.ROUTING_KEY_CHAT_CONVERSATION_PERSIST,
    queue: 'chat.conversation.persist.queue',
    createQueueIfNotExists: false,
  })
  async handlePersistMessage(message: RabbitMqMessage<ChatPersistPayload>): Promise<void | Nack> {
    return this.messageHandler.execute(message, (session) =>
      this.archiveTurn(message.payload, session),
    );
  }

  private async archiveTurn(payload: ChatPersistPayload, session: ClientSession): Promise<void> {
    const { storeId, conversationId, userMessage, assistantMessage, cards = [] } = payload;

    if (!isValidObjectId(storeId) || !conversationId?.trim()) {
      throw new NonRetryableMessagingError(
        'Persist payload is missing a valid storeId or conversationId',
      );
    }

    if (!userMessage?.trim() && !assistantMessage?.trim()) {
      throw new NonRetryableMessagingError('Persist payload contains no message content');
    }

    const retentionDays =
      (await this.subscriptionsService.getHistoryRetentionDays(storeId)) ??
      this.config.defaultRetentionDays;

    const archivedAt = new Date();
    const expiresAt =
      retentionDays === -1
        ? undefined
        : new Date(archivedAt.getTime() + retentionDays * MILLIS_PER_DAY);

    await this.persistenceRepository.archiveTurn(
      {
        storeId,
        conversationId,
        userMessage,
        assistantMessage,
        cards,
        archivedAt,
        expiresAt,
      },
      session,
    );

    this.logger.log(
      `Archived chat turn for store ${storeId}, conversation ${conversationId}` +
        (expiresAt ? ` (expires ${expiresAt.toISOString()})` : ' (retained indefinitely)'),
    );
  }
}
