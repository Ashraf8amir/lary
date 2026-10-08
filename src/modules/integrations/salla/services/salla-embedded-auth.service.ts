import { BusinessException, ErrorCode } from '@common';
import { AuthService } from '@modules/auth/auth.service';
import { StoresService } from '@modules/stores/stores.service';
import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { SallaEmbeddedClient } from '../clients/salla-embedded.client';
import { EmbeddedNextStep } from '../enums/salla-embedded.enum';
import { EmbeddedSessionResult } from '../interfaces/salla-integration.interface';
import { SallaIntegrationRepository } from '../repositories/salla-integration.repository';

@Injectable()
export class SallaEmbeddedAuthService {
  private readonly logger = new Logger(SallaEmbeddedAuthService.name);

  constructor(
    private readonly sallaEmbeddedClient: SallaEmbeddedClient,
    private readonly integrationRepository: SallaIntegrationRepository,
    private readonly storesService: StoresService,
    private readonly authService: AuthService,
  ) {}

  async createSession(embeddedToken: string): Promise<EmbeddedSessionResult> {
    const { merchant_id: sallaMerchantId } =
      await this.sallaEmbeddedClient.introspectToken(embeddedToken);

    const integration = await this.integrationRepository.findByMerchantId(
      sallaMerchantId.toString(),
    );

    if (!integration) {
      this.logger.warn(`Embedded session requested for unknown Salla merchant: ${sallaMerchantId}`);
      throw new BusinessException('Store is not connected. Please reinstall the app.', {
        errorCode: ErrorCode.SALLA_INTEGRATION_NOT_FOUND,
      });
    }

    const store = await this.storesService.findById(integration.storeId.toString());

    if (!store) {
      this.logger.error(
        `Integration ${integration._id.toString()} points to a missing store ${integration.storeId.toString()}`,
      );
      throw new BusinessException('Store is not connected. Please reinstall the app.', {
        errorCode: ErrorCode.SALLA_INTEGRATION_NOT_FOUND,
      });
    }

    const { accessToken, accessTokenExpiresAt } = await this.authService.issueStatelessAccessToken(
      new Types.ObjectId(store.ownerId.toString()),
    );

    return {
      accessToken,
      accessTokenExpiresAt,
      nextStep: store.onboardingCompletedAt
        ? EmbeddedNextStep.Dashboard
        : EmbeddedNextStep.CompleteOnboarding,
    };
  }
}
