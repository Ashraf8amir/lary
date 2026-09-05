import { ErrorCode } from '@common';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SallaApiException } from '../exceptions/salla.exception';
import {
  SallaIntrospectData,
  SallaIntrospectResponse,
} from '../interfaces/salla-introspect.interface';
import { BaseHttpClient } from './base-http.client';

@Injectable()
export class SallaEmbeddedClient extends BaseHttpClient {
  constructor(configService: ConfigService) {
    super(SallaEmbeddedClient.name, {
      baseURL: configService.getOrThrow<string>('salla.embeddedApiUrl'),
      headers: {
        's-source': configService.getOrThrow<string>('salla.appId'),
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
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === HttpStatus.UNAUTHORIZED) {
        this.logger.warn('Embedded session token rejected by Salla (expired or invalid)');
        throw new SallaApiException('Embedded session token is invalid or expired', {
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCode.SALLA_AUTHORIZATION_FAILED,
        });
      }

      this.logger.error(`Salla introspect API error: ${status ?? 'network error'}`);
      throw new SallaApiException('Failed to verify embedded session token', {
        statusCode: status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: ErrorCode.SALLA_API_ERROR,
      });
    }

    throw error;
  }
}
