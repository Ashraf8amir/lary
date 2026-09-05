import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const redisValidationSchema = {
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  REDIS_USERNAME: Joi.string().optional().allow(''),
  DATABASE_REDIS_DB: Joi.number().default(0),
};

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST as string,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  db: Number(process.env.DATABASE_REDIS_DB),
}));
