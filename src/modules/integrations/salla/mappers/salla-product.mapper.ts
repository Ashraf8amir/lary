import { ProductStatus } from '@/modules/products/enums/product-status.enum';
import { ProductUpsertPayload } from '@/modules/products/interfaces/product-upsert-payload.interface';
import {
  ProductVariantOptionValue,
  ProductVariantUpsertPayload,
} from '@/modules/products/interfaces/product-variant-upsert-payload.interface';
import {
  SallaProductListItem,
  SallaProductOption,
  SallaProductVariant,
} from '../interfaces/salla-product.interface';

const PLATFORM = 'salla';

export type OptionValueLookup = Map<number, { optionName: string; value: string }>;

export class SallaProductMapper {
  static toUpsertPayload(item: SallaProductListItem, storeId: string): ProductUpsertPayload {
    const hasVariants = Array.isArray(item.skus) && item.skus.length > 0;
    const isUnlimitedStock = Boolean(item.unlimited_quantity);

    return {
      storeId,
      externalId: String(item.id),
      platform: PLATFORM,
      name: item.name?.trim() ?? '',
      description: this.cleanDescription(item.description),
      category: item.categories?.[0]?.name,
      imageUrl: this.resolveImageUrl(item),
      productUrl: item.urls?.customer,
      hasVariants,
      priceAmount: Number(item.price?.amount ?? 0),
      currency: item.price?.currency ?? 'SAR',
      stockQuantity: this.resolveStockQuantity(item, hasVariants),
      isUnlimitedStock,
      status: this.mapStatus(item),
    };
  }

  static toVariantUpsertPayload(
    variant: SallaProductVariant,
    productExternalId: string,
    storeId: string,
    optionValueLookup: OptionValueLookup,
    isParentUnlimited: boolean,
  ): ProductVariantUpsertPayload {
    const isUnlimitedStock = Boolean(variant.unlimited_quantity ?? isParentUnlimited);
    const stockQuantity = Math.max(0, Number(variant.stock_quantity ?? 0));

    return {
      storeId,
      productExternalId,
      platform: PLATFORM,
      externalId: String(variant.id ?? ''),
      sku: variant.sku ?? '',
      priceAmount: Number(variant.price?.amount ?? 0),
      currency: variant.price?.currency ?? 'SAR',
      stockQuantity,
      isUnlimitedStock,
      status:
        stockQuantity > 0 || isUnlimitedStock ? ProductStatus.Available : ProductStatus.OutOfStock,
      optionValues: this.resolveOptionValues(variant.related_option_values, optionValueLookup),
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
        });
      }
    }

    return lookup;
  }

  private static resolveOptionValues(
    relatedOptionValueIds: Array<number | string> | undefined | null,
    lookup: OptionValueLookup,
  ): ProductVariantOptionValue[] {
    if (!Array.isArray(relatedOptionValueIds) || relatedOptionValueIds.length === 0) {
      return [];
    }

    const resolved: ProductVariantOptionValue[] = [];

    for (const rawId of relatedOptionValueIds) {
      const valueId = Number(rawId);
      if (Number.isNaN(valueId)) continue;

      const match = lookup.get(valueId);
      if (!match) continue;

      resolved.push({ ...match });
    }

    return resolved;
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
    if (item.status === 'hidden') return ProductStatus.Hidden;
    if (!item.is_available || item.status === 'out') return ProductStatus.OutOfStock;
    return ProductStatus.Available;
  }

  private static resolveImageUrl(item: SallaProductListItem): string | undefined {
    if (typeof item.main_image === 'string') {
      return item.main_image;
    }
    if (item.main_image && typeof item.main_image === 'object' && 'url' in item.main_image) {
      return (item.main_image as { url: string }).url;
    }

    if (Array.isArray(item.images) && item.images.length > 0) {
      const primaryImage = item.images.find((img: any) =>
        typeof img === 'object' ? Boolean(img.main) : false,
      );

      if (primaryImage && typeof primaryImage === 'object' && 'url' in primaryImage) {
        return primaryImage.url;
      }

      const firstImage = item.images[0];
      if (typeof firstImage === 'string') return firstImage;
      if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
        return firstImage.url;
      }
    }

    return undefined;
  }

  private static cleanDescription(description?: string): string | undefined {
    if (!description) return undefined;

    const cleaned = description.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > 0 ? cleaned : undefined;
  }
}
