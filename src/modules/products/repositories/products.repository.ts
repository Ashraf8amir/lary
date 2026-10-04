import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, isValidObjectId, type Model, Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductUpsertPayload } from '../interfaces/product-upsert-payload.interface';
import type { searchFilters } from '../products.service';
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
            isUnlimitedStock: payload.isUnlimitedStock,
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

  async searchForChat(storeId: string, filters: searchFilters): Promise<ProductDocument[]> {
    if (!isValidObjectId(storeId)) return [];

    const trimmedQuery = filters.query?.trim();
    if (!trimmedQuery) return [];

    const safeQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, ' ').trim();
    if (!safeQuery) return [];

    const pipeline: any[] = [
      {
        $search: {
          index: 'product_text_search_index',
          compound: {
            filter: [{ equals: { path: 'storeId', value: new Types.ObjectId(storeId) } }],
            should: [
              {
                text: {
                  query: safeQuery,
                  path: 'name',
                  score: { boost: { value: 5 } },
                  fuzzy: { maxEdits: 1, prefixLength: 1 },
                },
              },
              {
                text: {
                  query: safeQuery,
                  path: 'description',
                  score: { boost: { value: 1 } },
                  fuzzy: { maxEdits: 1 },
                },
              },
            ],
            minimumShouldMatch: 1,
          },
        },
      },
      {
        $match: {
          status: { $ne: ProductStatus.Hidden },
          ...(filters.maxPrice !== undefined ? { priceAmount: { $lte: filters.maxPrice } } : {}),
        },
      },
      { $addFields: { searchScore: { $meta: 'searchScore' } } },
      { $sort: { searchScore: -1 } },
      { $limit: 5 },
    ];

    return this.productModel.aggregate(pipeline).exec();
  }

  async findByIdInStore(storeId: string, productId: string): Promise<ProductDocument | null> {
    if (!isValidObjectId(storeId) || !isValidObjectId(productId)) return null;

    return this.productModel
      .findOne({
        _id: new Types.ObjectId(productId),
        storeId: new Types.ObjectId(storeId),
        status: { $ne: ProductStatus.Hidden },
      })
      .exec();
  }

  async findByStoreAndExternalId(
    storeId: string,
    externalId: string,
  ): Promise<ProductDocument | null> {
    if (!isValidObjectId(storeId) || !externalId?.trim()) return null;

    return this.productModel
      .findOne({
        storeId: new Types.ObjectId(storeId),
        externalId: externalId.trim(),
        status: { $ne: ProductStatus.Hidden },
      })
      .exec();
  }

  async findDistinctCategoriesByStoreId(storeId: string): Promise<string[]> {
    if (!isValidObjectId(storeId)) return [];

    const categories = await this.productModel
      .distinct('category', {
        storeId: new Types.ObjectId(storeId),
        status: { $ne: ProductStatus.Hidden },
        category: { $nin: [null, ''] },
      })
      .exec();

    return categories
      .filter((category): category is string => typeof category === 'string')
      .map((category) => category.trim())
      .filter(Boolean);
  }
}
