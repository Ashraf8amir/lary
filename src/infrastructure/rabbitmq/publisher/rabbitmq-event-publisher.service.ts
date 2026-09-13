import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { RabbitMqMessage } from '@shared/messaging/message.contract';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RabbitMqEventPublisherService {
  private readonly logger = new Logger(RabbitMqEventPublisherService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publish<T>(exchange: string, routingKey: string, event: string, payload: T): Promise<void> {
    const messageId = randomUUID();

    const message: RabbitMqMessage<T> = {
      messageId,
      correlationId: messageId,
      event,
      occurredAt: new Date().toISOString(),
      attempt: 1,
      payload,
    };

    this.logger.debug(`Publishing "${event}" (${messageId}) to ${exchange}/${routingKey}`);
    await this.amqpConnection.publish(exchange, routingKey, message);
  }
}
