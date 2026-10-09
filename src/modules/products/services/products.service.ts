import { MeilisearchService } from '@/infrastructure/meilisearch/meilisearch.service';
import { Injectable, Logger } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductCard } from '../interfaces/product-card.interface';
import {
  GetProductDetailsInput,
  ProductDetailsChatResult,
  SearchFilters,
} from '../interfaces/product-chat.interface';
import { ProductUpsertPayload } from '../interfaces/product-upsert.interface';
import { ProductsRepository } from '../repositories/products.repository';
import { ProductDocument } from '../schemas/product.schema';
import { ProductsChatService } from './products-chat.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly productsChatService: ProductsChatService,
    private readonly meilisearchService: MeilisearchService,
  ) {}

  async upsertFromIntegration(
    payload: ProductUpsertPayload,
    session?: ClientSession,
  ): Promise<ProductDocument> {
    const product = await this.productsRepository.upsert(payload, session);

    await this.syncProductToMeilisearch(product);

    return product;
  }

  async bulkUpsertFromIntegration(
    payloads: ProductUpsertPayload[],
    session?: ClientSession,
  ): Promise<void> {
    if (payloads.length === 0) return;

    await this.productsRepository.bulkUpsert(payloads, session);

    try {
      const storeId = payloads[0].storeId;
      const externalIds = payloads.map((p) => p.externalId);

      const updatedProducts = await this.productsRepository.findByStoreAndExternalIds(
        storeId,
        externalIds,
      );

      const meiliDocs = updatedProducts.map((product) => {
        let minPrice = product.priceAmount;
        if (product.hasVariants && product.variants?.length > 0) {
          minPrice = Math.min(
            ...product.variants
              .filter((v) => v.status !== ProductStatus.Hidden)
              .map((v) => v.priceAmount),
          );
        }

        return {
          id: product._id.toString(),
          storeId: product.storeId.toString(),
          name: product.name,
          description: product.description,
          category: product.category,
          categories: product.categories,
          brand: product.brand,
          tags: product.tags,
          status: product.status,
          minPrice: minPrice,
        };
      });

      if (meiliDocs.length > 0) {
        const index = this.meilisearchService.getIndex('products');
        await index.addDocuments(meiliDocs, { primaryKey: 'id' });
      }
    } catch (error) {
      this.logger.error('Failed to bulk sync products to Meilisearch', error);
    }
  }

  async findByStoreId(storeId: string): Promise<ProductDocument[]> {
    return this.productsRepository.findByStoreId(storeId);
  }

  async hideProductsNotSyncedSince(
    storeId: string,
    platform: string,
    syncStartedAt: Date,
  ): Promise<number> {
    const hiddenCount = await this.productsRepository.hideStaleSince(
      storeId,
      platform,
      syncStartedAt,
    );

    if (hiddenCount > 0) {
      this.logger.warn(`Reconciliation hid ${hiddenCount} stale product(s) for store ${storeId}`);
    }

    return hiddenCount;
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

  async searchForChat(storeId: string, filters: SearchFilters): Promise<ProductCard[]> {
    return this.productsChatService.searchForChat(storeId, filters);
  }

  async getProductDetailsForChat(
    storeId: string,
    input: GetProductDetailsInput,
  ): Promise<ProductDetailsChatResult | null> {
    return this.productsChatService.getProductDetailsForChat(storeId, input);
  }

  async getStoreCategoriesForChat(storeId: string): Promise<string[]> {
    return this.productsChatService.getStoreCategoriesForChat(storeId);
  }

  private async syncProductToMeilisearch(product: ProductDocument) {
    try {
      const index = this.meilisearchService.getIndex('products');

      let minPrice = product.priceAmount;
      if (product.hasVariants && product.variants?.length > 0) {
        minPrice = Math.min(
          ...product.variants.filter((v) => v.status !== 'hidden').map((v) => v.priceAmount),
        );
      }

      const meiliDoc = {
        id: product._id.toString(),
        storeId: product.storeId.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        categories: product.categories,
        brand: product.brand,
        tags: product.tags,
        status: product.status,
        minPrice: minPrice,
      };

      await index.addDocuments([meiliDoc], { primaryKey: 'id' });
    } catch (error) {
      this.logger.error(`Failed to sync product ${product._id} to Meilisearch`, error);
    }
  }
}
