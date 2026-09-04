import { BusinessException, ErrorCode } from '@common';
import { CacheService } from '@infrastructure/cache/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '@infrastructure/cache/constants/cache.constants';
import { EncryptionService } from '@infrastructure/encryption/encryption.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SallaApiClient } from '../clients/salla-api.client';
import { SallaApiException } from '../exceptions/salla.exception';
import {
  SallaIntegrationRepository,
  SallaTokensUpdatePayload,
} from '../repositories/salla-integration.repository';
import type { SallaIntegrationDocument } from '../schemas/salla-integration.schema';

@Injectable()
export class SallaTokenService {
  private readonly logger = new Logger(SallaTokenService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly cacheService: CacheService,
    private readonly integrationRepository: SallaIntegrationRepository,
    private readonly sallaApiClient: SallaApiClient,
  ) {}

  encryptTokens(
    accessToken: string,
    refreshToken: string,
    expiresInSeconds: number,
  ): SallaTokensUpdatePayload {
    const encryptedAccess = this.encryptionService.encrypt(accessToken);
    const encryptedRefresh = this.encryptionService.encrypt(refreshToken);

    return {
      accessToken: {
        encrypted: encryptedAccess.encrypted,
        iv: encryptedAccess.iv,
        authTag: encryptedAccess.authTag,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      },
      refreshToken: {
        encrypted: encryptedRefresh.encrypted,
        iv: encryptedRefresh.iv,
        authTag: encryptedRefresh.authTag,
      },
      lastRefreshedAt: new Date(),
    };
  }

  decryptAccessToken(integration: SallaIntegrationDocument): string {
    if (!integration.accessToken?.encrypted) {
      throw new BusinessException('Access token is missing or integration not connected', {
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }

    return this.encryptionService.decrypt({
      encrypted: integration.accessToken.encrypted,
      iv: integration.accessToken.iv,
      authTag: integration.accessToken.authTag,
    });
  }

  decryptRefreshToken(integration: SallaIntegrationDocument): string {
    if (!integration.refreshToken?.encrypted) {
      throw new BusinessException('Refresh token is missing or integration revoked', {
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }

    return this.encryptionService.decrypt({
      encrypted: integration.refreshToken.encrypted,
      iv: integration.refreshToken.iv,
      authTag: integration.refreshToken.authTag,
    });
  }

  isTokenExpired(integration: SallaIntegrationDocument): boolean {
    if (!integration.accessToken?.expiresAt) return true;
    return new Date(integration.accessToken.expiresAt).getTime() <= Date.now();
  }

  isTokenExpiringSoon(integration: SallaIntegrationDocument): boolean {
    if (!integration.accessToken?.expiresAt) return true;

    const refreshWindowSeconds = this.configService.get<number>(
      'salla.tokenRefreshWindowSeconds',
      86400,
    );

    return (
      new Date(integration.accessToken.expiresAt).getTime() <=
      Date.now() + refreshWindowSeconds * 1000
    );
  }

  async getValidAccessToken(integration: SallaIntegrationDocument): Promise<string> {
    if (this.isTokenExpiringSoon(integration)) {
      return this.refreshAccessToken(integration);
    }
    return this.decryptAccessToken(integration);
  }

  async refreshAccessToken(integration: SallaIntegrationDocument): Promise<string> {
    const lockKey = CACHE_KEYS.TOKEN_LOCK(integration._id.toString());
    const lockTtl = CACHE_TTL.TOKEN_LOCK;

    const lockAcquired = await this.cacheService.setIfNotExists(lockKey, '1', lockTtl);

    if (!lockAcquired) {
      return this.handleConcurrentLock(lockKey, lockTtl, integration);
    }

    try {
      return await this.performRefresh(integration);
    } finally {
      await this.releaseRefreshLock(lockKey);
    }
  }

  private async handleConcurrentLock(
    lockKey: string,
    lockTtl: number,
    integration: SallaIntegrationDocument,
  ): Promise<string> {
    const pollInterval = 200;
    const maxWaitMs = lockTtl * 1000;
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const freshIntegration = await this.integrationRepository.findById(
        integration._id.toString(),
      );

      if (freshIntegration && !this.isTokenExpiringSoon(freshIntegration)) {
        this.logger.debug(
          `Token was refreshed by another process for integration ${integration._id}`,
        );
        return this.decryptAccessToken(freshIntegration);
      }

      const lockStillExists = (await this.cacheService.ttl(lockKey)) !== -2;
      if (!lockStillExists) {
        break;
      }
    }

    const reloadedAfterTimeout = await this.integrationRepository.findById(
      integration._id.toString(),
    );

    if (reloadedAfterTimeout && !this.isTokenExpiringSoon(reloadedAfterTimeout)) {
      return this.decryptAccessToken(reloadedAfterTimeout);
    }

    const newLockAcquired = await this.cacheService.setIfNotExists(lockKey, '1', lockTtl);
    if (!newLockAcquired) {
      throw new BusinessException('Token refresh concurrency limit exceeded', {
        errorCode: ErrorCode.SALLA_TOKEN_REFRESH_FAILED,
      });
    }

    try {
      return await this.performRefresh(reloadedAfterTimeout ?? integration);
    } finally {
      await this.releaseRefreshLock(lockKey);
    }
  }

  private async performRefresh(integration: SallaIntegrationDocument): Promise<string> {
    const reloadedIntegration = await this.integrationRepository.findById(
      integration._id.toString(),
    );

    if (reloadedIntegration && !this.isTokenExpiringSoon(reloadedIntegration)) {
      this.logger.debug(`Token already fresh for integration ${integration._id}`);
      return this.decryptAccessToken(reloadedIntegration);
    }

    const targetIntegration = reloadedIntegration ?? integration;
    const refreshToken = this.decryptRefreshToken(targetIntegration);

    let tokenResponse;

    try {
      tokenResponse = await this.sallaApiClient.refreshAccessToken(refreshToken);
    } catch (error) {
      await this.handleRefreshApiError(error, targetIntegration._id.toString());
    }

    if (!tokenResponse) {
      throw new BusinessException('Salla token refresh failed unexpectedly', {
        errorCode: ErrorCode.SALLA_TOKEN_REFRESH_FAILED,
      });
    }

    const newTokens = this.encryptTokens(
      tokenResponse.access_token,
      tokenResponse.refresh_token,
      tokenResponse.expires_in,
    );

    await this.integrationRepository.updateTokens(targetIntegration._id.toString(), newTokens);

    this.logger.log(`Token refreshed successfully for integration ${targetIntegration._id}`);

    return tokenResponse.access_token;
  }

  private async handleRefreshApiError(error: unknown, integrationId: string): Promise<never> {
    if (error instanceof SallaApiException) {
      if (error.errorCode === ErrorCode.SALLA_AUTHORIZATION_FAILED) {
        this.logger.warn(
          `Refresh token permanently invalid for integration ${integrationId} — marking as expired`,
        );

        try {
          await this.integrationRepository.markTokenExpired(integrationId);
        } catch {
          this.logger.error(`Failed to update integration ${integrationId} status to expired`);
        }

        throw new BusinessException(
          'Salla refresh token is invalid or revoked. Re-authorization required.',
          { errorCode: ErrorCode.SALLA_TOKEN_REFRESH_FAILED },
        );
      }

      if (error.errorCode === ErrorCode.SALLA_RATE_LIMITED) {
        this.logger.warn(
          `Salla rate limited during token refresh for integration ${integrationId}`,
        );
        throw new BusinessException('Salla API rate limited. Try again later.', {
          errorCode: ErrorCode.SALLA_RATE_LIMITED,
        });
      }
    }

    this.logger.error(`Transient token refresh failure for integration ${integrationId}`);

    throw new BusinessException('Salla token refresh failed. Will retry on next request.', {
      errorCode: ErrorCode.SALLA_TOKEN_REFRESH_FAILED,
    });
  }

  private async releaseRefreshLock(key: string): Promise<void> {
    try {
      await this.cacheService.del(key);
    } catch {
      this.logger.warn(`Failed to release refresh lock: ${key}`);
    }
  }
}
