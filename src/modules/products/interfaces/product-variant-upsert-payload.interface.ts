import { ProductStatus } from '../enums/product-status.enum';

export interface ProductVariantOptionValue {
  optionName: string;
  value: string;
}

export interface ProductVariantUpsertPayload {
  storeId: string;
  productExternalId: string;
  platform: string;
  externalId: string;
  sku?: string;
  priceAmount: number;
  currency: string;
  stockQuantity: number;
  isUnlimitedStock: boolean;
  status: ProductStatus;
  optionValues: ProductVariantOptionValue[];
}
