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
});
