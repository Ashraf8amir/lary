import sallaConfig from '@/config/salla.config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type {
  SallaApiResponse,
  SallaStoreInfo,
  SallaUserInfo,
} from '../interfaces/salla-api.interface';
import type { SallaRefreshTokenResponse } from '../interfaces/salla-oauth.interface';
import {
  SallaProductListItem,
  SallaProductListResponse,
} from '../interfaces/salla-product.interface';
import { SallaHttpClient } from './salla-http.client';

@Injectable()
export class SallaApiClient {
  private readonly logger = new Logger(SallaApiClient.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly oauthUrl: string;

  constructor(
    @Inject(sallaConfig.KEY)
    private readonly config: ConfigType<typeof sallaConfig>,
    private readonly httpClient: SallaHttpClient,
  ) {
    this.clientId = this.config.clientId;
    this.clientSecret = this.config.clientSecret;
    this.oauthUrl = this.config.oauthUrl;
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
    this.logger.debug('Fetching Salla user info');

    const response = await this.httpClient.getAuthenticated<SallaApiResponse<SallaUserInfo>>(
      `${this.oauthUrl}/oauth2/user/info`,
      accessToken,
    );

    return response.data;
  }

  async getStoreInfo(accessToken: string): Promise<SallaStoreInfo> {
    this.logger.debug('Fetching Salla store info');

    const response = await this.httpClient.getAuthenticated<SallaApiResponse<SallaStoreInfo>>(
      `${this.config.baseUrl}/store/info`,
      accessToken,
    );

    return response.data;
  }

  async listProducts(accessToken: string, page: number): Promise<SallaProductListResponse> {
    this.logger.debug(`Fetching Salla products page ${page}`);

    return this.httpClient.getAuthenticated<SallaProductListResponse>(
      `${this.config.baseUrl}/products`,
      accessToken,
      { params: { page } },
    );
  }

  async getProduct(
    accessToken: string,
    productId: string,
  ): Promise<SallaApiResponse<SallaProductListItem>> {
    this.logger.debug(`Fetching Salla product ${productId}`);

    return this.httpClient.getAuthenticated<SallaApiResponse<SallaProductListItem>>(
      `${this.config.baseUrl}/products/${productId}`,
      accessToken,
    );
  }
}
