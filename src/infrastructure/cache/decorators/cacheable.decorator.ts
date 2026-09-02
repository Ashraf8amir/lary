import { ExecutionContext, SetMetadata } from '@nestjs/common';

export const CACHEABLE_KEY = 'cacheable_options';

export interface CacheableOptions {
  prefix?: string;
  param?: string;
  key?: (context: ExecutionContext) => string;
  ttlSeconds: number;
}

export const Cacheable = (options: CacheableOptions | number) => {
  const normalizedOptions: CacheableOptions =
    typeof options === 'number' ? { ttlSeconds: options } : options;

  return SetMetadata(CACHEABLE_KEY, normalizedOptions);
};
