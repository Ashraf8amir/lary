import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const sallaValidationSchema = {
  SALLA_CLIENT_ID: Joi.string().required(),
  SALLA_CLIENT_SECRET: Joi.string().required(),
  SALLA_BASE_URL: Joi.string().uri().default('https://api.salla.dev/admin/v2'),
  SALLA_OAUTH_URL: Joi.string().uri().default('https://accounts.salla.sa'),
  SALLA_TOKEN_REFRESH_WINDOW_SECONDS: Joi.number().default(86400),
  SALLA_ENCRYPTION_KEY: Joi.string().hex().length(64).required(),
  SALLA_WEBHOOK_SECRET: Joi.string().required(),
  SALLA_APP_ID: Joi.string().required(),
  SALLA_EMBEDDED_API_URL: Joi.string().uri().default('https://api.salla.dev'),
};

export default registerAs('salla', () => ({
  clientId: process.env.SALLA_CLIENT_ID as string,
  clientSecret: process.env.SALLA_CLIENT_SECRET as string,
  baseUrl: process.env.SALLA_BASE_URL as string,
  oauthUrl: process.env.SALLA_OAUTH_URL as string,
  tokenRefreshWindowSeconds: Number(process.env.SALLA_TOKEN_REFRESH_WINDOW_SECONDS),
  encryptionKey: process.env.SALLA_ENCRYPTION_KEY as string,
  webhookSecret: process.env.SALLA_WEBHOOK_SECRET as string,
  appId: process.env.SALLA_APP_ID as string,
  embeddedApiUrl: process.env.SALLA_EMBEDDED_API_URL as string,
}));
