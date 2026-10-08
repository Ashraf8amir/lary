import { Injectable, Logger } from '@nestjs/common';
import { ClientSession } from 'mongoose';
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
  ) {}

  async upsertFromIntegration(
    payload: ProductUpsertPayload,
    session?: ClientSession,
  ): Promise<ProductDocument> {
    return this.productsRepository.upsert(payload, session);
  }

  async bulkUpsertFromIntegration(
    payloads: ProductUpsertPayload[],
    session?: ClientSession,
  ): Promise<void> {
    await this.productsRepository.bulkUpsert(payloads, session);
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
}
