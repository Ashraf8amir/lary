import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, isValidObjectId, type Model, Types } from 'mongoose';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { Subscription, SubscriptionDocument } from '../schemas/subscription.schema';

export interface SubscriptionUpsertPayload {
  storeId: string;
  planId: string;
  sallaSubscriptionId?: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  isTrial: boolean;
  eventAt: Date;
}

@Injectable()
export class SubscriptionsRepository {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  private newerThan(eventAt: Date) {
    return {
      $or: [{ lastEventAt: { $exists: false } }, { lastEventAt: { $lt: eventAt } }],
    };
  }

  async upsert(
    payload: SubscriptionUpsertPayload,
    session?: ClientSession,
  ): Promise<SubscriptionDocument | null> {
    const { storeId, sallaSubscriptionId, planId, eventAt, ...rest } = payload;

    try {
      return await this.subscriptionModel
        .findOneAndUpdate(
          { storeId: new Types.ObjectId(storeId), ...this.newerThan(eventAt) },
          {
            $set: {
              ...rest,
              planId: new Types.ObjectId(planId),
              lastEventAt: eventAt,
              ...(sallaSubscriptionId && { sallaSubscriptionId }),
            },
          },
          { upsert: true, returnDocument: 'after', runValidators: true, session },
        )
        .exec();
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return null;
      throw error;
    }
  }

  async findByStoreId(storeId: string, session?: ClientSession) {
    if (!isValidObjectId(storeId)) return null;
    return this.subscriptionModel
      .findOne({ storeId: new Types.ObjectId(storeId) }, null, { session })
      .exec();
  }

  async updateStatusByStoreId(
    storeId: string,
    status: SubscriptionStatus,
    eventAt: Date,
    onlyTrial = false,
  ) {
    return this.subscriptionModel
      .findOneAndUpdate(
        {
          storeId: new Types.ObjectId(storeId),
          ...(onlyTrial && { isTrial: true }),
          ...this.newerThan(eventAt),
        },
        { $set: { status, lastEventAt: eventAt } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async extendPeriod(storeId: string, startDate: Date, endDate: Date, eventAt: Date) {
    return this.subscriptionModel
      .findOneAndUpdate(
        { storeId: new Types.ObjectId(storeId), ...this.newerThan(eventAt) },
        { $set: { status: SubscriptionStatus.ACTIVE, startDate, endDate, lastEventAt: eventAt } },
        { returnDocument: 'after' },
      )
      .exec();
  }
}
