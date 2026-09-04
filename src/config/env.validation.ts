import { Environment } from '@common/enums/environment.enum';
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().required().default(3000).messages({
    'number.base': 'PORT must be a number',
    'any.required': 'PORT is required',
  }),
  NODE_ENV: Joi.string()
    .valid(...Object.values(Environment))
    .required()
    .messages({
      'any.only': 'NODE_ENV must be one of development, production, test',
      'any.required': 'NODE_ENV is required',
    }),
  APP_NAME: Joi.string().required().messages({
    'any.required': 'APP_NAME is required',
  }),

  SLACK_WEBHOOK_URL: Joi.string().uri().required().messages({
    'string.uri': 'SLACK_WEBHOOK_URL must be a valid URL',
    'any.required': 'SLACK_WEBHOOK_URL is required',
  }),

  DATABASE_URI: Joi.string().required().messages({
    'any.required': 'DATABASE_URI is required',
  }),
  DATABASE_RETRY_ATTEMPTS: Joi.number().optional().default(5).messages({
    'number.base': 'DATABASE_RETRY_ATTEMPTS must be a number',
  }),
  DATABASE_RETRY_DELAY: Joi.number().optional().default(1000).messages({
    'number.base': 'DATABASE_RETRY_DELAY must be a number',
  }),
  DATABASE_MAX_POOL_SIZE: Joi.number().optional().default(10).messages({
    'number.base': 'DATABASE_MAX_POOL_SIZE must be a number',
  }),
  DATABASE_MIN_POOL_SIZE: Joi.number().optional().default(5).messages({
    'number.base': 'DATABASE_MIN_POOL_SIZE must be a number',
  }),
  DATABASE_SERVER_SELECTION_TIMEOUT_MS: Joi.number().optional().default(5000).messages({
    'number.base': 'DATABASE_SERVER_SELECTION_TIMEOUT_MS must be a number',
  }),

  JWT_ACCESS_SECRET: Joi.string().required().messages({
    'any.required': 'JWT_ACCESS_SECRET is required',
  }),
  JWT_ACCESS_EXPIRATION: Joi.string().required().messages({
    'any.required': 'JWT_ACCESS_EXPIRATION is required',
  }),
  JWT_REFRESH_SECRET: Joi.string().required().messages({
    'any.required': 'JWT_REFRESH_SECRET is required',
  }),
  JWT_REFRESH_EXPIRATION: Joi.string().required().messages({
    'any.required': 'JWT_REFRESH_EXPIRATION is required',
  }),

  REDIS_HOST: Joi.string().required().messages({
    'any.required': 'REDIS_HOST is required',
  }),
  REDIS_PORT: Joi.number().required().messages({
    'number.base': 'REDIS_PORT must be a number',
    'any.required': 'REDIS_PORT is required',
  }),
  REDIS_PASSWORD: Joi.string().optional().allow('').messages({
    'string.base': 'REDIS_PASSWORD must be a string',
  }),
  REDIS_USERNAME: Joi.string().optional().allow('').messages({
    'string.base': 'REDIS_USERNAME must be a string',
  }),
  DATABASE_REDIS_DB: Joi.number().optional().default(0).messages({
    'number.base': 'DATABASE_REDIS_DB must be a number',
  }),

  SALLA_CLIENT_ID: Joi.string().required().messages({
    'any.required': 'SALLA_CLIENT_ID is required',
  }),
  SALLA_CLIENT_SECRET: Joi.string().required().messages({
    'any.required': 'SALLA_CLIENT_SECRET is required',
  }),
  SALLA_BASE_URL: Joi.string().uri().optional().default('https://api.salla.dev/admin/v2').messages({
    'string.uri': 'SALLA_BASE_URL must be a valid URL',
  }),
  SALLA_OAUTH_URL: Joi.string().uri().optional().default('https://accounts.salla.sa').messages({
    'string.uri': 'SALLA_OAUTH_URL must be a valid URL',
  }),
  SALLA_TOKEN_REFRESH_WINDOW: Joi.number().optional().default(86400).messages({
    'number.base': 'SALLA_TOKEN_REFRESH_WINDOW must be a number',
  }),
  SALLA_ENCRYPTION_KEY: Joi.string().hex().length(64).required().messages({
    'string.hex': 'SALLA_ENCRYPTION_KEY must be a valid hex string',
    'string.length': 'SALLA_ENCRYPTION_KEY must be 64 hex characters (32 bytes)',
    'any.required': 'SALLA_ENCRYPTION_KEY is required',
  }),
  SALLA_WEBHOOK_SECRET: Joi.string().required().messages({
    'any.required': 'SALLA_WEBHOOK_SECRET is required',
  }),
});
