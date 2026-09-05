import { Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface BaseHttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export abstract class BaseHttpClient {
  protected readonly logger: Logger;
  protected readonly client: AxiosInstance;

  protected constructor(loggerContext: string, config: BaseHttpClientConfig) {
    this.logger = new Logger(loggerContext);

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 15_000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...config.headers,
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: unknown) => this.handleError(error),
    );
  }

  protected abstract handleError(error: unknown): never;

  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  protected async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }
}
