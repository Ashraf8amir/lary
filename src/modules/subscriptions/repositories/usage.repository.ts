import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, isValidObjectId, type Model, Types } from 'mongoose';
import { Usage, UsageDocument } from '../schemas/usage.schema';

@Injectable()
export class UsageRepository {
  constructor(
    @InjectModel(Usage.name)
    private readonly usageModel: Model<UsageDocument>,
  ) {}

  async findCurrentUsage(
    storeId: string,
    _periodStart: Date,
    _periodEnd: Date,
    session?: ClientSession,
  ): Promise<UsageDocument | null> {
    if (!isValidObjectId(storeId)) return null;

    return this.usageModel
      .findOne(
        {
          storeId: new Types.ObjectId(storeId),
          periodStart: { $lte: new Date() },
          periodEnd: { $gt: new Date() },
        },
        null,
        { session },
      )
      .sort({ createdAt: -1 })
      .exec();
  }

  async recordConversation(
    storeId: string,
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date,
    tokens: number,
    session?: ClientSession,
  ): Promise<UsageDocument> {
    return this.usageModel
      .findOneAndUpdate(
        {
          storeId: new Types.ObjectId(storeId),
          subscriptionId: new Types.ObjectId(subscriptionId),
          periodStart,
          periodEnd,
        },
        { $inc: { aiMessagesCount: 1, tokensUsed: tokens } },
        { upsert: true, returnDocument: 'after', session },
      )
      .exec();
  }
}
