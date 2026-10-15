import appConfig from '@config/app.config';
import swaggerConfig from '@config/swagger.config';
import { INestApplication, Logger } from '@nestjs/common';
import { apiReference } from '@scalar/nestjs-api-reference';
import basicAuth from 'express-basic-auth';
import { buildSwaggerDocument } from './swagger.builder';

export function setupSwagger(app: INestApplication): void {
  const logger = new Logger('SwaggerSetup');

  const isProd = (appConfig()?.nodeEnv || process.env.NODE_ENV) === 'production';

  const rawPath = swaggerConfig()?.path || 'api/v1/docs';
  const formattedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  if (isProd) {
    const user = swaggerConfig()?.basicAuthUser;
    const password = swaggerConfig()?.basicAuthPassword;

    if (!user || !password) {
      logger.error('Authentication credentials are not defined in the production environment.');
      return;
    }

    app.use(
      [formattedPath, `${formattedPath}-json`],
      basicAuth({ users: { [user]: password }, challenge: true }),
    );
  }

  try {
    const document = buildSwaggerDocument(app);

    app.use(
      formattedPath,
      apiReference({
        spec: { content: document },
        theme: 'purple',
        hideModels: false,
        darkMode: true,
      }),
    );

    logger.log(
      `Swagger documentation is available at ${formattedPath} in ${isProd ? 'production' : 'development'} mode.`,
    );
  } catch (error) {
    logger.error(
      'Error occurred while setting up Swagger documentation:',
      error instanceof Error ? error.message : error,
    );
  }
}
