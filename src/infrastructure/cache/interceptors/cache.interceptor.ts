import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, from, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { CacheService } from '../cache.service';
import { CACHEABLE_KEY, CacheableOptions } from '../decorators/cacheable.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.getAllAndOverride<CacheableOptions | undefined>(CACHEABLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.buildCacheKey(context, request, options);

    return from(this.cacheService.get(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached !== null) {
          return of(cached);
        }

        return next.handle().pipe(
          tap((result) => {
            if (result !== null && result !== undefined) {
              void this.cacheService.set(cacheKey, result, options.ttlSeconds).catch((error) => {
                this.logger.error(`Error setting cache for key ${cacheKey}:`, error);
              });
            }
          }),
        );
      }),
      catchError(() => next.handle()),
    );
  }

  private buildCacheKey(
    context: ExecutionContext,
    request: Request,
    options: CacheableOptions,
  ): string {
    if (options.key) {
      return options.key(context);
    }

    if (options.prefix) {
      const paramName = options.param ?? 'id';
      const paramValue = request.params?.[paramName] ?? request.query?.[paramName] ?? '';
      return `${options.prefix}:${paramValue}`;
    }

    return `http_cache:${request.originalUrl ?? request.url}`;
  }
}
