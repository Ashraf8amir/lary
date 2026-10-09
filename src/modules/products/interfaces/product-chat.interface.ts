import { ProductCard } from './product-card.interface';

export interface SearchFilters {
  query: string;
  maxPrice?: number;
  category?: string;
  optionFilter?: string;
}

export interface GetProductDetailsInput {
  variantId?: string;
  productName?: string;
}

export interface ProductVariantDetailForModel {
  variantId: string;
  options: string;
  price: string;
  regularPrice?: string;
  isAvailable: boolean;
}

export interface ProductDetailsChatResult {
  productName: string;
  category?: string;
  categories?: string[];
  brand?: string;
  description?: string;
  promotion?: string;
  rating?: { rate: number; count: number };
  calories?: number;
  weight?: string;
  hasVariants: boolean;
  variants: ProductVariantDetailForModel[];
  cards: ProductCard[];
}
