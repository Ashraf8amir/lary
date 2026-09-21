import { RabbitMqInfrastructureModule } from '@/infrastructure/rabbitmq/rabbitmq.module';
import { RedisModule } from '@/infrastructure/redis/redis.module';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { InfrastructureHealthIndicator } from './infrastructure-health.indicator';

@Module({
  imports: [TerminusModule, RabbitMqInfrastructureModule, RedisModule],
  controllers: [HealthController],
  providers: [InfrastructureHealthIndicator],
})
export class HealthModule {}
