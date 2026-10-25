import { Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { UsageRepository } from '../repositories/usage.repository';
import { UsageDocument } from '../schemas/usage.schema';

@Injectable()
export class UsageService {
  constructor(private readonly usageRepository: UsageRepository) {}

  async getCurrentUsage(
    storeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<UsageDocument | null> {
    return this.usageRepository.findCurrentUsage(storeId, periodStart, periodEnd);
  }

  async getUsageHistory(storeId: string, limit = 12): Promise<UsageDocument[]> {
    return this.usageRepository.findByStoreId(storeId, limit);
  }

  async recordConversation(
    storeId: string,
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date,
    tokens: number,
    session?: ClientSession,
  ): Promise<UsageDocument> {
    return this.usageRepository.recordConversation(
      storeId,
      subscriptionId,
      periodStart,
      periodEnd,
      tokens,
      session,
    );
  }
}
