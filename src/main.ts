import { Logger, RequestMethod, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import appConfig from './config/app.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const appCfg = app.get(appConfig.KEY);
  const nodeEnv = appCfg.nodeEnv || process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const allowedOrigins = appCfg.allowedOrigins;
  const port = appCfg.port || Number(process.env.PORT) || 3000;

  app.enableCors({
    origin: isProduction && allowedOrigins ? allowedOrigins.split(',').map((o: string) => o.trim()) : true,
    credentials: true,
  });

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));
  app.use(compression());
  app.use(cookieParser());

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health/*path', method: RequestMethod.GET }],
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
