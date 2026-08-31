import { Logger, RequestMethod, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('app.nodeEnv') || process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const allowedOrigins = configService.get<string>('app.allowedOrigins');
  const port = configService.get<number>('app.port') || Number(process.env.PORT) || 3000;

  app.enableCors({
    origin: isProduction && allowedOrigins ? allowedOrigins.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });

  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));
  app.use(compression());
  app.use(cookieParser());

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health/*', method: RequestMethod.GET }],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`Server running on port ${port} [${nodeEnv}]`);
}

process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;

  new Logger('UnhandledRejection').error(`Unhandled Promise Rejection: ${message}`, stack);
});

process.on('uncaughtException', (error: Error) => {
  new Logger('UncaughtException').error(error.message, error.stack);
  process.exit(1);
});

bootstrap().catch((error: Error) => {
  new Logger('Bootstrap').error(`Error during bootstrap: ${error.message}`, error.stack);
  process.exit(1);
});
