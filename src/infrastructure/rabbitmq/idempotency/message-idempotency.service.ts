import { Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';

import { MessageIdempotencyRepository } from './message-idempotency.repository';
import { MessageProcessingStatus } from './message-idempotency.schema';

@Injectable()
export class MessageIdempotencyService {
  private readonly processingTimeoutMs = 5 * 60 * 1000;

  constructor(private readonly repository: MessageIdempotencyRepository) {}

  async startProcessing(messageId: string, event: string): Promise<boolean> {
    const created = await this.repository.createProcessing(messageId, event);

    if (created) return true;

    const existing = await this.repository.findByMessageId(messageId);

    if (!existing) return false;

    if (existing.status === MessageProcessingStatus.COMPLETED) {
      return false;
    }

    if (existing.status === MessageProcessingStatus.FAILED) {
      await this.repository.deleteByMessageId(messageId);
      return this.repository.createProcessing(messageId, event);
    }

    const staleBefore = new Date(Date.now() - this.processingTimeoutMs);

    return this.repository.reclaimStaleProcessing(messageId, staleBefore);
  }

  async markCompleted(messageId: string, session: ClientSession): Promise<void> {
    await this.repository.markAsCompleted(messageId, session);
  }

  async markFailed(messageId: string): Promise<void> {
    await this.repository.markAsFailed(messageId);
  }

  async releaseForRetry(messageId: string): Promise<void> {
    await this.repository.deleteByMessageId(messageId);
  }
}
