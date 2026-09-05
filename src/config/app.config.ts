import { Environment } from '@common/enums/environment.enum';
import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const appValidationSchema = {
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid(...Object.values(Environment))
    .required(),
  APP_NAME: Joi.string().required(),
  SLACK_WEBHOOK_URL: Joi.string().uri().required(),
  APP_ALLOWED_ORIGINS: Joi.string().optional().allow(''),
  COOKIE_DOMAIN: Joi.string().optional().allow(''),
};

export default registerAs('app', () => ({
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV as Environment,
  appName: process.env.APP_NAME as string,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL as string,
  allowedOrigins: process.env.APP_ALLOWED_ORIGINS as string | undefined,
  cookieDomain: process.env.COOKIE_DOMAIN as string | undefined,
}));
