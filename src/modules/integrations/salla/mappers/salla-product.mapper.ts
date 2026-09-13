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
  static toUpsertPayload(
    item: SallaProductListItem,
    storeId: string,
    hasVariants: boolean,
  ): ProductUpsertPayload {
    return {
      storeId,
      externalId: item.id.toString(),
      platform: PLATFORM,
      name: item.name,
      description: item.description,
      category: item.category?.name,
      imageUrl: item.images?.[0]?.url,
      productUrl: item.url,
      hasVariants,
      priceAmount: item.price.amount,
      currency: item.price.currency,
      stockQuantity: item.quantity,
      status: this.mapStatus(item.status),
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

      if (!match) {
        continue;
      }

      resolved.push(match);
    }

    return resolved;
  }

  private static mapStatus(sallaStatus: SallaProductListItem['status']): ProductStatus {
    if (sallaStatus === 'out') return ProductStatus.OutOfStock;
    if (sallaStatus === 'hidden') return ProductStatus.Hidden;
    return ProductStatus.Available;
  }
}
