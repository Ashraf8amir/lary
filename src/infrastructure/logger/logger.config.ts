import { Environment } from '@common/enums/environment.enum';
import * as winston from 'winston';
import { addRequestId } from './formats/request-id.format';
import { createConsoleTransport } from './transports/console.transport';
import { createFileTransports } from './transports/file.transport';
import { SlackTransport } from './transports/slack/slack.transport';

export function createWinstonConfig(): winston.LoggerOptions {
  const isProduction = process.env.NODE_ENV === Environment.Production;
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  const transports: winston.transport[] = [createConsoleTransport()];

  if (isProduction) {
    transports.push(...createFileTransports());
    if (webhookUrl) {
      transports.push(
        new SlackTransport({
          webhookUrl,
          level: 'error',
          format: winston.format.combine(addRequestId(), winston.format.timestamp()),
        }),
      );
    }
  }

  return {
    level: isProduction ? 'info' : 'debug',
    transports,
  };
}
