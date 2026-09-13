import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model, Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductUpsertPayload } from '../interfaces/product-upsert-payload.interface';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async upsert(payload: ProductUpsertPayload, session?: ClientSession): Promise<ProductDocument> {
    return this.productModel
      .findOneAndUpdate(
        {
          storeId: new Types.ObjectId(payload.storeId),
          platform: payload.platform,
          externalId: payload.externalId,
        },
        {
          $set: {
            name: payload.name,
            description: payload.description,
            category: payload.category,
            imageUrl: payload.imageUrl,
            productUrl: payload.productUrl,
            hasVariants: payload.hasVariants,
            priceAmount: payload.priceAmount,
            currency: payload.currency,
            stockQuantity: payload.stockQuantity,
            status: payload.status,
            lastSyncedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after', runValidators: true, session },
      )
      .exec();
  }

  async findByExternalId(
    storeId: string,
    platform: string,
    externalId: string,
  ): Promise<ProductDocument | null> {
    if (!isValidObjectId(storeId)) return null;

    return this.productModel
      .findOne({ storeId: new Types.ObjectId(storeId), platform, externalId })
      .exec();
  }

  async findByStoreId(storeId: string): Promise<ProductDocument[]> {
    if (!isValidObjectId(storeId)) return [];
    return this.productModel.find({ storeId: new Types.ObjectId(storeId) }).exec();
  }

  async findStaleSince(
    storeId: string,
    platform: string,
    cutoff: Date,
  ): Promise<ProductDocument[]> {
    if (!isValidObjectId(storeId)) return [];

    return this.productModel
      .find({
        storeId: new Types.ObjectId(storeId),
        platform,
        lastSyncedAt: { $lt: cutoff },
      })
      .exec();
  }

  async markHiddenByExternalId(
    storeId: string,
    platform: string,
    externalId: string,
    session?: ClientSession,
  ): Promise<boolean> {
    if (!isValidObjectId(storeId)) return false;

    const result = await this.productModel
      .updateOne(
        { storeId: new Types.ObjectId(storeId), platform, externalId },
        { $set: { status: ProductStatus.Hidden, lastSyncedAt: new Date() } },
        { session },
      )
      .exec();

    return result.matchedCount > 0;
  }
}
