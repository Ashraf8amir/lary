export interface ProductCard {
  type: 'PRODUCT';
  variantId: string;
  name: string;
  priceAmount: number;
  regularPriceAmount?: number; //
  currency: string;
  imageUrl?: string;
  productUrl?: string;
  optionsLabel?: string;
  promotionTitle?: string; //
  isAvailable: boolean;
}
