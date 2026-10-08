import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, isValidObjectId, type Model, PipelineStage, Types } from 'mongoose';
import {
  DEFAULT_CHAT_SEARCH_LIMIT,
  PRODUCT_TEXT_SEARCH_INDEX,
} from '../constants/products.constants';
import { ProductStatus } from '../enums/product-status.enum';
import { SearchFilters } from '../interfaces/product-chat.interface';
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

  async searchForChat(storeId: string, filters: SearchFilters): Promise<ProductDocument[]> {
    if (!isValidObjectId(storeId)) return [];

    const storeObjectId = new Types.ObjectId(storeId);
    const trimmedQuery = filters.query?.trim() ?? '';
    const safeQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, ' ').trim();

    if (!safeQuery) {
      if (filters.category || filters.maxPrice !== undefined) {
        return this.filterOnlySearch(storeObjectId, filters);
      }
      return [];
    }

    const priceMatchStage =
      filters.maxPrice !== undefined
        ? {
            $or: [
              { hasVariants: false, priceAmount: { $lte: filters.maxPrice } },
              {
                hasVariants: true,
                variants: {
                  $elemMatch: {
                    status: { $ne: ProductStatus.Hidden },
                    priceAmount: { $lte: filters.maxPrice },
                  },
                },
              },
            ],
          }
        : {};

    try {
      const pipeline: PipelineStage[] = [
        {
          $search: {
            index: PRODUCT_TEXT_SEARCH_INDEX,
            compound: {
              filter: [{ equals: { path: 'storeId', value: storeObjectId } }],
              mustNot: [{ equals: { path: 'status', value: ProductStatus.Hidden } }],
              should: [
                {
                  text: {
                    query: safeQuery,
                    path: 'name',
                    score: { boost: { value: 6 } },
                  },
                },
                {
                  text: {
                    query: safeQuery,
                    path: { value: 'name', multi: 'standard' },
                    score: { boost: { value: 5 } },
                    fuzzy: { maxEdits: 1, prefixLength: 1 },
                  },
                },
                {
                  text: {
                    query: safeQuery,
                    path: ['category', 'categories'],
                    score: { boost: { value: 3 } },
                  },
                },
                {
                  text: {
                    query: safeQuery,
                    path: [
                      { value: 'category', multi: 'standard' },
                      { value: 'categories', multi: 'standard' },
                    ],
                    score: { boost: { value: 3 } },
                  },
                },
                {
                  text: {
                    query: safeQuery,
                    path: ['brand', 'tags'],
                    score: { boost: { value: 4 } },
                  },
                },
                {
                  text: {
                    query: safeQuery,
                    path: 'description',
                    score: { boost: { value: 1 } },
                  },
                },
              ],
              minimumShouldMatch: 1,
            },
          },
        },
        ...(filters.maxPrice !== undefined ? [{ $match: priceMatchStage }] : []),
        { $addFields: { searchScore: { $meta: 'searchScore' } } },
        { $sort: { searchScore: -1 } },
        { $limit: DEFAULT_CHAT_SEARCH_LIMIT },
      ];

      const atlasResults = await this.productModel.aggregate<ProductDocument>(pipeline).exec();
      if (atlasResults.length > 0) {
        return atlasResults;
      }
    } catch {
      // Fallback to regex search if Atlas Search index is still building or unavailable
    }

    return this.fallbackRegexSearch(storeObjectId, safeQuery, filters);
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

  private async fallbackRegexSearch(
    storeObjectId: Types.ObjectId,
    safeQuery: string,
    filters: SearchFilters,
  ): Promise<ProductDocument[]> {
    const tokens = safeQuery
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    if (tokens.length === 0) return [];

    const normalizedPatterns = tokens.map((token) =>
      token.startsWith('ال') && token.length > 3 ? token.slice(2) : token,
    );

    const regexPattern = new RegExp(normalizedPatterns.join('|'), 'i');

    const andConditions: Record<string, unknown>[] = [
      {
        $or: [
          { name: regexPattern },
          { category: regexPattern },
          { categories: regexPattern },
          { description: regexPattern },
          { brand: regexPattern },
          { tags: regexPattern },
        ],
      },
    ];

    if (filters.category) {
      const cleanCat = filters.category.trim().replace(/^ال/, '');
      const catRegex = new RegExp(cleanCat, 'i');
      andConditions.push({
        $or: [{ category: catRegex }, { categories: catRegex }],
      });
    }

    if (filters.maxPrice !== undefined) {
      andConditions.push({
        $or: [
          { hasVariants: false, priceAmount: { $lte: filters.maxPrice } },
          {
            hasVariants: true,
            variants: {
              $elemMatch: {
                status: { $ne: ProductStatus.Hidden },
                priceAmount: { $lte: filters.maxPrice },
              },
            },
          },
        ],
      });
    }

    return this.productModel
      .find({
        storeId: storeObjectId,
        status: { $ne: ProductStatus.Hidden },
        $and: andConditions,
      })
      .limit(DEFAULT_CHAT_SEARCH_LIMIT)
      .exec();
  }

  private async filterOnlySearch(
    storeObjectId: Types.ObjectId,
    filters: SearchFilters,
  ): Promise<ProductDocument[]> {
    const andConditions: Record<string, unknown>[] = [];

    if (filters.category) {
      const cleanCat = filters.category.trim().replace(/^ال/, '');
      const catRegex = new RegExp(cleanCat, 'i');
      andConditions.push({
        $or: [{ category: catRegex }, { categories: catRegex }],
      });
    }

    if (filters.maxPrice !== undefined) {
      andConditions.push({
        $or: [
          { hasVariants: false, priceAmount: { $lte: filters.maxPrice } },
          {
            hasVariants: true,
            variants: {
              $elemMatch: {
                status: { $ne: ProductStatus.Hidden },
                priceAmount: { $lte: filters.maxPrice },
              },
            },
          },
        ],
      });
    }

    return this.productModel
      .find({
        storeId: storeObjectId,
        status: { $ne: ProductStatus.Hidden },
        ...(andConditions.length > 0 ? { $and: andConditions } : {}),
      })
      .limit(DEFAULT_CHAT_SEARCH_LIMIT)
      .exec();
  }
}
