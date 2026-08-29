import axios from 'axios';
import TransportStream from 'winston-transport';
import { LOGGER_CONSTANTS } from '../../constants/logger.constants';
import { LogInfo, SlackTransportOptions } from '../../interfaces/logger.interface';
import { buildSlackPayload } from './slack-payload.builder';

export class SlackTransport extends TransportStream {
  private readonly webhookUrl: string;
  private readonly cooldownMs: number;
  private readonly sentErrorsCache = new Map<string, number>();

  constructor(opts: SlackTransportOptions) {
    super(opts);
    this.webhookUrl = opts.webhookUrl;
    this.cooldownMs = opts.cooldownMs ?? LOGGER_CONSTANTS.SLACK.COOLDOWN_MS;
  }

  private isCriticalError(info: LogInfo): boolean {
    const status =
      info.status ??
      info.statusCode ??
      (typeof info.message === 'object' ? info.message?.statusCode : undefined);

    if (
      status &&
      status >= LOGGER_CONSTANTS.SLACK.CLIENT_ERROR_RANGE.min &&
      status <= LOGGER_CONSTANTS.SLACK.CLIENT_ERROR_RANGE.max
    ) {
      return false;
    }
    return true;
  }

  private shouldThrottle(errorMessage: string): boolean {
    const now = Date.now();
    const lastSent = this.sentErrorsCache.get(errorMessage);

    if (lastSent && now - lastSent < this.cooldownMs) {
      return true;
    }

    if (this.sentErrorsCache.size >= LOGGER_CONSTANTS.SLACK.CACHE_MAX_SIZE) {
      for (const [key, timestamp] of this.sentErrorsCache.entries()) {
        if (now - timestamp >= this.cooldownMs) {
          this.sentErrorsCache.delete(key);
        }
      }
      if (this.sentErrorsCache.size >= LOGGER_CONSTANTS.SLACK.CACHE_MAX_SIZE) {
        const oldestKey = this.sentErrorsCache.keys().next().value;
        if (oldestKey) this.sentErrorsCache.delete(oldestKey);
      }
    }

    this.sentErrorsCache.set(errorMessage, now);
    return false;
  }

  log(info: LogInfo, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    const messageKey =
      typeof info.message === 'string' ? info.message : JSON.stringify(info.message);

    if (this.isCriticalError(info) && !this.shouldThrottle(messageKey)) {
      axios.post(this.webhookUrl, buildSlackPayload(info)).catch((err) => {
        process.stderr.write(`[SlackTransport Error]: ${err.response?.data || err.message}\n`);
      });
    }

    callback();
  }
}
