import { StoreStatus } from '@/modules/stores/enums/stores.enums';
import { UsersService } from '@/modules/users/users.service';
import { BusinessException, ErrorCode } from '@common';
import { StoresService } from '@modules/stores/stores.service';
import { Injectable, Logger } from '@nestjs/common';
import { SallaApiClient } from '../clients/salla-api.client';
import { SallaAppAuthorizeDataDto } from '../dtos/salla-webhook.dto';
import { SallaIntegrationStatus } from '../enums/salla-integration-status.enum';
import { SallaStoreInfo, SallaUserInfo } from '../interfaces/salla-api.interface';
import { SallaIntegrationStatusResponse } from '../interfaces/salla-integration.interface';
import { SallaStoreMapper } from '../mappers/salla-store.mapper';
import { SallaIntegrationRepository } from '../repositories/salla-integration.repository';
import { SallaSyncService } from './salla-sync.service';
import { SallaTokenService } from './salla-token.service';

@Injectable()
export class SallaIntegrationService {
  private readonly logger = new Logger(SallaIntegrationService.name);

  constructor(
    private readonly integrationRepository: SallaIntegrationRepository,
    private readonly sallaTokenService: SallaTokenService,
    private readonly storesService: StoresService,
    private readonly usersService: UsersService,
    private readonly sallaApiClient: SallaApiClient,
    private readonly sallaSyncService: SallaSyncService,
  ) {}

  async getIntegrationStatus(storeId: string): Promise<SallaIntegrationStatusResponse> {
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

  async authorizeAndProvisionStore(
    authorizeData: SallaAppAuthorizeDataDto,
    sallaMerchantId: string,
  ): Promise<void> {
    const { userInfo, storeInfo } = await this.fetchMerchantAndStoreInfo(
      authorizeData.access_token,
      sallaMerchantId,
    );

    const merchantUserPayload = SallaStoreMapper.toMerchantUser(
      userInfo,
      storeInfo,
      sallaMerchantId,
    );

    if (!merchantUserPayload.email) {
      throw new BusinessException('Salla did not return a valid merchant email', {
        errorCode: ErrorCode.SALLA_API_ERROR,
      });
    }

    const user = await this.usersService.findOrCreateMerchantUser(merchantUserPayload);

    const createStoreDto = SallaStoreMapper.toCreateStoreDto(
      user._id.toString(),
      storeInfo,
      sallaMerchantId,
    );

    const store = await this.storesService.upsertByMerchantId(createStoreDto);

    const tokenData = this.sallaTokenService.encryptTokens(
      authorizeData.access_token,
      authorizeData.refresh_token,
      new Date(authorizeData.expires * 1000),
    );

    const integration = await this.integrationRepository.linkAndActivate(
      sallaMerchantId,
      store._id.toString(),
      {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        scopes: authorizeData.scope ? authorizeData.scope.split(' ') : [],
      },
    );

    await this.sallaSyncService.triggerFullSync(integration.storeId.toString());

    this.logger.log(
      `Salla integration activated for store ${integration.storeId.toString()} linked to user ${user.email} (Merchant: ${sallaMerchantId})`,
    );
  }

  async deactivateStoreIntegration(sallaMerchantId: string): Promise<void> {
    const integration = await this.integrationRepository.findByMerchantId(sallaMerchantId);

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

  private async fetchMerchantAndStoreInfo(
    accessToken: string,
    sallaMerchantId: string,
  ): Promise<{ userInfo: SallaUserInfo; storeInfo: SallaStoreInfo }> {
    try {
      const [userInfo, storeInfo] = await Promise.all([
        this.sallaApiClient.getUserInfo(accessToken),
        this.sallaApiClient.getStoreInfo(accessToken),
      ]);

      return { userInfo, storeInfo };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch merchant/store info from Salla API for merchant ${sallaMerchantId}: ${errorMessage}`,
      );

      throw new BusinessException('Failed to fetch store profile from Salla', {
        errorCode: ErrorCode.SALLA_API_ERROR,
      });
    }
  }
}
