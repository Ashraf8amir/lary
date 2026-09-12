import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { RabbitMqMessage } from '@shared/messaging/message.contract';

@Injectable()
export class RabbitMqRetryPublisher {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publish(message: RabbitMqMessage<unknown>, exchange: string, routingKey: string): Promise<void> {
    await this.amqpConnection.publish(exchange, routingKey, message);
  }
}
