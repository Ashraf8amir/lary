import { BusinessException, ErrorCode } from '@common';
import { Injectable, Logger } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { ProductStatus } from './enums/product-status.enum';
import { ProductUpsertPayload } from './interfaces/product-upsert-payload.interface';
import { ProductVariantUpsertPayload } from './interfaces/product-variant-upsert-payload.interface';
import { ProductVariantsRepository } from './repositories/product-variants.repository';
import { ProductsRepository } from './repositories/products.repository';
import { ProductVariantDocument } from './schemas/product-variant.schema';
import { ProductDocument } from './schemas/product.schema';

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
}
