import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  path: process.env.SWAGGER_PATH || 'api/v1/docs',
  basicAuthUser: process.env.SWAGGER_BASIC_AUTH_USER,
  basicAuthPassword: process.env.SWAGGER_BASIC_AUTH_PASSWORD,
}));
