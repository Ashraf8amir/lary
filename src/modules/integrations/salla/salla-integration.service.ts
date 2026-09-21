import sallaConfig from '@/config/salla.config';
import { BusinessException, ErrorCode } from '@common';
import { StoresService } from '@modules/stores/stores.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { StorePlan } from '@/modules/stores/enums/store-plan.enum';
import { StoreStatus } from '@/modules/stores/enums/store-status.enum';
import { UsersService } from '@/modules/users/users.service';
import { SallaApiClient } from './clients/salla-api.client';
import { SallaAppAuthorizeDataDto, SallaWebhookPayloadDto } from './dtos/salla-webhook.dto';
import { SallaIntegrationStatus } from './enums/salla-integration-status.enum';
import { SallaUserInfo } from './interfaces/salla-api.interface';
import { SallaIntegrationRepository } from './repositories/salla-integration.repository';
import { SallaSyncService } from './services/salla-sync.service';
import { SallaTokenService } from './services/salla-token.service';

interface MerchantProfile {
  name: string;
  email: string;
  storeName: string;
  mobile?: string;
  avatar?: string;
  planType?: StorePlan;
}

@Injectable()
export class SallaIntegrationService {
  private readonly logger = new Logger(SallaIntegrationService.name);

  constructor(
    @Inject(sallaConfig.KEY)
    private readonly config: ConfigType<typeof sallaConfig>,
    private readonly integrationRepository: SallaIntegrationRepository,
    private readonly sallaTokenService: SallaTokenService,
    private readonly storesService: StoresService,
    private readonly usersService: UsersService,
    private readonly sallaApiClient: SallaApiClient,
    private readonly sallaSyncService: SallaSyncService,
  ) {}

  async handleWebhook(
    payload: SallaWebhookPayloadDto,
    rawBody: Buffer,
    signature?: string,
  ): Promise<void> {
    this.verifyWebhookSignature(rawBody, signature);

    const merchantId = payload.merchant.toString();

    switch (payload.event) {
      case 'app.installed':
        this.logger.log(`App installed successfully for merchant: ${merchantId}`);
        break;

      case 'app.store.authorize':
        await this.handleAppAuthorize(payload.data ?? {}, merchantId);
        break;

      case 'app.uninstalled':
        await this.handleAppUninstalled(merchantId);
        break;

      case 'product.created':
      case 'product.updated':
      case 'product.price.updated':
      case 'product.status.updated':
      case 'product.image.updated':
      case 'product.category.updated':
      case 'product.brand.updated':
      case 'product.option.updated':
        await this.handleProductChanged(payload.data, merchantId);
        break;

      case 'product.deleted':
        await this.handleProductDeleted(payload.data, merchantId);
        break;

      default:
        this.logger.debug(`Ignored unhandled Salla event: ${payload.event}`);
    }
  }

  async getIntegrationStatus(storeId: string): Promise<Record<string, unknown>> {
    const integration = await this.integrationRepository.findByStoreId(storeId);

    if (!integration) {
      return { connected: false, status: null };
    }

    return {
      connected: integration.status === SallaIntegrationStatus.Connected,
      status: integration.status,
      connectedAt: integration.connectedAt,
      lastSyncAt: integration.lastSyncAt,
      lastRefreshedAt: integration.lastRefreshedAt,
      scopes: integration.scopes,
    };
  }

  async getAccessTokenForStore(storeId: string): Promise<string> {
    const integration = await this.integrationRepository.findByStoreId(storeId);

    if (!integration) {
      throw new BusinessException('No Salla integration found for this store', {
        errorCode: ErrorCode.SALLA_INTEGRATION_NOT_FOUND,
      });
    }

    if (integration.status !== SallaIntegrationStatus.Connected) {
      throw new BusinessException('Salla integration is not connected', {
        errorCode: ErrorCode.SALLA_INTEGRATION_DISCONNECTED,
      });
    }

    return this.sallaTokenService.getValidAccessToken(integration);
  }

  private verifyWebhookSignature(rawBody: Buffer, signature?: string): void {
    if (!signature) {
      this.logger.warn('Webhook received without x-salla-signature header');

      throw new BusinessException('Missing webhook signature', {
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }

    if (!/^[a-f0-9]{64}$/i.test(signature)) {
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

  private async handleAppAuthorize(
    rawData: Record<string, unknown>,
    sallaMerchantId: string,
  ): Promise<void> {
    const authorizeData = await this.parseAuthorizeData(rawData, sallaMerchantId);
    const merchantProfile = await this.fetchMerchantProfile(
      authorizeData.access_token,
      sallaMerchantId,
    );

    const user = await this.usersService.findOrCreateMerchantUser({
      email: merchantProfile.email,
      fullName: merchantProfile.name,
      mobile: merchantProfile.mobile,
    });

    const tokenData = this.sallaTokenService.encryptTokens(
      authorizeData.access_token,
      authorizeData.refresh_token,
      new Date(authorizeData.expires * 1000),
    );

    const integration = await this.integrationRepository.linkAndActivate(
      sallaMerchantId,
      {
        merchantEmail: merchantProfile.email,
        merchantMobile: merchantProfile.mobile,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        scopes: authorizeData.scope ? authorizeData.scope.split(' ') : [],
      },
      () =>
        this.createStoreForMerchant(user._id.toString(), {
          storeName: merchantProfile.storeName,
          avatar: merchantProfile.avatar,
          planType: merchantProfile.planType as StorePlan,
        }),
    );

    await this.sallaSyncService.triggerFullSync(integration.storeId.toString());

    this.logger.log(
      `Salla integration activated for store ${integration.storeId.toString()} linked to user ${user.email} (Merchant: ${sallaMerchantId})`,
    );
  }

  private async handleAppUninstalled(sallaMerchantId: string): Promise<void> {
    const integration = await this.integrationRepository.findBySallaStoreId(sallaMerchantId);

    if (!integration) {
      this.logger.warn(
        `Received uninstall event for non-existent integration (merchant: ${sallaMerchantId})`,
      );
      return;
    }

    await this.integrationRepository.markDisconnected(integration._id.toString());

    await this.storesService.update(integration.storeId.toString(), {
      status: StoreStatus.Inactive,
    });

    this.logger.log(
      `Salla app uninstalled: Store ${integration.storeId.toString()} deactivated (Merchant: ${sallaMerchantId})`,
    );
  }

  private async createStoreForMerchant(
    ownerId: string,
    storeData: { storeName: string; avatar?: string; planType?: StorePlan },
  ): Promise<string> {
    const store = await this.storesService.create({
      name: storeData.storeName,
      ownerId,
      platform: 'salla',
      avatar: storeData.avatar,
      planType: storeData.planType ?? StorePlan.Free,
    });

    return store._id.toString();
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

  private async fetchMerchantProfile(
    accessToken: string,
    sallaMerchantId: string,
  ): Promise<MerchantProfile> {
    let userInfo: SallaUserInfo;

    try {
      userInfo = await this.sallaApiClient.getUserInfo(accessToken);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch merchant profile from Salla API for merchant ${sallaMerchantId}: ${errorMessage}`,
      );
      throw new BusinessException('Failed to fetch merchant profile from Salla', {
        errorCode: ErrorCode.SALLA_API_ERROR,
      });
    }

    if (!userInfo?.email) {
      throw new BusinessException('Salla did not return a merchant email', {
        errorCode: ErrorCode.SALLA_API_ERROR,
      });
    }

    return {
      name: userInfo.name ?? `Merchant ${sallaMerchantId}`,
      email: userInfo.email,
      mobile: userInfo.mobile,
      storeName: userInfo.merchant?.name ? `${userInfo.merchant.name}` : `Store ${sallaMerchantId}`,
      planType: userInfo.merchant?.plan as StorePlan,
      avatar: userInfo.merchant?.avatar,
    };
  }

  private async handleProductChanged(
    data: Record<string, unknown> | undefined,
    sallaMerchantId: string,
  ): Promise<void> {
    const sallaProductId = this.extractProductId(data, sallaMerchantId);
    if (!sallaProductId) return;

    const integration = await this.integrationRepository.findBySallaStoreId(sallaMerchantId);
    if (!integration) {
      this.logger.warn(
        `product.created/updated for merchant ${sallaMerchantId} with no linked integration`,
      );
      return;
    }

    await this.sallaSyncService.triggerIncrementalSync(
      integration.storeId.toString(),
      sallaProductId,
    );
  }

  private async handleProductDeleted(
    data: Record<string, unknown> | undefined,
    sallaMerchantId: string,
  ): Promise<void> {
    const sallaProductId = this.extractProductId(data, sallaMerchantId);
    if (!sallaProductId) return;

    const integration = await this.integrationRepository.findBySallaStoreId(sallaMerchantId);
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
    payload: Record<string, any> | undefined,
    sallaMerchantId: string,
  ): string | null {
    if (!payload) return null;

    const event = payload.event;
    const data = payload.data ?? payload;

    let rawId: unknown;

    if (event?.startsWith('product.option.') || data.product_id) {
      rawId = data.product_id ?? data.id;
    } else {
      rawId = data.id ?? data.product_id;
    }

    if (rawId === undefined || rawId === null) {
      this.logger.warn(
        `Could not extract product id from webhook payload for merchant ${sallaMerchantId}`,
      );
      return null;
    }

    return rawId.toString();
  }
}
