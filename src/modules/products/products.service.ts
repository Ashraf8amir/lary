import { BusinessException, ErrorCode } from '@common';
import { Injectable, Logger } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { ProductStatus } from './enums/product-status.enum';
import { ProductCard } from './interfaces/product-card.interface';
import {
  GetProductDetailsInput,
  ProductDetailsChatResult,
  ProductVariantDetailForModel,
} from './interfaces/product-details-chat.interface';
import { ProductUpsertPayload } from './interfaces/product-upsert-payload.interface';
import { ProductVariantUpsertPayload } from './interfaces/product-variant-upsert-payload.interface';
import { ProductVariantsRepository } from './repositories/product-variants.repository';
import { ProductsRepository } from './repositories/products.repository';
import { ProductVariantDocument } from './schemas/product-variant.schema';
import { ProductDocument } from './schemas/product.schema';

export interface SearchFilters {
  query: string;
  maxPrice?: number;
  optionFilter?: string;
}

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

  async searchForChat(storeId: string, filters: SearchFilters): Promise<ProductCard[]> {
    const products = await this.productsRepository.searchForChat(storeId, {
      query: filters.query,
      maxPrice: filters.maxPrice,
    });

    if (products.length === 0) {
      return [];
    }

    const productIdsWithVariants = products
      .filter((p) => p.hasVariants)
      .map((p) => p._id.toString());

    const allVariants =
      productIdsWithVariants.length > 0
        ? await this.productVariantsRepository.findByProductIds(productIdsWithVariants)
        : [];

    const variantsByProductId = new Map<string, ProductVariantDocument[]>();
    for (const variant of allVariants) {
      if (variant.status === ProductStatus.Hidden) continue;

      const pid = variant.productId.toString();
      const list = variantsByProductId.get(pid) ?? [];
      list.push(variant);
      variantsByProductId.set(pid, list);
    }

    const cards: ProductCard[] = [];

    for (const product of products) {
      if (!product.hasVariants) {
        cards.push({
          type: 'PRODUCT',
          variantId: product.externalId,
          name: product.name,
          priceAmount: product.priceAmount,
          currency: product.currency,
          imageUrl: product.imageUrl,
          productUrl: product.productUrl,
          isAvailable: this.checkAvailability(
            product.status,
            product.isUnlimitedStock,
            product.stockQuantity,
          ),
        });
        continue;
      }

      const productVariants = variantsByProductId.get(product._id.toString()) ?? [];
      const chosen = this.pickBestVariant(productVariants, filters.optionFilter);
      if (!chosen) continue;

      cards.push({
        type: 'PRODUCT',
        variantId: chosen.externalId,
        name: product.name,
        priceAmount: chosen.priceAmount,
        currency: chosen.currency,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        optionsLabel: chosen.optionValues.map((option) => option.value).join(' / ') || undefined,
        isAvailable: this.checkAvailability(
          chosen.status,
          chosen.isUnlimitedStock,
          chosen.stockQuantity,
        ),
      });
    }

    return cards;
  }

  async getProductDetailsForChat(
    storeId: string,
    input: GetProductDetailsInput,
  ): Promise<ProductDetailsChatResult | null> {
    const product = await this.resolveTargetProduct(storeId, input);

    if (!product) {
      return null;
    }

    const cleanDescription = this.sanitizeDescription(product.description);
    const category = product.category?.trim() || undefined;

    if (!product.hasVariants) {
      const isAvailable = this.checkAvailability(
        product.status,
        product.isUnlimitedStock,
        product.stockQuantity,
      );

      const card: ProductCard = {
        type: 'PRODUCT',
        variantId: product.externalId,
        name: product.name,
        priceAmount: product.priceAmount,
        currency: product.currency,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        isAvailable,
      };

      return {
        productName: product.name,
        category,
        description: cleanDescription,
        hasVariants: false,
        variants: [
          {
            variantId: product.externalId,
            options: 'منتج قياسي بدون خيارات (مقاسات أو ألوان) إضافية',
            price: `${product.priceAmount} ${product.currency}`,
            isAvailable,
          },
        ],
        cards: [card],
      };
    }

    const variants = await this.productVariantsRepository.findByProductId(product._id.toString());
    const activeVariants = variants.filter((v) => v.status !== ProductStatus.Hidden);

    const modelVariants: ProductVariantDetailForModel[] = [];
    const cards: ProductCard[] = [];

    for (const variant of activeVariants) {
      const isAvailable = this.checkAvailability(
        variant.status,
        variant.isUnlimitedStock,
        variant.stockQuantity,
      );

      const detailedOptions =
        variant.optionValues.map((opt) => `${opt.optionName}: ${opt.value}`).join(' / ') || 'N/A';

      const cardOptionsLabel =
        variant.optionValues.map((opt) => opt.value).join(' / ') || undefined;

      modelVariants.push({
        variantId: variant.externalId,
        options: detailedOptions,
        price: `${variant.priceAmount} ${variant.currency}`,
        isAvailable,
      });

      cards.push({
        type: 'PRODUCT',
        variantId: variant.externalId,
        name: product.name,
        priceAmount: variant.priceAmount,
        currency: variant.currency,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        optionsLabel: cardOptionsLabel,
        isAvailable,
      });
    }

    return {
      productName: product.name,
      category,
      description: cleanDescription,
      hasVariants: true,
      variants: modelVariants,
      cards,
    };
  }

  async getStoreCategoriesForChat(storeId: string): Promise<string[]> {
    return this.productsRepository.findDistinctCategoriesByStoreId(storeId);
  }

  private async resolveTargetProduct(
    storeId: string,
    input: GetProductDetailsInput,
  ): Promise<ProductDocument | null> {
    if (input.variantId) {
      const variant = await this.productVariantsRepository.findByStoreAndExternalId(
        storeId,
        input.variantId,
      );

      if (variant) {
        const parentProduct = await this.productsRepository.findByIdInStore(
          storeId,
          variant.productId.toString(),
        );
        if (parentProduct) return parentProduct;
      }

      const directProduct = await this.productsRepository.findByStoreAndExternalId(
        storeId,
        input.variantId,
      );
      if (directProduct) return directProduct;
    }

    if (input.productName) {
      const matchedProducts = await this.productsRepository.searchForChat(storeId, {
        query: input.productName,
      });

      if (matchedProducts.length > 0) {
        return matchedProducts[0];
      }
    }

    return null;
  }

  private sanitizeDescription(description?: string): string | undefined {
    if (!description) return undefined;

    const plainText = description
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!plainText) return undefined;

    return plainText.length > 500 ? `${plainText.slice(0, 500)}...` : plainText;
  }

  private checkAvailability(
    status: ProductStatus,
    isUnlimitedStock: boolean,
    stockQuantity: number,
  ): boolean {
    return status === ProductStatus.Available && (isUnlimitedStock || stockQuantity > 0);
  }

  private pickBestVariant(
    variants: ProductVariantDocument[],
    optionFilter?: string,
  ): ProductVariantDocument | null {
    if (variants.length === 0) return null;

    const availableVariants = variants.filter((v) =>
      this.checkAvailability(v.status, v.isUnlimitedStock, v.stockQuantity),
    );

    const pool = availableVariants.length > 0 ? availableVariants : variants;

    if (!optionFilter || !optionFilter.trim()) {
      return pool[0];
    }

    const filterTokens = optionFilter
      .toLowerCase()
      .split(/[\s,/|-]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let bestVariant = pool[0];
    let highestMatchScore = -1;

    for (const variant of pool) {
      const variantOptionsText = variant.optionValues
        .map((opt) => `${opt.optionName} ${opt.value}`.toLowerCase())
        .join(' ');

      let score = 0;
      for (const token of filterTokens) {
        if (variantOptionsText.includes(token)) {
          score++;
        }
      }

      if (score > highestMatchScore) {
        highestMatchScore = score;
        bestVariant = variant;
      }
    }

    return bestVariant;
  }
}
