import appConfig from '@/config/app.config';
import databaseConfig from '@/config/database.config';
import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';

type AppConfig = ConfigType<typeof appConfig>;
type DatabaseConfig = ConfigType<typeof databaseConfig>;

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [databaseConfig.KEY, appConfig.KEY],

      useFactory: (databaseCfg: DatabaseConfig, appCfg: AppConfig) => ({
        uri: databaseCfg.uri,

        retryAttempts: databaseCfg.retryAttempts,
        retryDelay: databaseCfg.retryDelay,

        maxPoolSize: databaseCfg.maxPoolSize,
        minPoolSize: databaseCfg.minPoolSize,

        serverSelectionTimeoutMS: databaseCfg.serverSelectionTimeoutMS,

        retryWrites: true,
        autoIndex: appCfg.nodeEnv !== 'production',
      }),
    }),
  ],
  providers: [DatabaseService],
  exports: [MongooseModule, DatabaseService],
})
export class DatabaseModule {}
