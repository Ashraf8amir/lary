import { Nack } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';

import { NonRetryableMessagingError } from '@shared/messaging/errors/non-retryable-messaging.error';
import { RetryableMessagingError } from '@shared/messaging/errors/retryable-messaging.error';
import { RabbitMqMessage } from '@shared/messaging/message.contract';

import { MessageIdempotencyService } from './idempotency/message-idempotency.service';
import { RabbitMqRetryPolicy } from './retry/rabbitmq-retry.policy';
import { RabbitMqRetryPublisher } from './retry/rabbitmq-retry.publisher';

@Injectable()
export class RabbitMqMessageHandler {
  private readonly logger = new Logger(RabbitMqMessageHandler.name);

  constructor(
    private readonly retryPolicy: RabbitMqRetryPolicy,
    private readonly retryPublisher: RabbitMqRetryPublisher,
    private readonly idempotencyService: MessageIdempotencyService,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async execute<T>(
    message: RabbitMqMessage<T>,
    handler: (session: ClientSession) => Promise<void>,
  ): Promise<void | Nack> {
    const shouldProcess = await this.idempotencyService.startProcessing(
      message.messageId,
      message.event,
    );

    if (!shouldProcess) {
      this.logger.warn(`Duplicate or active message ignored: ${message.messageId}`);
      return;
    }

    try {
      await this.connection.transaction(async (session) => {
        await handler(session);

        await this.idempotencyService.markCompleted(message.messageId, session);
      });

      this.logger.debug(`Message processed successfully: ${message.messageId}`);

      return;
    } catch (error) {
      return this.handleProcessingError(message, error);
    }
  }

  private async handleProcessingError<T>(
    message: RabbitMqMessage<T>,
    error: unknown,
  ): Promise<Nack | void> {
    if (error instanceof NonRetryableMessagingError) {
      this.logger.error(`Non-retryable message failure: ${message.messageId}`, error.stack);

      await this.idempotencyService.markFailed(message.messageId);

      return new Nack(false);
    }

    if (error instanceof RetryableMessagingError) {
      return this.handleRetryableError(message, error);
    }

    this.logger.warn(
      `Unknown message failure treated as retryable: ${message.messageId}`,
      error instanceof Error ? error.stack : undefined,
    );

    return this.handleRetryableError(
      message,
      new RetryableMessagingError(
        error instanceof Error ? error.message : 'Unknown processing error',
      ),
    );
  }

  private async handleRetryableError<T>(
    message: RabbitMqMessage<T>,
    error: RetryableMessagingError,
  ): Promise<void | Nack> {
    const decision = this.retryPolicy.decide(message.event, message.attempt);

    if (!decision.shouldRetry) {
      this.logger.error(`Message retry attempts exhausted: ${message.messageId}`, error.stack);

      await this.idempotencyService.markFailed(message.messageId);

      return new Nack(false);
    }

    try {
      await this.retryPublisher.publish(
        {
          ...message,
          attempt: decision.nextAttempt!,
        },
        decision.retryExchange!,
        decision.originalRoutingKey!,
      );

      await this.idempotencyService.releaseForRetry(message.messageId);

      this.logger.warn(`Message scheduled for retry: ${message.messageId}`);

      return;
    } catch (retryError) {
      this.logger.error(
        `Failed to publish message to retry queue: ${message.messageId}`,
        retryError instanceof Error ? retryError.stack : undefined,
      );

      await this.idempotencyService.markFailed(message.messageId);

      return new Nack(false);
    }
  }
}
