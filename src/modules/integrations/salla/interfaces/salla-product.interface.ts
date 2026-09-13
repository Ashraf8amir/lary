export interface SallaMoney {
  amount: number;
  currency: string;
}

export interface SallaProductOptionValue {
  id: number;
  name: string;
  option_id: number;
}

export interface SallaProductOption {
  id: number;
  name: string;
  values: SallaProductOptionValue[];
}

export interface SallaProductVariant {
  id: number;
  price: SallaMoney;
  stock_quantity: number;
  sku?: string;
  barcode?: string;
  related_option_values: number[];
}

export interface SallaProductCategory {
  id: number;
  name: string;
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
  name: string;
  description?: string;
  price: SallaMoney;
  quantity: number;
  status: 'sale' | 'out' | 'hidden';
  is_available: boolean;
  main_image?: SallaMainImage | null;
  images?: SallaProductImage[];
  urls?: { customer?: string; admin?: string };
  categories?: SallaProductCategory[];
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
