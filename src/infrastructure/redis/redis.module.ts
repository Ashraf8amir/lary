import { Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from '@/config/redis.config';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

type RedisConfig = ConfigType<typeof redisConfig>;

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: (config: RedisConfig): Redis => {
        return new Redis({
          host: config.host,
          port: config.port,
          password: config.password || undefined,
          db: config.db,
          maxRetriesPerRequest: 3,
          retryStrategy: (attempts: number) => Math.min(attempts * 100, 3000),
          reconnectOnError: (err: Error) => {
            const targetError = 'READONLY';
            return err.message.includes(targetError);
          },
        });
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
