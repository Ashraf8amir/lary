import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model, Types } from 'mongoose';
import { ProductVariantUpsertPayload } from '../interfaces/product-variant-upsert-payload.interface';
import { ProductVariant, ProductVariantDocument } from '../schemas/product-variant.schema';

@Injectable()
export class ProductVariantsRepository {
  constructor(
    @InjectModel(ProductVariant.name)
    private readonly variantModel: Model<ProductVariantDocument>,
  ) {}

  async upsert(
    productId: string,
    payload: ProductVariantUpsertPayload,
  ): Promise<ProductVariantDocument> {
    return this.variantModel
      .findOneAndUpdate(
        {
          productId: new Types.ObjectId(productId),
          platform: payload.platform,
          externalId: payload.externalId,
        },
        {
          $set: {
            storeId: new Types.ObjectId(payload.storeId),
            sku: payload.sku,
            priceAmount: payload.priceAmount,
            currency: payload.currency,
            stockQuantity: payload.stockQuantity,
            status: payload.status,
            optionValues: payload.optionValues,
            lastSyncedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      .exec();
  }

  async findByProductId(productId: string): Promise<ProductVariantDocument[]> {
    if (!isValidObjectId(productId)) return [];
    return this.variantModel.find({ productId: new Types.ObjectId(productId) }).exec();
  }
}
