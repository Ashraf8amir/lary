import { RabbitMQConfig, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Environment } from '@/common/enums/environment.enum';
import appConfig from '@/config/app.config';
import rabbitmqConfig from '@/config/rabbitmq.config';
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
type RabbitMqEnvConfig = ConfigType<typeof rabbitmqConfig>;
type AppConfig = ConfigType<typeof appConfig>;

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: MessageIdempotency.name, schema: MessageIdempotencySchema },
    ]),
    RabbitMQModule.forRootAsync({
      inject: [rabbitmqConfig.KEY, appConfig.KEY],

      useFactory: (rabbitmqCfg: RabbitMqEnvConfig, appCfg: AppConfig): RabbitMQConfig => {
        const isProd = appCfg.nodeEnv === Environment.Production;
        const rawUri = rabbitmqCfg.uri;

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
