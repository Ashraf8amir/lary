import {
  HttpStatus,
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuid } from 'uuid';

import { ConfigurationModule } from '@config/configuration.module';
import { DatabaseModule } from '@infrastructure/database/mongoose/database.module';
import { LoggerModule } from '@infrastructure/logger/logger.module';

import { AllExceptionsFilter } from '@common/filters/global-exception.filter';
import { ApiResponseInterceptor } from '@common/interceptors/api-response.interceptor';
import { TimeoutInterceptor } from '@common/interceptors/timeout.interceptor';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';

import { HealthModule } from '@modules/health/health.module';
import { AppService } from './app.service';
import { BusinessException, ErrorCode } from './common';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAccessGuard } from './modules/auth/guards/jwt-auth.guard';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    LoggerModule,

    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req) => (req.headers['x-request-id'] as string) ?? uuid(),
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10_000, limit: 20 },
      { name: 'long', ttl: 60_000, limit: 100 },
    ]),

    HealthModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    AppService,

    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAccessGuard },

    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },

    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,

        transformOptions: {
          enableImplicitConversion: true,
        },

        exceptionFactory: (validationErrors: ValidationError[] = []) => {
          const errors = validationErrors.flatMap((error) =>
            Object.values(error.constraints ?? {}),
          );

          return new BusinessException('Validation failed', {
            statusCode: HttpStatus.BAD_REQUEST,
            errorCode: ErrorCode.VALIDATION_FAILED,
            errors,
          });
        },
      }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('{*path}');
  }
}
