import { Environment } from '@common/enums/environment.enum';
import { consoleTransport } from './transports/console.transport';
import { fileTransports } from './transports/file.transport';
import { createSlackTransport } from './transports/slack/slack.transport';

export function createWinstonConfig() {
  const isProduction = process.env.NODE_ENV === Environment.Production;
  const slackTransport = createSlackTransport();

  return {
    level: isProduction ? 'info' : 'debug',
    transports: isProduction
      ? [consoleTransport, ...fileTransports, ...(slackTransport ? [slackTransport] : [])]
      : [consoleTransport],
  };
}
