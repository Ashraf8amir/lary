import { SallaApiResponse } from './salla-api.interface';

export interface SallaRefreshTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface SallaIntrospectData {
  merchant_id: number;
  user_id: number;
  exp: string;
}

export type SallaIntrospectResponse = SallaApiResponse<SallaIntrospectData>;
