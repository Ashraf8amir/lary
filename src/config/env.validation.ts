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
});
