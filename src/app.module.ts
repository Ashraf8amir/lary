import { AllExceptionsFilter } from '@common';
import { ConfigurationModule } from '@config/configuration.module';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DatabaseModule } from '@providers/mongoose/database.module';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuid } from 'uuid';

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req) => (req.headers['x-request-id'] as string) ?? uuid(),
      },
    }),
  ],
  controllers: [],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
