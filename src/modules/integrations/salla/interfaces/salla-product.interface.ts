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
  name: string;
}

export interface SallaProductListItem {
  id: number;
  name: string;
  description?: string;
  price: SallaMoney;
  quantity: string;
  status: 'sale' | 'out' | 'hidden';
  is_available: boolean;
  thumbnail?: string;
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
