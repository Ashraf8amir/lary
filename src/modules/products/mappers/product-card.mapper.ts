import {
  MAX_CHAT_DESCRIPTION_LENGTH,
  STANDARD_PRODUCT_OPTIONS_TEXT,
} from '../constants/products.constants';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductCard } from '../interfaces/product-card.interface';
import {
  ProductDetailsChatResult,
  ProductVariantDetailForModel,
} from '../interfaces/product-chat.interface';
import { ProductDocument, ProductVariant } from '../schemas/product.schema';

export class ProductCardMapper {
  static isAvailable(
    status: ProductStatus,
    isUnlimitedStock: boolean,
    stockQuantity: number,
  ): boolean {
    return status === ProductStatus.Available && (isUnlimitedStock || stockQuantity > 0);
  }

  static toStandardProductCard(product: ProductDocument): ProductCard {
    return {
      type: 'PRODUCT',
      variantId: product.externalId,
      name: product.name,
      priceAmount: product.priceAmount,
      ...(product.regularPriceAmount &&
        product.regularPriceAmount > product.priceAmount && {
          regularPriceAmount: product.regularPriceAmount,
        }),
      currency: product.currency,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      promotionTitle: product.promotionTitle,
      isAvailable: this.isAvailable(
        product.status,
        product.isUnlimitedStock,
        product.stockQuantity,
      ),
    };
  }

  static toVariantProductCard(product: ProductDocument, variant: ProductVariant): ProductCard {
    const optionsLabel =
      variant.optionValues.map((option) => option.value).join(' / ') || undefined;

    return {
      type: 'PRODUCT',
      variantId: variant.externalId,
      name: product.name,
      priceAmount: variant.priceAmount,
      ...(variant.regularPriceAmount &&
        variant.regularPriceAmount > variant.priceAmount && {
          regularPriceAmount: variant.regularPriceAmount,
        }),
      currency: variant.currency,
      imageUrl: variant.imageUrl || product.imageUrl,
      productUrl: product.productUrl,
      optionsLabel,
      promotionTitle: product.promotionTitle,
      isAvailable: this.isAvailable(
        variant.status,
        variant.isUnlimitedStock,
        variant.stockQuantity,
      ),
    };
  }

  static toModelVariantDetail(variant: ProductVariant): ProductVariantDetailForModel {
    const detailedOptions =
      variant.optionValues.map((opt) => `${opt.optionName}: ${opt.value}`).join(' / ') || 'N/A';

    return {
      variantId: variant.externalId,
      options: detailedOptions,
      price: `${variant.priceAmount} ${variant.currency}`,
      ...(variant.regularPriceAmount &&
        variant.regularPriceAmount > variant.priceAmount && {
          regularPrice: `${variant.regularPriceAmount} ${variant.currency}`,
        }),
      isAvailable: this.isAvailable(
        variant.status,
        variant.isUnlimitedStock,
        variant.stockQuantity,
      ),
    };
  }

  static toProductDetailsChatResult(product: ProductDocument): ProductDetailsChatResult {
    const cleanDescription = this.sanitizeDescription(product.description);
    const category = product.category?.trim() || undefined;
    const promotion = [product.promotionTitle, product.promotionSubtitle]
      .filter(Boolean)
      .join(' - ');

    const commonMetadata = {
      productName: product.name,
      category,
      ...(product.categories?.length ? { categories: product.categories } : {}),
      ...(product.brand ? { brand: product.brand } : {}),
      description: cleanDescription,
      ...(promotion ? { promotion } : {}),
      ...(product.ratingRate && product.ratingCount
        ? { rating: { rate: product.ratingRate, count: product.ratingCount } }
        : {}),
      ...(product.calories ? { calories: product.calories } : {}),
      ...(product.weightLabel ? { weight: product.weightLabel } : {}),
    };

    if (!product.hasVariants || !product.variants?.length) {
      const card = this.toStandardProductCard(product);

      return {
        ...commonMetadata,
        hasVariants: false,
        variants: [
          {
            variantId: product.externalId,
            options: STANDARD_PRODUCT_OPTIONS_TEXT,
            price: `${product.priceAmount} ${product.currency}`,
            ...(product.regularPriceAmount &&
              product.regularPriceAmount > product.priceAmount && {
                regularPrice: `${product.regularPriceAmount} ${product.currency}`,
              }),
            isAvailable: card.isAvailable,
          },
        ],
        cards: [card],
      };
    }

    const activeVariants = product.variants.filter((v) => v.status !== ProductStatus.Hidden);
    const modelVariants = activeVariants.map((v) => this.toModelVariantDetail(v));
    const cards = activeVariants.map((v) => this.toVariantProductCard(product, v));

    return {
      ...commonMetadata,
      hasVariants: true,
      variants: modelVariants,
      cards,
    };
  }

  static sanitizeDescription(description?: string): string | undefined {
    if (!description) return undefined;

    const plainText = description
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!plainText) return undefined;

    return plainText.length > MAX_CHAT_DESCRIPTION_LENGTH
      ? `${plainText.slice(0, MAX_CHAT_DESCRIPTION_LENGTH)}...`
      : plainText;
  }
}
