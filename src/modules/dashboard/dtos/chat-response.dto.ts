import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageCardDto {
  @ApiProperty({ example: 'PRODUCT' })
  type!: 'PRODUCT';

  @ApiPropertyOptional({ example: '1762302633' })
  originalExternalId?: string;

  @ApiProperty({ example: '1762580101' })
  variantId!: string;

  @ApiProperty({ example: 'Product name' })
  name!: string;

  @ApiProperty({ example: 99.99 })
  priceAmount!: number;

  @ApiPropertyOptional({ example: 129.99 })
  regularPriceAmount?: number;

  @ApiProperty({ example: 'SAR' })
  currency!: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/product' })
  productUrl?: string;

  @ApiPropertyOptional({ example: 'M' })
  optionsLabel?: string;

  @ApiPropertyOptional({ example: 'Limited Time Offer!' })
  promotionTitle?: string;

  @ApiProperty({ example: true })
  isAvailable!: boolean;
}

export class ChatConversationSummaryDto {
  @ApiProperty({ example: 'conv_123' })
  conversationId!: string;

  @ApiPropertyOptional({ example: 'Nike shoes size 42', nullable: true })
  title!: string | null;

  @ApiProperty({ example: 8 })
  messageCount!: number;

  @ApiProperty({ example: '2026-01-15T10:00:00.000Z' })
  lastMessageAt!: string;

  @ApiPropertyOptional({ example: '2026-02-15T10:00:00.000Z', nullable: true })
  expiresAt!: string | null;
}

export class ChatMessageDto {
  @ApiProperty({ example: 1 })
  sequence!: number;

  @ApiProperty({ example: 'user' })
  role!: string;

  @ApiProperty({ example: 'Do you have Nike Air Max?' })
  content!: string;

  @ApiPropertyOptional({ type: () => [ChatMessageCardDto] })
  cards!: ChatMessageCardDto[] | null;

  @ApiProperty({ example: '2026-01-15T10:00:00.000Z' })
  createdAt!: string;
}

export class ChatSummaryResponseDto {
  @ApiProperty({ example: 42 })
  totalConversations!: number;

  @ApiProperty({ example: 1200 })
  totalMessages!: number;

  @ApiProperty({ type: () => [ChatConversationSummaryDto] })
  conversations!: ChatConversationSummaryDto[];
}

