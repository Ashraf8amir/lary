import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const chatValidationSchema = {
  GEMINI_API_KEY: Joi.string().required(),
  GEMINI_MODEL: Joi.string().default('gemini-3.8-flash'),
  CHAT_SESSION_TTL_SECONDS: Joi.number().default(1800),
};

export default registerAs('chat', () => ({
  geminiApiKey: process.env.GEMINI_API_KEY as string,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  sessionTtlSeconds: Number(process.env.CHAT_SESSION_TTL_SECONDS) || 1800,
}));
