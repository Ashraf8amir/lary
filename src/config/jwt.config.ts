import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const jwtValidationSchema = {
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRATION: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRATION: Joi.string().required(),
};

export default registerAs('jwt', () => ({
  access: {
    secret: process.env.JWT_ACCESS_SECRET as string,
    expiration: process.env.JWT_ACCESS_EXPIRATION as string,
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET as string,
    expiration: process.env.JWT_REFRESH_EXPIRATION as string,
  },
}));
