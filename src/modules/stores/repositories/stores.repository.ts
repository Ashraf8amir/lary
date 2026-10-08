import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Types, type Model } from 'mongoose';
import { StorePlatform, StoreStatus } from '../enums/stores.enums';
import type {
  CreateStoreInput,
  StoreIdAndStatus,
  UpdateStoreInput,
} from '../interfaces/stores.interfaces';
import { Store, StoreDocument } from '../schemas/store.schema';

@Injectable()
export class StoresRepository {
  constructor(
    @InjectModel(Store.name)
    private readonly storeModel: Model<StoreDocument>,
  ) {}

  async create(data: CreateStoreInput): Promise<StoreDocument> {
    return this.storeModel.create({
      ...data,
      ownerId: new Types.ObjectId(data.ownerId),
    });
  }

  async upsertByMerchantId(data: CreateStoreInput): Promise<StoreDocument> {
    if (!data.merchantId) {
      return this.create(data);
    }

    return this.storeModel
      .findOneAndUpdate(
        {
          platform: data.platform,
          merchantId: data.merchantId.trim(),
        },
        {
          $set: {
            name: data.name,
            ownerId: new Types.ObjectId(data.ownerId),
            status: data.status ?? StoreStatus.Active,
            ...(data.plan !== undefined && { plan: data.plan }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.currency !== undefined && { currency: data.currency }),
            ...(data.domain !== undefined && { domain: data.domain }),
            ...(data.avatar !== undefined && { avatar: data.avatar }),
            ...(data.social !== undefined && { social: data.social }),
          },
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      .exec();
  }

  async findById(id: string): Promise<StoreDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.storeModel.findById(id).exec();
  }

  async findByOwnerId(ownerId: string): Promise<StoreDocument | null> {
    if (!isValidObjectId(ownerId)) return null;
    return this.storeModel.findOne({ ownerId: new Types.ObjectId(ownerId) }).exec();
  }

  async findByMerchantId(
    merchantId: string,
    platform: StorePlatform = StorePlatform.Salla,
  ): Promise<StoreDocument | null> {
    return this.storeModel
      .findOne({
        platform,
        merchantId: merchantId.trim(),
      })
      .exec();
  }

  async findIdAndStatusByMerchantId(
    merchantId: string,
    platform: StorePlatform = StorePlatform.Salla,
  ): Promise<StoreIdAndStatus | null> {
    return this.storeModel
      .findOne({
        platform,
        merchantId: merchantId.trim(),
      })
      .select('_id status')
      .lean<StoreIdAndStatus>()
      .exec();
  }

  async update(id: string, data: UpdateStoreInput): Promise<StoreDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.storeModel
      .findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    const result = await this.storeModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async existsWithOwner(id: string, userId: string): Promise<boolean> {
    if (!isValidObjectId(id) || !isValidObjectId(userId)) {
      return false;
    }

    const result = await this.storeModel.exists({
      _id: new Types.ObjectId(id),
      ownerId: new Types.ObjectId(userId),
    });

    return Boolean(result);
  }

  async markOnboardingCompleted(id: string): Promise<StoreDocument | null> {
    if (!isValidObjectId(id)) return null;

    return this.storeModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          onboardingCompletedAt: null,
        },
        { $currentDate: { onboardingCompletedAt: true } },
        { returnDocument: 'after' },
      )
      .exec();
  }
}
