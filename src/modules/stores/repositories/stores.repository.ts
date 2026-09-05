import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';
import { CreateStoreDto } from '../dtos/create-store.dto';
import { UpdateStoreDto } from '../dtos/update-store.dto';
import { Store, StoreDocument } from '../schemas/store.schema';

@Injectable()
export class StoresRepository {
  constructor(
    @InjectModel(Store.name)
    private readonly storeModel: Model<StoreDocument>,
  ) {}

  async create(data: CreateStoreDto): Promise<StoreDocument> {
    return this.storeModel.create(data);
  }

  async findById(id: string): Promise<StoreDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.storeModel.findById(id).exec();
  }

  async findByIdAndOwner(id: string, ownerId: string): Promise<StoreDocument | null> {
    if (!isValidObjectId(id) || !isValidObjectId(ownerId)) return null;
    return this.storeModel.findOne({ _id: id, ownerId }).exec();
  }

  async existsWithOwner(id: string, ownerId: string): Promise<boolean> {
    if (!isValidObjectId(id) || !isValidObjectId(ownerId)) return false;
    const count = await this.storeModel.countDocuments({ _id: id, ownerId }).exec();
    return count > 0;
  }

  async update(id: string, data: UpdateStoreDto): Promise<StoreDocument | null> {
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

  async markOnboardingCompleted(id: string): Promise<StoreDocument | null> {
    if (!isValidObjectId(id)) return null;

    return this.storeModel
      .findByIdAndUpdate(
        id,
        { $set: { onboardingCompletedAt: new Date() } },
        { returnDocument: 'after' },
      )
      .exec();
  }
}
