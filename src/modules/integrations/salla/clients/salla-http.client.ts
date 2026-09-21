import sallaConfig from '@/config/salla.config';
import { ErrorCode } from '@common';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';

import { SallaApiException } from '../exceptions/salla.exception';
import { BaseHttpClient } from './base-http.client';

interface SallaErrorBody {
  error?: string;
  error_description?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

@Injectable()
export class SallaHttpClient extends BaseHttpClient {
  constructor(
    @Inject(sallaConfig.KEY)
    config: ConfigType<typeof sallaConfig>,
  ) {
    super(SallaHttpClient.name, {
      baseURL: config.baseUrl,
    });
  }

  async getAuthenticated<T>(
    url: string,
    accessToken: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return super.get<T>(url, {
      ...config,
      headers: {
        ...config?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async postFormUrlEncoded<T>(url: string, data: Record<string, string>): Promise<T> {
    const params = new URLSearchParams(data);

    return super.post<T>(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  protected handleError(error: unknown): never {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const status = error.response?.status;
    const data = error.response?.data as SallaErrorBody | undefined;

    if (!status) {
      this.logger.error(`Salla API request failed: ${this.getAxiosErrorMessage(error)}`);

      throw new SallaApiException('Salla API is currently unavailable', {
        statusCode: HttpStatus.BAD_GATEWAY,
        errorCode: ErrorCode.SALLA_API_ERROR,
      });
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      this.logger.warn(
        `Salla API rate limited: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      );

      throw new SallaApiException('Salla API rate limit exceeded', {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        errorCode: ErrorCode.SALLA_RATE_LIMITED,
      });
    }

    /*
     * Unauthorized
     *
     * Usually means the access token is invalid/expired.
     */
    if (status === HttpStatus.UNAUTHORIZED) {
      this.logger.warn(
        `Salla API unauthorized: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      );

      throw new SallaApiException('Salla API authorization failed', {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: ErrorCode.SALLA_AUTHORIZATION_FAILED,
      });
    }

    /*
     * OAuth invalid_grant
     *
     * Usually caused by an invalid/expired/rotated refresh token.
     */
    if (status === HttpStatus.BAD_REQUEST && data?.error === 'invalid_grant') {
      this.logger.warn('Salla OAuth invalid_grant received');

      throw new SallaApiException(data.error_description ?? 'Invalid Salla grant', {
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.SALLA_AUTHORIZATION_FAILED,
      });
    }

    /*
     * OAuth invalid_client
     *
     * This is NOT a user's authentication failure.
     * It indicates that our Salla client credentials are invalid.
     */
    if (status === HttpStatus.BAD_REQUEST && data?.error === 'invalid_client') {
      this.logger.error('Salla OAuth invalid_client: client credentials are invalid');

      throw new SallaApiException('Salla OAuth client configuration is invalid', {
        statusCode: HttpStatus.BAD_GATEWAY,
        errorCode: ErrorCode.SALLA_API_ERROR,
      });
    }

    /*
     * Salla server-side failure
     */
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Salla API server error: ${status} - ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      );

      throw new SallaApiException('Salla API is currently unavailable', {
        statusCode: HttpStatus.BAD_GATEWAY,
        errorCode: ErrorCode.SALLA_API_ERROR,
      });
    }

    if (status === HttpStatus.NOT_FOUND) {
      this.logger.warn(`Salla resource not found: ${error.config?.url}`);
      throw new SallaApiException(data?.message ?? 'Resource not found on Salla', {
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.SALLA_RESOURCE_NOT_FOUND,
      });
    }

    throw new SallaApiException(this.getSallaErrorMessage(data, status), {
      statusCode: status,
      errorCode: ErrorCode.SALLA_API_ERROR,
    });
  }

  private getSallaErrorMessage(data: SallaErrorBody | undefined, status: number): string {
    return data?.error_description ?? data?.message ?? data?.error ?? `Salla API error: ${status}`;
  }

  private getAxiosErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
      return 'Unknown error';
    }

    if (error.code === 'ECONNABORTED') {
      return 'Request timeout';
    }

    return error.message;
  }
}
