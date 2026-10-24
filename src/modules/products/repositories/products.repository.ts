import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, isValidObjectId, type Model, Types } from 'mongoose';
// import {
//   DEFAULT_CHAT_SEARCH_LIMIT,
//   PRODUCT_TEXT_SEARCH_INDEX,
// // } from '../constants/products.constants';
import { ProductStatus } from '../enums/product-status.enum';
// import { SearchFilters } from '../interfaces/product-chat.interface';
import { ProductUpsertPayload } from '../interfaces/product-upsert.interface';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async upsert(payload: ProductUpsertPayload, session?: ClientSession): Promise<ProductDocument> {
    const syncedAt = new Date();

    return this.productModel
      .findOneAndUpdate(
        {
          storeId: new Types.ObjectId(payload.storeId),
          platform: payload.platform,
          externalId: payload.externalId,
        },
        { $set: this.buildUpsertSetFields(payload, syncedAt) },
        { upsert: true, returnDocument: 'after', runValidators: true, session },
      )
      .exec();
  }

  async bulkUpsert(payloads: ProductUpsertPayload[], session?: ClientSession): Promise<void> {
    if (payloads.length === 0) return;

    const syncedAt = new Date();

    const operations = payloads.map((payload) => ({
      updateOne: {
        filter: {
          storeId: new Types.ObjectId(payload.storeId),
          platform: payload.platform,
          externalId: payload.externalId,
        },
        update: { $set: this.buildUpsertSetFields(payload, syncedAt) },
        upsert: true,
      },
    }));

    await this.productModel.bulkWrite(operations, { ordered: false, session });
  }

  async findByIds(storeId: string, ids: string[]): Promise<ProductDocument[]> {
    if (!isValidObjectId(storeId) || !ids.length) return [];

    const objectIds = ids.map((id) => new Types.ObjectId(id));

    return this.productModel
      .find({
        storeId: new Types.ObjectId(storeId),
        _id: { $in: objectIds },
      })
      .exec();
  }

  async findByExternalId(
    storeId: string,
    platform: string,
    externalId: string,
    session?: ClientSession,
  ): Promise<ProductDocument | null> {
    if (!isValidObjectId(storeId)) return null;

    return this.productModel
      .findOne({ storeId: new Types.ObjectId(storeId), platform, externalId }, null, { session })
      .exec();
  }

  async findByStoreId(storeId: string): Promise<ProductDocument[]> {
    if (!isValidObjectId(storeId)) return [];
    return this.productModel.find({ storeId: new Types.ObjectId(storeId) }).exec();
  }

  async findByStoreAndExternalIds(
    storeId: string,
    externalIds: string[],
  ): Promise<ProductDocument[]> {
    if (!isValidObjectId(storeId) || externalIds.length === 0) return [];

    return this.productModel
      .find({
        storeId: new Types.ObjectId(storeId),
        externalId: { $in: externalIds },
      })
      .exec();
  }

  async hideStaleSince(storeId: string, platform: string, cutoff: Date): Promise<number> {
    if (!isValidObjectId(storeId)) return 0;

    const result = await this.productModel
      .updateMany(
        {
          storeId: new Types.ObjectId(storeId),
          platform,
          lastSyncedAt: { $lt: cutoff },
          status: { $ne: ProductStatus.Hidden },
        },
        { $set: { status: ProductStatus.Hidden } },
      )
      .exec();

    return result.modifiedCount;
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

  async countStoreProductsAndVariants(storeId: string): Promise<number> {
    if (!isValidObjectId(storeId)) return 0;

    const result = await this.productModel
      .aggregate([
        {
          $match: {
            storeId: new Types.ObjectId(storeId),
            status: { $ne: ProductStatus.Hidden },
          },
        },
        {
          $project: {
            itemCount: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$hasVariants', true] },
                    { $isArray: '$variants' },
                    { $gt: [{ $size: '$variants' }, 0] },
                  ],
                },
                then: { $size: '$variants' },
                else: 1,
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalVariants: { $sum: '$itemCount' },
          },
        },
      ])
      .exec();

    return result.length > 0 ? result[0].totalVariants : 0;
  }

  async findByProductOrVariantExternalId(
    storeId: string,
    targetExternalId: string,
  ): Promise<ProductDocument | null> {
    if (!isValidObjectId(storeId) || !targetExternalId?.trim()) return null;

    const trimmedId = targetExternalId.trim();

    return this.productModel
      .findOne({
        storeId: new Types.ObjectId(storeId),
        status: { $ne: ProductStatus.Hidden },
        $or: [{ externalId: trimmedId }, { 'variants.externalId': trimmedId }],
      })
      .exec();
  }

  async findDistinctCategoriesByStoreId(storeId: string): Promise<string[]> {
    if (!isValidObjectId(storeId)) return [];

    const storeObjectId = new Types.ObjectId(storeId);
    const filter = {
      storeId: storeObjectId,
      status: { $ne: ProductStatus.Hidden },
    };

    const [arrayCategories, singleCategories] = await Promise.all([
      this.productModel.distinct('categories', filter).exec(),
      this.productModel.distinct('category', filter).exec(),
    ]);

    const merged = new Set<string>();

    for (const item of [...arrayCategories, ...singleCategories]) {
      if (typeof item === 'string' && item.trim()) {
        merged.add(item.trim());
      }
    }

    return Array.from(merged);
  }

  private buildUpsertSetFields(payload: ProductUpsertPayload, syncedAt: Date) {
    return {
      name: payload.name,
      sku: payload.sku,
      description: payload.description,
      category: payload.category,
      categories: payload.categories ?? (payload.category ? [payload.category] : []),
      brand: payload.brand,
      tags: payload.tags ?? [],
      imageUrl: payload.imageUrl,
      productUrl: payload.productUrl,
      hasVariants: payload.hasVariants,
      priceAmount: payload.priceAmount,
      regularPriceAmount: payload.regularPriceAmount,
      salePriceAmount: payload.salePriceAmount,
      saleEndAt: payload.saleEndAt,
      currency: payload.currency,
      stockQuantity: payload.stockQuantity,
      isUnlimitedStock: payload.isUnlimitedStock,
      promotionTitle: payload.promotionTitle,
      promotionSubtitle: payload.promotionSubtitle,
      ratingRate: payload.ratingRate,
      ratingCount: payload.ratingCount,
      calories: payload.calories,
      weightLabel: payload.weightLabel,
      status: payload.status,
      variants: payload.variants ?? [],
      lastSyncedAt: syncedAt,
    };
  }
}
