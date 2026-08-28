import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { default as configuration } from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
  ],
})
export class ConfigurationModule {}
