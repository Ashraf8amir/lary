export interface SallaTokenExchangeResponse {
  access_token: string;
  expires: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface SallaRefreshTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}
