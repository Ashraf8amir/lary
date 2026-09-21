import { RedisService } from '@/infrastructure/redis/redis.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

@Injectable()
export class InfrastructureHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly amqpConnection: AmqpConnection,
    private readonly redisService: RedisService,
  ) {}

  async checkRabbitMQ(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const isConnected = Boolean(this.amqpConnection.managedConnection?.isConnected());

    if (isConnected) {
      return indicator.up();
    }

    return indicator.down({ message: 'RabbitMQ connection is down' });
  }

  async checkRedis(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const isReady = this.redisService.isConnected();
      const pong = await this.redisService.getClient().ping();

      if (isReady && pong === 'PONG') {
        return indicator.up();
      }

      return indicator.down({ message: 'Redis is not ready or ping failed' });
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Redis connection error',
      });
    }
  }
}
