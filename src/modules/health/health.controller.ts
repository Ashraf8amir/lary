import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';
import { InfrastructureHealthIndicator } from './infrastructure-health.indicator';

@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly infraHealth: InfrastructureHealthIndicator,
  ) {}

  @Public()
  @Get('liveness')
  @HealthCheck()
  checkLiveness(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Public()
  @Get('readiness')
  @HealthCheck()
  checkReadiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),

      () => this.infraHealth.checkRabbitMQ('rabbitmq'),

      () => this.infraHealth.checkRedis('redis'),

      () =>
        this.disk.checkStorage('disk_storage', {
          path: process.platform === 'win32' ? 'C:\\' : '/',
          thresholdPercent: 0.85,
        }),

      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
    ]);
  }
}
