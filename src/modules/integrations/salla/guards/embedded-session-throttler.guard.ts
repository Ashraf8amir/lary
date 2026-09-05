import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';

@Injectable()
export class EmbeddedSessionThrottlerGuard extends ThrottlerGuard {
  constructor(storageService: ThrottlerStorage, reflector: Reflector) {
    super(
      { throttlers: [{ name: 'embeddedSession', ttl: 60_000, limit: 5 }] },
      storageService,
      reflector,
    );
  }
}
