import { DatabaseService } from '@/infrastructure/database/mongoose/database.service';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppStartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger('AppStartup');

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  onApplicationBootstrap(): void {
    const env = this.configService.get<string>('app.nodeEnv');
    const port = this.configService.get<number>('app.port');
    const memoryMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    this.logger.log('────────────────────────────────────────────');
    this.logger.log(`  Environment : ${env}`);
    this.logger.log(`  Port        : ${port}`);
    this.logger.log(`  Node        : ${process.version} (${process.platform})`);
    this.logger.log(`  Memory Used : ${memoryMb} MB`);
    this.logger.log(`  Database    : ${this.databaseService.getConnectionState()}`);
    this.logger.log('────────────────────────────────────────────');

    if (!this.databaseService.isConnected()) {
      throw new Error('Critical: Database connection failed during startup.');
    }
  }
}
