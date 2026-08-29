import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private isShuttingDown = false;

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  onApplicationBootstrap() {
    if (this.connection.readyState === 1) {
      this.logger.log('MongoDB connection established successfully');
    }

    this.connection.on('connecting', () => this.logger.log('Connecting to MongoDB...'));

    this.connection.on('disconnected', () => {
      if (!this.isShuttingDown) {
        this.logger.warn('MongoDB connection lost! Attempting to reconnect...');
      }
    });

    this.connection.on('reconnected', () =>
      this.logger.log('Successfully reconnected to the database'),
    );

    this.connection.on('error', (error) =>
      this.logger.error(`Error connecting to the database: ${error.message}`, error.stack),
    );
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;

    if (this.connection.readyState === 1) {
      this.logger.log('Closing MongoDB connection...');
      await this.connection.close();
    }
  }

  isConnected(): boolean {
    return this.connection.readyState === 1;
  }

  getConnectionState(): string {
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[this.connection.readyState] || 'unknown';
  }
}
