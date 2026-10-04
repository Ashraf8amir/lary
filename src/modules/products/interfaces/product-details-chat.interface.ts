import { ProductCard } from './product-card.interface';

export interface GetProductDetailsInput {
  variantId?: string;
  productName?: string;
}

export interface ProductVariantDetailForModel {
  variantId: string;
  options: string;
  price: string;
  isAvailable: boolean;
}

export interface ProductDetailsChatResult {
  productName: string;
  category?: string;
  description?: string;
  hasVariants: boolean;
  variants: ProductVariantDetailForModel[];
  cards: ProductCard[];
}
