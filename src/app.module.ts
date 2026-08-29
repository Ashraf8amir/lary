import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/configuration.module';
import { DatabaseModule } from './providers/mongoose/database.module';

@Module({
  imports: [ConfigurationModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
