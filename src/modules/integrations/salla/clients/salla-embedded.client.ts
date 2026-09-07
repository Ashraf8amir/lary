import sallaConfig from '@/config/salla.config';
import { ErrorCode } from '@common';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { SallaApiException } from '../exceptions/salla.exception';
import {
  SallaIntrospectData,
  SallaIntrospectResponse,
} from '../interfaces/salla-introspect.interface';
import { BaseHttpClient } from './base-http.client';

@Injectable()
export class SallaEmbeddedClient extends BaseHttpClient {
  constructor(@Inject(sallaConfig.KEY) config: ConfigType<typeof sallaConfig>) {
    super(SallaEmbeddedClient.name, {
      baseURL: config.embeddedApiUrl,
      headers: {
        's-source': config.appId,
      },
    });
  }

  async introspectToken(token: string): Promise<SallaIntrospectData> {
    const response = await this.post<SallaIntrospectResponse>('/exchange-authority/v1/introspect', {
      token,
    });
    return response.data;
  }

  protected handleError(error: unknown): never {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const status = error.response?.status;

    if (status === HttpStatus.UNAUTHORIZED) {
      this.logger.warn('Embedded session token rejected by Salla (expired or invalid)');

      throw new SallaApiException('Embedded session token is invalid or expired', {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: ErrorCode.SALLA_AUTHORIZATION_FAILED,
      });
    }

    if (!status) {
      this.logger.error(`Salla introspect API network error: ${error.code ?? 'UNKNOWN'}`);

      throw new SallaApiException('Failed to verify embedded session token', {
        statusCode: HttpStatus.BAD_GATEWAY,
        errorCode: ErrorCode.SALLA_API_ERROR,
      });
    }

    this.logger.error(`Salla introspect API error: ${status}`);

    throw new SallaApiException('Failed to verify embedded session token', {
      statusCode: status,
      errorCode: ErrorCode.SALLA_API_ERROR,
    });
  }
}
