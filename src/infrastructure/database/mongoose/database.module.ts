import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('database.uri'),

        retryAttempts: configService.get<number>('database.retryAttempts') ?? 5,
        retryDelay: configService.get<number>('database.retryDelay') ?? 1000,

        maxPoolSize: configService.get<number>('database.maxPoolSize') ?? 10,
        minPoolSize: configService.get<number>('database.minPoolSize') ?? 5,

        serverSelectionTimeoutMS:
          configService.get<number>('database.serverSelectionTimeoutMS') ?? 5000,

        retryWrites: true,
        autoIndex: configService.get<string>('app.NODE_ENV') !== 'production',
      }),
    }),
  ],
  providers: [DatabaseService],
  exports: [MongooseModule, DatabaseService],
})
export class DatabaseModule {}
