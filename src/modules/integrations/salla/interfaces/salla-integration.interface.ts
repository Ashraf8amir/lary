import { CreateStoreDto } from '@/modules/stores/dtos/create-store.dto';
import { EmbeddedNextStep } from '../enums/salla-embedded.enum';
import { SallaIntegrationStatus } from '../enums/salla-integration-status.enum';

export interface SallaTokensUpdatePayload {
  accessToken: {
    encrypted: string;
    iv: string;
    authTag: string;
    expiresAt: Date;
  };
  refreshToken: {
    encrypted: string;
    iv: string;
    authTag: string;
  };
  lastRefreshedAt: Date;
}

export interface SallaAuthorizePayload {
  accessToken: SallaTokensUpdatePayload['accessToken'];
  refreshToken: SallaTokensUpdatePayload['refreshToken'];
  scopes: string[];
}

export interface SallaIntegrationStatusResponse {
  connected: boolean;
  status: SallaIntegrationStatus | null;
  connectedAt?: Date;
  lastSyncAt?: Date;
  lastRefreshedAt?: Date;
  scopes?: string[];
}

export interface EmbeddedSessionResult {
  accessToken: string;
  accessTokenExpiresAt: Date;
  nextStep: EmbeddedNextStep;
}

export interface MappedMerchantUser {
  email: string;
  fullName: string;
  mobile?: string;
}

export type MappedSallaStore = Omit<CreateStoreDto, 'ownerId'>;
