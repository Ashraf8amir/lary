import axios from 'axios';
import * as winston from 'winston';
import TransportStream from 'winston-transport';
import { LOGGER_CONSTANTS } from '../../constants/logger.constants';
import { addRequestId } from '../../formats/request-id.format';
import { LogInfo, SlackTransportOptions } from '../../interfaces/logger.interface';
import { buildSlackPayload } from './slack-payload.builder';

export class SlackTransport extends TransportStream {
  private readonly webhookUrl: string;
  private readonly cooldownMs: number;
  private sentErrorsCache = new Map<string, number>();

  constructor(opts: SlackTransportOptions) {
    super(opts);
    this.webhookUrl = opts.webhookUrl;
    this.cooldownMs = opts.cooldownMs ?? LOGGER_CONSTANTS.SLACK.COOLDOWN_MS;
  }

  private isCriticalError(info: LogInfo): boolean {
    const status = (info.status || info.statusCode) ?? 0;
    const { min, max } = LOGGER_CONSTANTS.SLACK.CLIENT_ERROR_RANGE;

    if (status >= min && status <= max) return false;

    const message = String(info.message || '');
    if (
      message.includes('Cannot GET') ||
      message.includes('Cannot PATCH') ||
      message.includes('404')
    ) {
      return false;
    }
    return true;
  }

  private shouldThrottle(errorMessage: string): boolean {
    const now = Date.now();
    const lastSent = this.sentErrorsCache.get(errorMessage) || 0;
    if (now - lastSent < this.cooldownMs) return true;

    this.sentErrorsCache.set(errorMessage, now);
    if (this.sentErrorsCache.size > LOGGER_CONSTANTS.SLACK.CACHE_MAX_SIZE) {
      const oldestKey = this.sentErrorsCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.sentErrorsCache.delete(oldestKey);
      }
    }
    return false;
  }

  log(info: LogInfo, callback: () => void) {
    setImmediate(() => this.emit('logged', info));
    const messageKey = String(info.message || '');

    if (this.isCriticalError(info) && !this.shouldThrottle(messageKey)) {
      axios.post(this.webhookUrl, buildSlackPayload(info)).catch((err) => {
        process.stderr.write(`[SlackTransport Error]: ${err.response?.data || err.message}\n`);
      });
    }
    callback();
  }
}

export function createSlackTransport(): SlackTransport | null {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return null;

  return new SlackTransport({
    webhookUrl,
    level: 'error',
    format: winston.format.combine(addRequestId(), winston.format.timestamp()),
  });
}
