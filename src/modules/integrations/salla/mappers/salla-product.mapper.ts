import { ProductStatus } from '@/modules/products/enums/product-status.enum';
import {
  ProductUpsertPayload,
  ProductVariantItemPayload,
  ProductVariantOptionValue,
} from '@/modules/products/interfaces/product-upsert.interface';
import { StorePlatform } from '@/modules/stores/enums/stores.enums';
import { SALLA_DEFAULT_CURRENCY } from '../constants/salla.constants';
import { SallaProductStatus } from '../enums/salla-product-status.enum';
import {
  OptionValueLookup,
  SallaMoney,
  SallaProductImage,
  SallaProductListItem,
  SallaProductOption,
  SallaProductVariant,
} from '../interfaces/salla-product.interface';

export class SallaProductMapper {
  private static readonly SALLA_PLATFORM = StorePlatform.Salla;

  static toUpsertPayload(item: SallaProductListItem, storeId: string): ProductUpsertPayload {
    const hasVariants = Array.isArray(item.skus) && item.skus.length > 0;
    const isUnlimitedStock = Boolean(item.unlimited_quantity);
    const categories = this.extractCategories(item);
    const optionValueLookup = hasVariants ? this.buildOptionValueLookup(item.options) : new Map();

    const variants = hasVariants
      ? item.skus!.map((sku) => this.toVariantItemPayload(sku, optionValueLookup, isUnlimitedStock))
      : [];

    return {
      storeId,
      externalId: String(item.id),
      platform: this.SALLA_PLATFORM,
      name: item.name?.trim() ?? '',
      sku: item.sku?.trim() || undefined,
      description: this.cleanDescription(item.description),
      category: categories[0],
      categories,
      brand: this.extractBrandName(item.brand),
      tags: this.extractTags(item.tags),
      imageUrl: this.resolveImageUrl(item),
      productUrl: item.urls?.customer,
      hasVariants,
      priceAmount: Number(item.price?.amount ?? 0),
      regularPriceAmount: this.extractMoneyAmount(item.regular_price),
      salePriceAmount: this.extractMoneyAmount(item.sale_price),
      saleEndAt: this.parseSaleEndDate(item.sale_end),
      currency: item.price?.currency ?? SALLA_DEFAULT_CURRENCY,
      stockQuantity: this.resolveStockQuantity(item, hasVariants),
      isUnlimitedStock,
      promotionTitle: item.promotion?.title?.trim() || undefined,
      promotionSubtitle: item.promotion?.sub_title?.trim() || undefined,
      ratingRate: item.rating?.rate ? Number(item.rating.rate) : undefined,
      ratingCount: item.rating?.count ? Number(item.rating.count) : undefined,
      calories: item.calories ? Number(item.calories) : undefined,
      weightLabel: item.weight ? `${item.weight} ${item.weight_type ?? 'kg'}`.trim() : undefined,
      status: this.mapStatus(item),
      variants,
    };
  }

  static buildOptionValueLookup(options?: SallaProductOption[] | null): OptionValueLookup {
    const lookup: OptionValueLookup = new Map();

    if (!Array.isArray(options) || options.length === 0) {
      return lookup;
    }

    for (const option of options) {
      if (!Array.isArray(option.values)) continue;

      for (const value of option.values) {
        const id = Number(value.id);
        if (Number.isNaN(id)) continue;

        lookup.set(id, {
          optionName: option.name?.trim() ?? '',
          value: value.name?.trim() ?? '',
          imageUrl: value.image_url?.trim() || undefined,
        });
      }
    }

    return lookup;
  }

  private static toVariantItemPayload(
    variant: SallaProductVariant,
    optionValueLookup: OptionValueLookup,
    isParentUnlimited: boolean,
  ): ProductVariantItemPayload {
    const isUnlimitedStock = Boolean(variant.unlimited_quantity ?? isParentUnlimited);
    const stockQuantity = Math.max(0, Number(variant.stock_quantity ?? 0));
    const { optionValues, imageUrl } = this.resolveOptionValuesAndImage(
      variant.related_option_values,
      optionValueLookup,
    );

    return {
      externalId: String(variant.id ?? ''),
      sku: variant.sku?.trim() || undefined,
      barcode: variant.barcode?.trim() || undefined,
      priceAmount: Number(variant.price?.amount ?? 0),
      regularPriceAmount: this.extractMoneyAmount(variant.regular_price),
      salePriceAmount: this.extractMoneyAmount(variant.sale_price),
      currency: variant.price?.currency ?? SALLA_DEFAULT_CURRENCY,
      stockQuantity,
      isUnlimitedStock,
      imageUrl,
      weightLabel: variant.weight_label?.trim() || undefined,
      status:
        stockQuantity > 0 || isUnlimitedStock ? ProductStatus.Available : ProductStatus.OutOfStock,
      optionValues,
    };
  }

  private static resolveOptionValuesAndImage(
    relatedOptionValueIds: Array<number | string> | undefined | null,
    lookup: OptionValueLookup,
  ): { optionValues: ProductVariantOptionValue[]; imageUrl?: string } {
    if (!Array.isArray(relatedOptionValueIds) || relatedOptionValueIds.length === 0) {
      return { optionValues: [] };
    }

    const optionValues: ProductVariantOptionValue[] = [];
    let variantImageUrl: string | undefined;

    for (const rawId of relatedOptionValueIds) {
      const valueId = Number(rawId);
      if (Number.isNaN(valueId)) continue;

      const match = lookup.get(valueId);
      if (!match) continue;

      optionValues.push({
        optionName: match.optionName,
        value: match.value,
      });

      if (!variantImageUrl && match.imageUrl) {
        variantImageUrl = match.imageUrl;
      }
    }

    return { optionValues, imageUrl: variantImageUrl };
  }

  private static extractCategories(item: SallaProductListItem): string[] {
    if (!Array.isArray(item.categories)) return [];
    return item.categories
      .map((c) => c?.name?.trim())
      .filter((name): name is string => Boolean(name));
  }

  private static extractBrandName(brand?: SallaProductListItem['brand']): string | undefined {
    if (!brand || typeof brand !== 'object' || !('name' in brand)) return undefined;
    return typeof brand.name === 'string' && brand.name.trim() ? brand.name.trim() : undefined;
  }

  private static extractTags(tags?: SallaProductListItem['tags']): string[] {
    if (!Array.isArray(tags)) return [];
    return tags
      .map((t) => (typeof t === 'string' ? t.trim() : t?.name?.trim()))
      .filter((tag): tag is string => Boolean(tag));
  }

  private static extractMoneyAmount(
    money?: SallaMoney | Record<string, never>,
  ): number | undefined {
    if (!money || typeof money !== 'object' || !('amount' in money)) return undefined;
    const amount = Number(money.amount);
    return !Number.isNaN(amount) && amount > 0 ? amount : undefined;
  }

  private static parseSaleEndDate(saleEnd?: string | Record<string, never>): Date | undefined {
    if (typeof saleEnd !== 'string' || !saleEnd.trim()) return undefined;
    const date = new Date(saleEnd);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private static resolveStockQuantity(item: SallaProductListItem, hasVariants: boolean): number {
    if (hasVariants && Array.isArray(item.skus)) {
      return item.skus.reduce((sum, sku) => {
        const quantity = Number(sku.stock_quantity ?? 0);
        return sum + Math.max(0, Number.isNaN(quantity) ? 0 : quantity);
      }, 0);
    }

    const baseQuantity = Number(item.quantity ?? 0);
    return Math.max(0, Number.isNaN(baseQuantity) ? 0 : baseQuantity);
  }

  private static mapStatus(item: SallaProductListItem): ProductStatus {
    if (item.status === SallaProductStatus.Hidden) return ProductStatus.Hidden;
    if (!item.is_available || item.status === SallaProductStatus.Out) {
      return ProductStatus.OutOfStock;
    }
    return ProductStatus.Available;
  }

  private static resolveImageUrl(item: SallaProductListItem): string | undefined {
    if (typeof item.main_image === 'string' && item.main_image.trim()) {
      return item.main_image.trim();
    }
    if (item.main_image && typeof item.main_image === 'object' && 'url' in item.main_image) {
      return item.main_image.url;
    }

    if (Array.isArray(item.images) && item.images.length > 0) {
      const primaryImage = item.images.find(
        (img): img is SallaProductImage => typeof img === 'object' && Boolean(img.main),
      );

      if (primaryImage?.url) {
        return primaryImage.url;
      }

      const firstImage = item.images[0];
      if (typeof firstImage === 'string') return firstImage;
      if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
        return firstImage.url;
      }
    }

    return item.thumbnail?.trim() || undefined;
  }

  private static cleanDescription(description?: string): string | undefined {
    if (!description) return undefined;

    const cleaned = description.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > 0 ? cleaned : undefined;
  }
}
