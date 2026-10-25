import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlanFeatureItemDto {
  @ApiProperty({ example: 'REMOVE_BRANDING' })
  key!: string;

  @ApiProperty({ example: 'Remove Lary branding' })
  label!: string;

  @ApiProperty({ example: "Hide the 'Powered by Lary' badge from the chat widget." })
  description!: string;
}

export class PlanLimitsDto {
  @ApiProperty({ example: 3000 })
  messagesLimit!: number;

  @ApiProperty({ example: 100 })
  productsLimit!: number;

  @ApiProperty({ example: 30 })
  historyRetentionDays!: number;
}

export class PlanSummaryDto {
  @ApiProperty({ example: 'Pro' })
  name!: string;

  @ApiProperty({ example: 'pro' })
  slug!: string;

  @ApiProperty({ type: () => PlanLimitsDto })
  limits!: PlanLimitsDto;

  @ApiProperty({ type: () => [PlanFeatureItemDto] })
  features!: PlanFeatureItemDto[];

  @ApiProperty({ example: false })
  isCurrent!: boolean;
}

export class SubscriptionSummaryDto {
  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: false })
  isTrial!: boolean;

  @ApiProperty({ example: false })
  trialBadge!: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  startDate!: string;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  endDate!: string;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  renewalOrExpirationDate!: string;

  @ApiProperty({ example: 12 })
  daysRemaining!: number;

  @ApiProperty({ example: true })
  hasAccess!: boolean;

  @ApiProperty({ example: 'pro' })
  currentPlanSlug!: string;
}

export class PlanDetailDto {
  @ApiProperty({ example: 'Pro' })
  name!: string;

  @ApiProperty({ example: 'pro' })
  slug!: string;

  @ApiProperty({ example: 3000, nullable: true })
  monthlySendingLimit!: number | string;

  @ApiProperty({ example: 100, nullable: true })
  concurrentProductLimit!: number | string;

  @ApiProperty({ example: 30, nullable: true })
  chatHistoryRetentionDays!: number | string;

  @ApiProperty({ type: () => [PlanFeatureItemDto] })
  unlockedFeatures!: PlanFeatureItemDto[];

  @ApiProperty({ type: () => [PlanFeatureItemDto] })
  lockedFeatures!: PlanFeatureItemDto[];
}

export class UsageSummaryDto {
  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  periodStart!: string;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  periodEnd!: string;

  @ApiProperty({ example: 1200 })
  messagesUsed!: number;

  @ApiPropertyOptional({ example: 3000, nullable: true })
  messagesLimit!: number | null;

  @ApiPropertyOptional({ example: 1800, nullable: true })
  messagesRemaining!: number | null;

  @ApiProperty({ example: 40 })
  usagePercent!: number;

  @ApiProperty({ example: false })
  isUnlimited!: boolean;
}

export class UsageHistoryItemDto {
  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  periodStart!: string;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  periodEnd!: string;

  @ApiProperty({ example: '2026-01' })
  label!: string;

  @ApiProperty({ example: 1200 })
  messagesUsed!: number;
}

export class ProductSlotsDto {
  @ApiProperty({ example: 42 })
  used!: number;

  @ApiPropertyOptional({ example: 100, nullable: true })
  limit!: number | null;

  @ApiPropertyOptional({ example: 58, nullable: true })
  remaining!: number | null;

  @ApiProperty({ example: 42 })
  usagePercent!: number;
}

export class BillingStoreDto {
  @ApiProperty({ example: '64f...' })
  id!: string;

  @ApiProperty({ example: 'My Store' })
  name!: string;

  @ApiProperty({ example: 'SAR' })
  currency!: string;

  @ApiPropertyOptional({ example: 'example.com' })
  domain?: string;

  @ApiPropertyOptional({ example: 'https://cdn.store.com/avatar.png' })
  avatar?: string;
}

export class BillingResponseDto {
  @ApiProperty({ type: () => BillingStoreDto })
  store!: BillingStoreDto;

  @ApiProperty({ type: () => SubscriptionSummaryDto })
  subscription!: SubscriptionSummaryDto;

  @ApiProperty({ type: () => PlanDetailDto })
  plan!: PlanDetailDto;

  @ApiProperty({ type: () => UsageSummaryDto })
  usage!: UsageSummaryDto;

  @ApiProperty({ type: () => [UsageHistoryItemDto] })
  usageHistory!: UsageHistoryItemDto[];

  @ApiProperty({ type: () => ProductSlotsDto })
  products!: ProductSlotsDto;

  @ApiProperty({ type: () => [PlanSummaryDto] })
  plans!: PlanSummaryDto[];
}



