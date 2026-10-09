import { SallaProductStatus } from '../enums/salla-product-status.enum';

export type OptionValueLookup = Map<
  number,
  { optionName: string; value: string; imageUrl?: string }
>;

export interface SallaMoney {
  amount: number;
  currency: string;
}

export interface SallaProductPromotion {
  title?: string;
  sub_title?: string;
}

export interface SallaProductRating {
  total?: number;
  count?: number;
  rate?: number;
}

export interface SallaProductOptionValue {
  id: number;
  name: string;
  option_id: number;
  image_url?: string;
  is_out_of_stock?: boolean;
}

export interface SallaProductOption {
  id: number;
  name: string;
  values: SallaProductOptionValue[];
}

export interface SallaProductVariant {
  id: number;
  price: SallaMoney;
  regular_price?: SallaMoney;
  sale_price?: SallaMoney | Record<string, never>;
  stock_quantity: number;
  unlimited_quantity?: boolean;
  sku?: string;
  barcode?: string;
  weight_label?: string;
  related_option_values: number[];
}

export interface SallaProductCategory {
  id: number;
  name: string;
}

export interface SallaProductBrand {
  id?: number;
  name?: string;
}

export interface SallaProductTag {
  id?: number;
  name?: string;
}

export interface SallaProductImage {
  id: number;
  url: string;
  main: boolean;
  alt?: string;
  video_url?: string | null;
  type: string;
  sort?: number;
}

export interface SallaMainImage {
  id: number;
  url: string;
  video_url?: string | null;
  type: string;
}

export interface SallaProductListItem {
  id: number;
  sku?: string;
  name: string;
  description?: string;
  price: SallaMoney;
  regular_price?: SallaMoney;
  sale_price?: SallaMoney | Record<string, never>;
  sale_end?: string | Record<string, never>;
  promotion?: SallaProductPromotion;
  rating?: SallaProductRating;
  quantity: number | string;
  unlimited_quantity?: boolean;
  status: SallaProductStatus | string;
  is_available: boolean;
  calories?: number | string;
  weight?: number;
  weight_type?: string;
  thumbnail?: string;
  main_image?: SallaMainImage | string | null;
  images?: Array<SallaProductImage | string>;
  urls?: { customer?: string; admin?: string };
  categories?: SallaProductCategory[];
  brand?: SallaProductBrand | Record<string, never>;
  tags?: Array<SallaProductTag | string>;
  options?: SallaProductOption[];
  skus?: SallaProductVariant[];
}

export interface SallaProductListResponse {
  status: number;
  success: boolean;
  data: SallaProductListItem[];
  pagination: {
    count: number;
    total: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
  };
}
