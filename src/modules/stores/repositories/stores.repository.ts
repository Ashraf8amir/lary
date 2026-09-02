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

  async findBySallaId(sallaId: string): Promise<StoreDocument | null> {
    return this.storeModel.findOne({ sallaId: String(sallaId).trim() }).exec();
  }

  async update(id: string, data: UpdateStoreDto): Promise<StoreDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.storeModel
      .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .exec();
  }

  async upsertBySallaId(sallaId: string, data: Partial<CreateStoreDto>): Promise<StoreDocument> {
    return this.storeModel
      .findOneAndUpdate(
        { sallaId: String(sallaId).trim() },
        { $set: data },
        { new: true, upsert: true, runValidators: true },
      )
      .exec();
  }

  async existsBySallaId(sallaId: string): Promise<boolean> {
    return (await this.storeModel.exists({ sallaId: String(sallaId).trim() })) !== null;
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    const result = await this.storeModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }
}
