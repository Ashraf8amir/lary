import { RabbitMQConfig, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { MessageIdempotencyRepository } from './idempotency/message-idempotency.repository';
import {
  MessageIdempotency,
  MessageIdempotencySchema,
} from './idempotency/message-idempotency.schema';
import { MessageIdempotencyService } from './idempotency/message-idempotency.service';
import { DOMAINS } from './rabbitmq.domains.config';
import { RabbitMqMessageHandler } from './rabbitmq.message-handler';
import { buildRabbitMqTopology } from './rabbitmq.topology';
import { RabbitMqRetryPolicy } from './retry/rabbitmq-retry.policy';
import { RabbitMqRetryPublisher } from './retry/rabbitmq-retry.publisher';

const { exchanges, queues } = buildRabbitMqTopology(DOMAINS);

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: MessageIdempotency.name,
        schema: MessageIdempotencySchema,
      },
    ]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService): RabbitMQConfig => {
        const isProd = configService.getOrThrow<string>('NODE_ENV') === 'production';
        const rawUri = configService.getOrThrow<string>('RABBITMQ_URI');

        return {
          uri: rawUri.includes(',') ? rawUri.split(',').map((u) => u.trim()) : rawUri,

          connectionInitOptions: {
            wait: true,
            timeout: 15_000,
            reject: isProd,
          },

          connectionManagerOptions: {
            heartbeatIntervalInSeconds: 15,
            reconnectTimeInSeconds: 5,
          },

          exchanges,
          queues,
        };
      },
    }),
  ],

  providers: [
    RabbitMqMessageHandler,
    RabbitMqRetryPolicy,
    RabbitMqRetryPublisher,

    MessageIdempotencyRepository,
    MessageIdempotencyService,
  ],

  exports: [
    RabbitMQModule,
    RabbitMqMessageHandler,
    RabbitMqRetryPolicy,
    RabbitMqRetryPublisher,

    MessageIdempotencyService,
  ],
})
export class RabbitMqInfrastructureModule {}
