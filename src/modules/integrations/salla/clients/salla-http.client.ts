import { ErrorCode } from '@common';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { SallaApiException } from '../exceptions/salla.exception';

interface SallaErrorBody {
  error?: string;
  error_description?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

@Injectable()
export class SallaHttpClient {
  private readonly logger = new Logger(SallaHttpClient.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.getOrThrow<string>('salla.baseUrl');
    const timeout = 15_000;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
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
      },
    );
  }

  async get<T>(url: string, accessToken: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, {
      ...config,
      headers: {
        ...config?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  }

  async post<T>(url: string, data: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async postFormUrlEncoded<T>(url: string, data: Record<string, string>): Promise<T> {
    const params = new URLSearchParams(data);
    const response = await this.client.post<T>(url, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  }
}
