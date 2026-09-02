import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  onApplicationBootstrap(): void {
    this.client.on('connect', () => this.logger.log('Redis connection established successfully'));
    this.client.on('ready', () => this.logger.log('Redis client ready to receive commands'));
    this.client.on('reconnecting', () => this.logger.warn('Reconnecting to Redis...'));
    this.client.on('error', (error: Error) =>
      this.logger.error(`Redis error: ${error.message}`, error.stack),
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status === 'ready' || this.client.status === 'connecting') {
      await this.client.quit();
      this.logger.log('Redis connection closed gracefully');
    }
  }

  getClient(): Redis {
    return this.client;
  }

  isConnected(): boolean {
    return this.client.status === 'ready';
  }
}
