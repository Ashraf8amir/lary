export interface GenerateTokensResult {
  requiresTwoFactor?: false;
  accessToken: string;
  accessTokenExpiresAt: Date;
  rawRefreshToken?: string;
  refreshTokenExpiresAt?: Date;
}
