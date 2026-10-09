import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const meilisearchValidationSchema = {
  MEILI_HOST: Joi.string().uri().required(),
  MEILI_MASTER_KEY: Joi.string().required(),
};

export default registerAs('meilisearch', () => ({
  host: process.env.MEILI_HOST as string,
  apiKey: process.env.MEILI_MASTER_KEY as string,
}));
