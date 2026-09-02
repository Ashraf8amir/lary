export class AuthResponseDto {
  accessToken?: string;

  accessTokenExpiresAt?: Date;

  refreshTokenExpiresAt?: Date;

  requiresTwoFactor?: boolean;

  mfaToken?: string;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
