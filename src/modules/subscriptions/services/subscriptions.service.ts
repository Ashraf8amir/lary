import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PlanFeature } from '../enums/plan.enums';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import {
  SubscriptionsRepository,
  SubscriptionUpsertPayload,
} from '../repositories/subscriptions.repository';
import { SubscriptionDocument } from '../schemas/subscription.schema';
import { PlansService } from './plans.service';
import { UsageService } from './usage.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly ACCESS_STATUSES = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIALING,
    SubscriptionStatus.CANCELED,
  ];

  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly plansService: PlansService,
    private readonly usageService: UsageService,
  ) {}

  async upsertFromWebhook(payload: SubscriptionUpsertPayload) {
    const sub = await this.subscriptionsRepository.upsert(payload);

    if (!sub) {
      this.logger.warn(`Stale/duplicate event ignored for store ${payload.storeId}`);
      return null;
    }

    this.logger.log(`Subscription ${payload.status} for store ${payload.storeId}`);
    return sub;
  }

  async updateStatusByStoreId(
    storeId: string,
    status: SubscriptionStatus,
    eventAt: Date,
    onlyTrial = false,
  ) {
    const updated = await this.subscriptionsRepository.updateStatusByStoreId(
      storeId,
      status,
      eventAt,
      onlyTrial,
    );
    if (!updated) {
      this.logger.debug(`No update (stale or no match) for ${status} on store ${storeId}`);
    }
  }

  async extendPeriod(storeId: string, startDate: Date, endDate: Date, eventAt: Date) {
    const updated = await this.subscriptionsRepository.extendPeriod(
      storeId,
      startDate,
      endDate,
      eventAt,
    );
    if (!updated) {
      this.logger.warn(`Renewal ignored (stale or no subscription) for store ${storeId}`);
    }
  }

  async validateChatAllowanceOrThrow(storeId: string): Promise<void> {
    const subscription = await this.subscriptionsRepository.findByStoreId(storeId);

    if (!subscription) {
      throw new ForbiddenException('Store does not have an active subscription.');
    }

    if (!this.hasAccess(subscription)) {
      throw new ForbiddenException('Store subscription is expired or inactive.');
    }

    const plan = await this.plansService.getById(subscription.planId.toString());

    if (!plan) {
      this.logger.error(`Plan not found for subscription ${subscription._id}`);
      throw new ForbiddenException('Subscription plan data is missing.');
    }

    if (plan.limits.messagesLimit === -1) {
      return;
    }

    const usage = await this.usageService.getCurrentUsage(
      storeId,
      subscription.startDate,
      subscription.endDate,
    );

    const currentCount = usage?.aiMessagesCount ?? 0;

    if (currentCount >= plan.limits.messagesLimit) {
      this.logger.warn(`Store ${storeId} exceeded message limits.`);
      throw new ForbiddenException('Store has exceeded the monthly message limit.');
    }
  }

  async hasFeature(storeId: string, feature: PlanFeature): Promise<boolean> {
    const subscription = await this.subscriptionsRepository.findByStoreId(storeId);
    if (!subscription || !this.hasAccess(subscription)) return false;

    const plan = await this.plansService.getById(subscription.planId.toString());
    return plan?.features.includes(feature) ?? false;
  }

  private hasAccess(sub: SubscriptionDocument): boolean {
    return this.ACCESS_STATUSES.includes(sub.status) && sub.endDate > new Date();
  }

  async trackNewConversation(storeId: string, tokensUsed = 0): Promise<void> {
    const sub = await this.subscriptionsRepository.findByStoreId(storeId);
    if (!sub) return;

    await this.usageService.recordConversation(
      storeId,
      sub._id.toString(),
      sub.startDate,
      sub.endDate,
      tokensUsed,
    );
  }
}
