export interface ProductCard {
  type: 'PRODUCT';
  variantId: string;
  name: string;
  priceAmount: number;
  currency: string;
  imageUrl?: string;
  optionsLabel?: string;
  isAvailable: boolean;
}
