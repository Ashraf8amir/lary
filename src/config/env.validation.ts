import * as Joi from 'joi';
import { appValidationSchema } from './app.config';
import { databaseValidationSchema } from './database.config';
import { jwtValidationSchema } from './jwt.config';
import { rabbitmqValidationSchema } from './rabbitmq.config';
import { redisValidationSchema } from './redis.config';
import { sallaValidationSchema } from './salla.config';

export const envValidationSchema = Joi.object({
  ...appValidationSchema,
  ...databaseValidationSchema,
  ...jwtValidationSchema,
  ...redisValidationSchema,
  ...sallaValidationSchema,
  ...rabbitmqValidationSchema,
});
