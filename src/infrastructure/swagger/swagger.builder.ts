import appConfig from '@config/app.config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { API_TAGS, SWAGGER_DESCRIPTION } from './swagger.constant';

export function buildSwaggerDocument(app: INestApplication): OpenAPIObject {
  const builder = new DocumentBuilder()
    .setTitle('Lary API')
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion('1.0.0')
    .addServer(appConfig().appUrl, `${appConfig().nodeEnv.toUpperCase()} Server`)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter the JWT Bearer token here',
        in: 'header',
      },
      'access-token',
    )
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      description: 'Enter the refresh token here',
    });
  API_TAGS.forEach((tag) => {
    builder.addTag(tag.name, tag.description);
  });

  return SwaggerModule.createDocument(app, builder.build());
}
