import { ApiProperty } from '@nestjs/swagger';

class ProductCardResponseDto {
  @ApiProperty({ example: 'PRODUCT' })
  type!: 'PRODUCT';

  @ApiProperty({ description: 'External ID of the parent product (required when adding to cart)', example: '1762302633' })
  originalExternalId!: string;

  @ApiProperty({ example: '1762580101' })
  variantId!: string;

  @ApiProperty({ example: 'قميص جينز أوفرسايز أزرق فاتح' })
  name!: string;

  @ApiProperty({ example: 99.99 })
  priceAmount!: number;

  @ApiProperty({ example: 129.99, nullable: true })
  regularPriceAmount?: number;

  @ApiProperty({ example: 'SAR' })
  currency!: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', nullable: true })
  imageUrl?: string;

  @ApiProperty({ example: 'https://example.com/product', nullable: true })
  productUrl?: string;

  @ApiProperty({ example: 'M', nullable: true })
  optionsLabel?: string;

  @ApiProperty({ example: 'Limited Time Offer!', nullable: true })
  promotionTitle?: string;

  @ApiProperty({ example: true })
  isAvailable!: boolean;
}

export class ChatResponseDto {
  @ApiProperty({ example: 'مرحباً! كيف يمكنني مساعدتك اليوم؟' })
  replyText!: string;

  @ApiProperty({ type: () => [ProductCardResponseDto] })
  cards!: ProductCardResponseDto[];
}
