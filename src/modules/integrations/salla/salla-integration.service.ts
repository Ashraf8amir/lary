import { BusinessException, ErrorCode } from '@common';
import { StoresService } from '@modules/stores/stores.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { StoreStatus } from '@/modules/stores/enums/store-status.enum';
import { UsersService } from '@/modules/users/users.service';
import { SallaApiClient } from './clients/salla-api.client';
import { SallaAppAuthorizeDataDto, SallaWebhookPayloadDto } from './dtos/salla-webhook.dto';
import { SallaIntegrationStatus } from './enums/salla-integration-status.enum';
import { SallaUserInfo } from './interfaces/salla-api.interface';
import { SallaIntegrationRepository } from './repositories/salla-integration.repository';
import { SallaTokenService } from './services/salla-token.service';

interface MerchantProfile {
  name: string;
  email: string;
  mobile?: string;
  storeName: string;
}

@Injectable()
export class SallaIntegrationService {
  private readonly logger = new Logger(SallaIntegrationService.name);

  constructor(
    private readonly integrationRepository: SallaIntegrationRepository,
    private readonly sallaTokenService: SallaTokenService,
    private readonly storesService: StoresService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sallaApiClient: SallaApiClient,
  ) {}

  async handleWebhook(
    payload: SallaWebhookPayloadDto,
    rawBody: Buffer,
    signature?: string,
  ): Promise<void> {
    this.validateWebhookSignature(rawBody, signature);

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
      authorizeData.expires,
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
      () => this.createStoreForMerchant(user._id.toString(), merchantProfile.storeName),
    );

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

  private async createStoreForMerchant(ownerId: string, storeName: string): Promise<string> {
    const store = await this.storesService.create({
      name: storeName,
      ownerId,
      platform: 'salla',
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

    // if (!userInfo?.email) {
    //   throw new BusinessException('Salla did not return a merchant email', {
    //     errorCode: ErrorCode.SALLA_API_ERROR,
    //   });
    // }

    return {
      name: userInfo.name || `Merchant ${sallaMerchantId}`,
      email: userInfo.email || `merchant-${sallaMerchantId}@salla.com`,
      mobile: userInfo.mobile,
      storeName: userInfo.name ? `${userInfo.name} Store` : `Store ${sallaMerchantId}`,
    };
  }

  private validateWebhookSignature(rawBody: Buffer | string, receivedSignature?: string): void {
    if (!this.verifySignature(rawBody, receivedSignature)) {
      throw new BusinessException('Invalid webhook signature', {
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }
  }

  private verifySignature(rawBody: Buffer | string, receivedSignature?: string): boolean {
    if (!receivedSignature) {
      return false;
    }

    const webhookSecret = this.configService.getOrThrow<string>('salla.webhookSecret');
    const computedSignature = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    const receivedBuffer = Buffer.from(receivedSignature, 'utf8');
    const computedBuffer = Buffer.from(computedSignature, 'utf8');

    if (receivedBuffer.length !== computedBuffer.length) {
      return false;
    }

    return timingSafeEqual(receivedBuffer, computedBuffer);
  }
}
