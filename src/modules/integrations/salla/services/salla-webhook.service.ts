import sallaConfig from '@/config/salla.config';
import { BusinessException, ErrorCode } from '@common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { SALLA_SIGNATURE_REGEX } from '../constants/salla.constants';
import { SallaAppAuthorizeDataDto, SallaWebhookPayloadDto } from '../dtos/salla-webhook.dto';
import { SALLA_PRODUCT_UPSERT_EVENTS, SallaWebhookEvent } from '../enums/salla-webhook-event.enum';
import { SallaIntegrationRepository } from '../repositories/salla-integration.repository';
import { SallaIntegrationService } from './salla-integration.service';
import { SallaSyncService } from './salla-sync.service';

import { resolvePlanSlug, TRIAL_PLAN_SLUG } from '@/modules/subscriptions/enums/plan.enums';
import { SubscriptionStatus } from '@/modules/subscriptions/enums/subscription-status.enum';
import { PlansService } from '@/modules/subscriptions/services/plans.service';
import { SubscriptionsService } from '@/modules/subscriptions/services/subscriptions.service';

const SUBSCRIPTION_EVENT_STATUS: Record<string, SubscriptionStatus> = {
  'app.trial.started': SubscriptionStatus.TRIALING,
  'app.subscription.started': SubscriptionStatus.ACTIVE,
  'app.subscription.renewed': SubscriptionStatus.ACTIVE,
  'app.trial.expired': SubscriptionStatus.EXPIRED,
  'app.subscription.expired': SubscriptionStatus.EXPIRED,
  'app.trial.canceled': SubscriptionStatus.CANCELED,
  'app.subscription.canceled': SubscriptionStatus.CANCELED,
};

@Injectable()
export class SallaWebhookService {
  private readonly logger = new Logger(SallaWebhookService.name);

  constructor(
    @Inject(sallaConfig.KEY)
    private readonly config: ConfigType<typeof sallaConfig>,
    private readonly sallaIntegrationService: SallaIntegrationService,
    private readonly integrationRepository: SallaIntegrationRepository,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: PlansService,
    private readonly sallaSyncService: SallaSyncService,
  ) {}

  async handleWebhook(
    payload: SallaWebhookPayloadDto,
    rawBody: Buffer,
    signature?: string,
  ): Promise<void> {
    this.verifyWebhookSignature(rawBody, signature);

    const merchantId = payload.merchant.toString();
    const event = payload.event;

    if (event === SallaWebhookEvent.AppInstalled) {
      this.logger.log(`App installed successfully for merchant: ${merchantId}`);
      return;
    }

    if (event === SallaWebhookEvent.AppStoreAuthorize) {
      const authorizeData = await this.parseAuthorizeData(payload.data ?? {}, merchantId);
      await this.sallaIntegrationService.authorizeAndProvisionStore(authorizeData, merchantId);
      return;
    }

    if (event === SallaWebhookEvent.AppUninstalled) {
      await this.sallaIntegrationService.deactivateStoreIntegration(merchantId);
      return;
    }

    if (SALLA_PRODUCT_UPSERT_EVENTS.has(event)) {
      await this.handleProductChanged(event, payload.data, merchantId);
      return;
    }

    if (event === SallaWebhookEvent.ProductDeleted) {
      await this.handleProductDeleted(event, payload.data, merchantId);
      return;
    }

    if (this.isSubscriptionEvent(event)) {
      await this.handleSubscriptionEvent(event, payload.data, merchantId, payload.created_at);
      return;
    }

    this.logger.debug(`Ignored unhandled Salla event: ${event}`);
  }

  private verifyWebhookSignature(rawBody: Buffer, signature?: string): void {
    if (!signature) {
      this.logger.warn('Webhook received without x-salla-signature header');
      throw new BusinessException('Missing webhook signature', {
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }

    if (!SALLA_SIGNATURE_REGEX.test(signature)) {
      this.logger.warn('Webhook signature format is invalid');
      throw new BusinessException('Invalid webhook signature', {
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }

    const expectedSignature = createHmac('sha256', this.config.webhookSecret)
      .update(rawBody)
      .digest();

    const receivedSignature = Buffer.from(signature, 'hex');

    const isValid =
      receivedSignature.length === expectedSignature.length &&
      timingSafeEqual(receivedSignature, expectedSignature);

    if (!isValid) {
      this.logger.warn('Webhook signature mismatch detected');
      throw new BusinessException('Invalid webhook signature', {
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }
  }

  private async parseAuthorizeData(
    rawData: Record<string, unknown>,
    sallaMerchantId: string,
  ): Promise<SallaAppAuthorizeDataDto> {
    const dto = plainToInstance(SallaAppAuthorizeDataDto, rawData);
    const errors = await validate(dto, { whitelist: true });

    if (errors.length > 0) {
      this.logger.warn(
        `Rejected malformed app.store.authorize payload for merchant ${sallaMerchantId}: ` +
          errors.map((error) => Object.values(error.constraints ?? {}).join(', ')).join('; '),
      );

      throw new BusinessException('Invalid app.store.authorize payload', {
        errorCode: ErrorCode.VALIDATION_FAILED,
      });
    }

    return dto;
  }

  private async handleProductChanged(
    event: string,
    data: Record<string, unknown> | undefined,
    sallaMerchantId: string,
  ): Promise<void> {
    const sallaProductId = this.extractProductId(event, data, sallaMerchantId);
    if (!sallaProductId) return;

    const integration = await this.integrationRepository.findByMerchantId(sallaMerchantId);
    if (!integration) {
      this.logger.warn(`${event} for merchant ${sallaMerchantId} with no linked integration`);
      return;
    }

    await this.sallaSyncService.triggerIncrementalSync(
      integration.storeId.toString(),
      sallaProductId,
    );
  }

  private async handleProductDeleted(
    event: string,
    data: Record<string, unknown> | undefined,
    sallaMerchantId: string,
  ): Promise<void> {
    const sallaProductId = this.extractProductId(event, data, sallaMerchantId);
    if (!sallaProductId) return;

    const integration = await this.integrationRepository.findByMerchantId(sallaMerchantId);
    if (!integration) {
      this.logger.warn(
        `product.deleted for merchant ${sallaMerchantId} with no linked integration`,
      );
      return;
    }

    await this.sallaSyncService.triggerProductDeleted(
      integration.storeId.toString(),
      sallaProductId,
    );
  }

  private extractProductId(
    event: string,
    payloadData: Record<string, unknown> | undefined,
    sallaMerchantId: string,
  ): string | null {
    if (!payloadData) return null;

    const nestedData =
      typeof payloadData.data === 'object' && payloadData.data !== null
        ? (payloadData.data as Record<string, unknown>)
        : payloadData;

    const rawId =
      event.startsWith('product.option.') || nestedData.product_id
        ? (nestedData.product_id ?? nestedData.id)
        : (nestedData.id ?? nestedData.product_id);

    if (rawId === undefined || rawId === null) {
      this.logger.warn(
        `Could not extract product id from webhook (${event}) for merchant ${sallaMerchantId}`,
      );
      return null;
    }

    return String(rawId);
  }

  private isSubscriptionEvent(event: string): boolean {
    return Object.hasOwn(SUBSCRIPTION_EVENT_STATUS, event);
  }

  private parseEventTime(createdAt?: string): Date {
    if (!createdAt) return new Date();

    const iso = createdAt.includes('T') ? createdAt : `${createdAt.replace(' ', 'T')}Z`;
    const date = new Date(iso);

    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  private async handleSubscriptionEvent(
    event: string,
    data: Record<string, any> | undefined,
    sallaMerchantId: string,
    createdAt?: string,
  ): Promise<void> {
    if (!data) return;

    const integration = await this.integrationRepository.findByMerchantId(sallaMerchantId);
    if (!integration) {
      this.logger.warn(`${event} for unlinked merchant ${sallaMerchantId}`);
      return;
    }

    const storeId = integration.storeId.toString();
    const status = SUBSCRIPTION_EVENT_STATUS[event];
    const eventAt = this.parseEventTime(createdAt);

    if (status === SubscriptionStatus.EXPIRED || status === SubscriptionStatus.CANCELED) {
      await this.subscriptionsService.updateStatusByStoreId(
        storeId,
        status,
        eventAt,
        event.startsWith('app.trial.'),
      );
      return;
    }

    const isTrial = event === 'app.trial.started';
    const startDate = new Date(data.renew_date ?? data.start_date);
    const endDate = new Date(data.end_date);
    const planSlug = isTrial ? TRIAL_PLAN_SLUG : resolvePlanSlug(data.plan_name);

    if (!planSlug) {
      if (event === 'app.subscription.renewed') {
        await this.subscriptionsService.extendPeriod(storeId, startDate, endDate, eventAt);
        return;
      }
      this.logger.error(`Unknown plan "${data.plan_name}" in ${event} for store ${storeId}`);
      return;
    }

    const plan = await this.plansService.getBySlug(planSlug);
    if (!plan) {
      this.logger.error(`Plan "${planSlug}" is not seeded`);
      return;
    }

    await this.subscriptionsService.upsertFromWebhook({
      storeId,
      planId: plan._id.toString(),
      sallaSubscriptionId: data.subscription_id ? String(data.subscription_id) : undefined,
      status,
      startDate,
      endDate,
      isTrial,
      eventAt,
    });

    if (event === 'app.subscription.started' || event === 'app.trial.started') {
      this.logger.log(`Subscription started for store ${storeId}. Triggering Initial Full Sync...`);

      await this.sallaSyncService.triggerFullSync(storeId);
    }
  }
}
