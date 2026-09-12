import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const rabbitmqValidationSchema = {
  RABBITMQ_URI: Joi.string().uri().required(),
};

export default registerAs('rabbitmq', () => ({
  uri: process.env.RABBITMQ_URI as string,
}));
