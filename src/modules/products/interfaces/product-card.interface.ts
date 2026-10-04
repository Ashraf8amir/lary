export interface ProductCard {
  type: 'PRODUCT';
  variantId: string;
  name: string;
  priceAmount: number;
  currency: string;
  imageUrl?: string;
  productUrl?: string;
  optionsLabel?: string;
  isAvailable: boolean;
}
