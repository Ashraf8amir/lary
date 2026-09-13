import { ProductStatus } from '../enums/product-status.enum';

export interface ProductUpsertPayload {
  storeId: string;
  externalId: string;
  platform: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  productUrl?: string;
  hasVariants: boolean;
  priceAmount: number;
  currency: string;
  stockQuantity: number;
  status: ProductStatus;
}
