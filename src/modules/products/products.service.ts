import { BusinessException, ErrorCode } from '@common';
import { Injectable, Logger } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { ProductStatus } from './enums/product-status.enum';
import { ProductCard } from './interfaces/product-card.interface';
import { ProductUpsertPayload } from './interfaces/product-upsert-payload.interface';
import { ProductVariantUpsertPayload } from './interfaces/product-variant-upsert-payload.interface';
import { ProductVariantsRepository } from './repositories/product-variants.repository';
import { ProductsRepository } from './repositories/products.repository';
import { ProductVariantDocument } from './schemas/product-variant.schema';
import { ProductDocument } from './schemas/product.schema';

export type searchFilters = {
  query: string;
  color?: string;
  size?: string;
  maxPrice?: number;
};

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly productVariantsRepository: ProductVariantsRepository,
  ) {}

  async upsertFromIntegration(
    payload: ProductUpsertPayload,
    session?: ClientSession,
  ): Promise<ProductDocument> {
    return this.productsRepository.upsert(payload, session);
  }

  async upsertVariant(
    payload: ProductVariantUpsertPayload,
    session?: ClientSession,
  ): Promise<ProductVariantDocument> {
    const product = await this.productsRepository.findByExternalId(
      payload.storeId,
      payload.platform,
      payload.productExternalId,
    );

    if (!product) {
      this.logger.warn(
        `Cannot upsert variant ${payload.externalId}: parent product ` +
          `${payload.productExternalId} not found for store ${payload.storeId}`,
      );
      throw new BusinessException('Parent product not found for this variant', {
        errorCode: ErrorCode.PRODUCT_NOT_FOUND,
      });
    }

    return this.productVariantsRepository.upsert(product._id.toString(), payload, session);
  }

  async findByStoreId(storeId: string): Promise<ProductDocument[]> {
    return this.productsRepository.findByStoreId(storeId);
  }

  async findVariantsByProductId(productId: string): Promise<ProductVariantDocument[]> {
    return this.productVariantsRepository.findByProductId(productId);
  }

  async hideProductsNotSyncedSince(
    storeId: string,
    platform: string,
    syncStartedAt: Date,
  ): Promise<number> {
    const staleProducts = await this.productsRepository.findStaleSince(
      storeId,
      platform,
      syncStartedAt,
    );

    for (const product of staleProducts) {
      if (product.status !== ProductStatus.Hidden) {
        await this.productsRepository.upsert({
          storeId: product.storeId.toString(),
          externalId: product.externalId,
          platform: product.platform,
          name: product.name,
          description: product.description,
          category: product.category,
          imageUrl: product.imageUrl,
          productUrl: product.productUrl,
          hasVariants: product.hasVariants,
          priceAmount: product.priceAmount,
          currency: product.currency,
          stockQuantity: product.stockQuantity,
          isUnlimitedStock: product.isUnlimitedStock,
          status: ProductStatus.Hidden,
        });
      }
    }

    if (staleProducts.length > 0) {
      this.logger.warn(
        `Reconciliation hid ${staleProducts.length} stale product(s) for store ${storeId}`,
      );
    }

    return staleProducts.length;
  }

  async markDeletedByExternalId(
    storeId: string,
    platform: string,
    externalId: string,
    session?: ClientSession,
  ): Promise<void> {
    const wasFound = await this.productsRepository.markHiddenByExternalId(
      storeId,
      platform,
      externalId,
      session,
    );

    if (!wasFound) {
      this.logger.warn(
        `product.deleted for unknown product ${externalId} (store ${storeId}, platform ${platform}) — nothing to hide`,
      );
    }
  }

  async searchForChat(storeId: string, filters: searchFilters): Promise<ProductCard[]> {
    const products = await this.productsRepository.searchForChat(storeId, {
      query: filters.query,
      maxPrice: filters.maxPrice,
    });

    const cards: ProductCard[] = [];

    await Promise.all(
      products.map(async (product) => {
        if (!product.hasVariants) {
          cards.push({
            type: 'PRODUCT',
            variantId: product.externalId,
            name: product.name,
            priceAmount: product.priceAmount,
            currency: product.currency,
            imageUrl: product.imageUrl,
            isAvailable: product.status === ProductStatus.Available || product.isUnlimitedStock,
          });
          return;
        }

        const variants = await this.productVariantsRepository.findByProductId(
          product._id.toString(),
        );

        const chosen = this.pickBestVariant(variants, filters.color, filters.size);
        if (!chosen) return;

        cards.push({
          type: 'PRODUCT',
          variantId: chosen.externalId,
          name: product.name,
          priceAmount: chosen.priceAmount,
          currency: chosen.currency,
          imageUrl: product.imageUrl,
          optionsLabel: chosen.optionValues.map((option) => option.value).join(' / '),
          isAvailable: chosen.status === ProductStatus.Available || chosen.isUnlimitedStock,
        });
      }),
    );

    return cards;
  }

  private pickBestVariant(
    variants: ProductVariantDocument[],
    color?: string,
    size?: string,
  ): ProductVariantDocument | undefined {
    if (!variants || variants.length === 0) return undefined;
    if (!color && !size) return variants[0];

    const safeColor = color ? color.toLowerCase() : null;
    const safeSize = size ? size.toLowerCase() : null;

    const matched = variants.find((variant) => {
      let hasColorMatch = true;
      let hasSizeMatch = true;

      if (safeColor) {
        hasColorMatch = variant.optionValues.some((option) =>
          option.value.toLowerCase().includes(safeColor),
        );
      }

      if (safeSize) {
        hasSizeMatch = variant.optionValues.some((option) =>
          option.value.toLowerCase().includes(safeSize),
        );
      }

      return hasColorMatch && hasSizeMatch;
    });

    return matched ?? variants[0];
  }
}
