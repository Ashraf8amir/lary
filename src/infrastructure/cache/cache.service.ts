import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { JsonSerializer } from './utils/json.serializer';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly inFlightPromises = new Map<string, Promise<unknown>>();

  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redisService.getClient().get(key);
      return JsonSerializer.deserialize<T>(raw);
    } catch (error) {
      this.logger.error(`Failed to GET cache key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0 || value === undefined) return;

    try {
      const raw = JsonSerializer.serialize(value);
      await this.redisService.getClient().set(key, raw, 'EX', ttlSeconds);
    } catch (error) {
      this.logger.error(`Failed to SET cache key "${key}":`, error);
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length === 0) return;
      await this.redisService.getClient().del(...keys);
    } catch (error) {
      this.logger.error(`Failed to DEL cache keys:`, error);
    }
  }

  async delByPattern(pattern: string): Promise<number> {
    try {
      const client = this.redisService.getClient();
      const stream = client.scanStream({ match: pattern, count: 250 });
      let deletedCount = 0;

      for await (const keys of stream) {
        if ((keys as string[]).length > 0) {
          await client.del(...(keys as string[]));
          deletedCount += (keys as string[]).length;
        }
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to DEL by pattern "${pattern}":`, error);
      return 0;
    }
  }

  async wrap<T>(key: string, ttlSeconds: number, resolver: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    if (this.inFlightPromises.has(key)) {
      return this.inFlightPromises.get(key) as Promise<T>;
    }

    const execPromise = (async () => {
      try {
        const fresh = await resolver();
        if (fresh !== undefined && fresh !== null) {
          await this.set(key, fresh, ttlSeconds);
        }
        return fresh;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, execPromise);
    return execPromise;
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!keys.length) return [];
    try {
      const raws = await this.redisService.getClient().mget(...keys);
      return raws.map((raw) => JsonSerializer.deserialize<T>(raw));
    } catch (error) {
      this.logger.error(`Failed to MGET cache keys:`, error);
      return keys.map(() => null);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redisService.getClient().ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key "${key}":`, error);
      return -2;
    }
  }

  async setIfNotExists(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (ttlSeconds <= 0) return false;

    try {
      const result = await this.redisService.getClient().set(key, value, 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Failed to SETNX cache key "${key}":`, error);
      return false;
    }
  }
}
