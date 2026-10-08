import { Injectable } from '@nestjs/common';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductCard } from '../interfaces/product-card.interface';
import {
  GetProductDetailsInput,
  ProductDetailsChatResult,
  SearchFilters,
} from '../interfaces/product-chat.interface';
import { ProductCardMapper } from '../mappers/product-card.mapper';
import { ProductsRepository } from '../repositories/products.repository';
import { ProductDocument, ProductVariant } from '../schemas/product.schema';

@Injectable()
export class ProductsChatService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async searchForChat(storeId: string, filters: SearchFilters): Promise<ProductCard[]> {
    const products = await this.productsRepository.searchForChat(storeId, filters);

    if (products.length === 0) {
      return [];
    }

    const cards: ProductCard[] = [];

    for (const product of products) {
      if (!product.hasVariants || !product.variants?.length) {
        cards.push(ProductCardMapper.toStandardProductCard(product));
        continue;
      }

      const activeVariants = product.variants.filter((v) => v.status !== ProductStatus.Hidden);
      const chosen = this.pickBestVariant(activeVariants, filters.optionFilter, filters.maxPrice);
      if (!chosen) continue;

      cards.push(ProductCardMapper.toVariantProductCard(product, chosen));
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

    return ProductCardMapper.toProductDetailsChatResult(product);
  }

  async getStoreCategoriesForChat(storeId: string): Promise<string[]> {
    return this.productsRepository.findDistinctCategoriesByStoreId(storeId);
  }

  private async resolveTargetProduct(
    storeId: string,
    input: GetProductDetailsInput,
  ): Promise<ProductDocument | null> {
    if (input.variantId) {
      const product = await this.productsRepository.findByProductOrVariantExternalId(
        storeId,
        input.variantId,
      );
      if (product) return product;
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

  private pickBestVariant(
    variants: ProductVariant[],
    optionFilter?: string,
    maxPrice?: number,
  ): ProductVariant | null {
    if (variants.length === 0) return null;

    const priceFiltered =
      maxPrice !== undefined ? variants.filter((v) => v.priceAmount <= maxPrice) : variants;

    const baseVariants = priceFiltered.length > 0 ? priceFiltered : variants;

    const availableVariants = baseVariants.filter((v) =>
      ProductCardMapper.isAvailable(v.status, v.isUnlimitedStock, v.stockQuantity),
    );

    const pool = availableVariants.length > 0 ? availableVariants : baseVariants;

    if (!optionFilter?.trim()) {
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
