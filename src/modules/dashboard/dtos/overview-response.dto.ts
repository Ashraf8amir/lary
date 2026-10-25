import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OverviewStoreDto {
  @ApiProperty({ example: '64f...' })
  id!: string;

  @ApiProperty({ example: 'My Store' })
  name!: string;

  @ApiProperty({ example: 'SAR' })
  currency!: string;

  @ApiPropertyOptional({ example: 'https://cdn.store.com/avatar.png', nullable: true })
  avatar!: string | null;
}

export class OverviewSubscriptionSummaryDto {
  @ApiProperty({ example: 'Pro' })
  planName!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: false })
  trialBadge!: boolean;

  @ApiProperty({ example: 12 })
  daysRemaining!: number;

  @ApiProperty({ example: true })
  hasAccess!: boolean;
}

export class OverviewUsageSummaryDto {
  @ApiProperty({ example: 1200 })
  messagesUsed!: number;

  @ApiPropertyOptional({ example: 3000, nullable: true })
  messagesLimit!: number | null;

  @ApiProperty({ example: 40 })
  usagePercent!: number;

  @ApiPropertyOptional({ example: '2026-02-01T00:00:00.000Z', nullable: true })
  periodEnd!: string | null;
}

export class OverviewProductSlotsDto {
  @ApiProperty({ example: 42 })
  used!: number;

  @ApiPropertyOptional({ example: 100, nullable: true })
  limit!: number | null;

  @ApiProperty({ example: 42 })
  usagePercent!: number;
}

export class AssistantSummaryDto {
  @ApiProperty({ example: true })
  isEnabled!: boolean;

  @ApiProperty({ example: 'assistant' })
  botName!: string;

  @ApiPropertyOptional({ example: 'https://cdn.store.com/avatar.png', nullable: true })
  avatarUrl!: string | null;
}

export class SallaSummaryDto {
  @ApiProperty({ example: true })
  connected!: boolean;

  @ApiPropertyOptional({ example: 'connected', nullable: true })
  status!: string | null;
}

export class ActivitySummaryDto {
  @ApiProperty({ example: 42 })
  totalConversations!: number;

  @ApiProperty({ example: 1200 })
  totalMessages!: number;

  @ApiPropertyOptional({ example: '2026-01-15T10:00:00.000Z', nullable: true })
  lastActivityAt!: string | null;
}

export class OverviewResponseDto {
  @ApiProperty({ type: () => OverviewStoreDto })
  store!: OverviewStoreDto;

  @ApiProperty({ type: () => OverviewSubscriptionSummaryDto, nullable: true })
  subscriptionSummary!: OverviewSubscriptionSummaryDto | null;

  @ApiProperty({ type: () => OverviewUsageSummaryDto })
  usageSummary!: OverviewUsageSummaryDto;

  @ApiProperty({ type: () => OverviewProductSlotsDto })
  productSlots!: OverviewProductSlotsDto;

  @ApiProperty({ type: () => AssistantSummaryDto })
  assistant!: AssistantSummaryDto;

  @ApiProperty({ type: () => SallaSummaryDto })
  salla!: SallaSummaryDto;

  @ApiProperty({ type: () => ActivitySummaryDto })
  activity!: ActivitySummaryDto;
}

