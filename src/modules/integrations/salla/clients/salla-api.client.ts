import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SallaUserInfo } from '../interfaces/salla-api.interface';
import type { SallaRefreshTokenResponse } from '../interfaces/salla-oauth.interface';
import { SallaHttpClient } from './salla-http.client';

@Injectable()
export class SallaApiClient {
  private readonly logger = new Logger(SallaApiClient.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly oauthUrl: string;

  constructor(
    private readonly httpClient: SallaHttpClient,
    private readonly configService: ConfigService,
  ) {
    this.clientId = this.configService.getOrThrow<string>('salla.clientId');
    this.clientSecret = this.configService.getOrThrow<string>('salla.clientSecret');
    this.oauthUrl = this.configService.getOrThrow<string>('salla.oauthUrl');
  }

  async refreshAccessToken(refreshToken: string): Promise<SallaRefreshTokenResponse> {
    this.logger.debug('Refreshing Salla access token');

    return this.httpClient.postFormUrlEncoded<SallaRefreshTokenResponse>(
      `${this.oauthUrl}/oauth2/token`,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      },
    );
  }

  async getUserInfo(accessToken: string): Promise<SallaUserInfo> {
    this.logger.debug('Fetching Salla merchant profile info');
    return this.httpClient.get<SallaUserInfo>(`${this.oauthUrl}/oauth2/user/info`, accessToken);
  }
}
