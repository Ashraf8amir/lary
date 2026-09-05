import { ErrorCode } from '@common';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  constructor(configService: ConfigService) {
    super(SallaHttpClient.name, {
      baseURL: configService.getOrThrow<string>('salla.baseUrl'),
    });
  }

  async get<T>(url: string, accessToken: string, config?: AxiosRequestConfig): Promise<T> {
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  protected handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as SallaErrorBody | undefined;

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        this.logger.warn(`Salla API rate limited: ${error.config?.url}`);
        throw new SallaApiException('Salla API rate limited', {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          errorCode: ErrorCode.SALLA_RATE_LIMITED,
        });
      }

      if (status === HttpStatus.UNAUTHORIZED) {
        throw new SallaApiException('Salla API unauthorized', {
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCode.SALLA_AUTHORIZATION_FAILED,
        });
      }

      if (status === HttpStatus.BAD_REQUEST && data?.error === 'invalid_grant') {
        this.logger.warn(
          `Salla invalid_grant: ${data.error_description ?? 'authorization code or refresh token invalid'}`,
        );
        throw new SallaApiException(data.error_description ?? 'Invalid grant', {
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.SALLA_AUTHORIZATION_FAILED,
        });
      }

      if (status === HttpStatus.BAD_REQUEST && data?.error === 'invalid_client') {
        this.logger.error('Salla invalid_client: client credentials are invalid');
        throw new SallaApiException('Invalid client credentials', {
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCode.SALLA_AUTHORIZATION_FAILED,
        });
      }

      if (status && status >= 500) {
        this.logger.error(`Salla API server error: ${status} - ${error.config?.url}`);
      }

      throw new SallaApiException(
        data?.error_description ??
          data?.message ??
          data?.error ??
          `Salla API error: ${status ?? 'unknown'}`,
        {
          statusCode: status ?? HttpStatus.INTERNAL_SERVER_ERROR,
          errorCode: ErrorCode.SALLA_API_ERROR,
        },
      );
    }

    throw error;
  }
}
