import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const jwtValidationSchema = {
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRATION: Joi.string().required().default('4h'),
};

export default registerAs('jwt', () => ({
  access: {
    secret: process.env.JWT_ACCESS_SECRET as string,
    expiration: process.env.JWT_ACCESS_EXPIRATION as string,
  },
}));
