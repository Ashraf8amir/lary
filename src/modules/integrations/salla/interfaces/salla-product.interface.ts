export interface SallaMoney {
  amount: number;
  currency: string;
}

export interface SallaProductImage {
  url: string;
}

export interface SallaProductListItem {
  id: number;
  name: string;
  description?: string;
  price: SallaMoney;
  quantity: number;
  status: 'sale' | 'out' | 'hidden';
  images?: SallaProductImage[];
  category?: { name: string };
  url?: string;
  has_options?: boolean;
}

export interface SallaProductOption {
  id: number;
  name: string;
  values: SallaProductOptionValue[];
}

export interface SallaProductOptionValue {
  id: number;
  name: string;
  option_id: number;
}

export interface SallaProductVariant {
  id: number;
  price: SallaMoney;
  stock_quantity: number;
  sku?: string;
  barcode?: string;
  related_option_values: number[];
}
