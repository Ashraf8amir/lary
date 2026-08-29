import TransportStream from 'winston-transport';

export interface SlackTransportOptions extends TransportStream.TransportStreamOptions {
  webhookUrl: string;
  cooldownMs?: number;
}

export interface LogInfo {
  level: string;
  message: any;
  status?: number;
  statusCode?: number;
  requestId?: string;
  stack?: string | string[];
  timestamp?: string | Date;
  [key: string]: any;
}
