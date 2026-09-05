import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const databaseValidationSchema = {
  DATABASE_URI: Joi.string().required(),
  DATABASE_RETRY_ATTEMPTS: Joi.number().default(5),
  DATABASE_RETRY_DELAY: Joi.number().default(1000),
  DATABASE_MAX_POOL_SIZE: Joi.number().default(10),
  DATABASE_MIN_POOL_SIZE: Joi.number().default(5),
  DATABASE_SERVER_SELECTION_TIMEOUT_MS: Joi.number().default(5000),
};

export default registerAs('database', () => ({
  uri: process.env.DATABASE_URI as string,
  retryAttempts: Number(process.env.DATABASE_RETRY_ATTEMPTS),
  retryDelay: Number(process.env.DATABASE_RETRY_DELAY),
  maxPoolSize: Number(process.env.DATABASE_MAX_POOL_SIZE),
  minPoolSize: Number(process.env.DATABASE_MIN_POOL_SIZE),
  serverSelectionTimeoutMS: Number(process.env.DATABASE_SERVER_SELECTION_TIMEOUT_MS),
}));
