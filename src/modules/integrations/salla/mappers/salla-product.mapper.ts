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
    const hasVariants = (item.skus?.length ?? 0) > 0;

    return {
      storeId,
      externalId: item.id.toString(),
      platform: PLATFORM,
      name: item.name,
      description: item.description,
      category: item.categories?.[0]?.name,
      imageUrl: item.thumbnail,
      productUrl: item.urls?.customer,
      hasVariants,
      priceAmount: item.price.amount,
      currency: item.price.currency,
      stockQuantity: Number(item.quantity),
      status: this.mapStatus(item),
    };
  }

  static buildOptionValueLookup(options: SallaProductOption[]): OptionValueLookup {
    const lookup: OptionValueLookup = new Map();

    for (const option of options) {
      for (const value of option.values) {
        lookup.set(value.id, { optionName: option.name, value: value.name });
      }
    }

    return lookup;
  }

  static toVariantUpsertPayload(
    variant: SallaProductVariant,
    productExternalId: string,
    storeId: string,
    optionValueLookup: OptionValueLookup,
  ): ProductVariantUpsertPayload {
    return {
      storeId,
      productExternalId,
      platform: PLATFORM,
      externalId: variant.id.toString(),
      sku: variant.sku,
      priceAmount: variant.price.amount,
      currency: variant.price.currency,
      stockQuantity: variant.stock_quantity,
      status: variant.stock_quantity > 0 ? ProductStatus.Available : ProductStatus.OutOfStock,
      optionValues: this.resolveOptionValues(variant.related_option_values, optionValueLookup),
    };
  }

  private static resolveOptionValues(
    relatedOptionValueIds: number[],
    lookup: OptionValueLookup,
  ): ProductVariantOptionValue[] {
    const resolved: ProductVariantOptionValue[] = [];

    for (const valueId of relatedOptionValueIds) {
      const match = lookup.get(valueId);
      if (!match) continue; // see prior note: partial data beats dropping the variant
      resolved.push(match);
    }

    return resolved;
  }

  private static mapStatus(item: SallaProductListItem): ProductStatus {
    if (!item.is_available || item.status === 'out') return ProductStatus.OutOfStock;
    if (item.status === 'hidden') return ProductStatus.Hidden;
    return ProductStatus.Available;
  }
}
