import { ProductStatus } from '../enums/product-status.enum';

export interface ProductVariantOptionValue {
  optionName: string;
  value: string;
}

export interface ProductVariantItemPayload {
  externalId: string;
  sku?: string;
  barcode?: string;
  priceAmount: number;
  regularPriceAmount?: number;
  salePriceAmount?: number;
  currency: string;
  stockQuantity: number;
  isUnlimitedStock: boolean;
  imageUrl?: string;
  weightLabel?: string;
  status: ProductStatus;
  optionValues: ProductVariantOptionValue[];
}

export interface ProductUpsertPayload {
  storeId: string;
  externalId: string;
  platform: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  categories?: string[];
  brand?: string;
  tags?: string[];
  imageUrl?: string;
  productUrl?: string;
  hasVariants: boolean;
  priceAmount: number;
  regularPriceAmount?: number;
  salePriceAmount?: number;
  saleEndAt?: Date;
  currency: string;
  stockQuantity: number;
  isUnlimitedStock: boolean;
  promotionTitle?: string;
  promotionSubtitle?: string;
  ratingRate?: number;
  ratingCount?: number;
  calories?: number;
  weightLabel?: string;
  status: ProductStatus;
  variants: ProductVariantItemPayload[];
}
