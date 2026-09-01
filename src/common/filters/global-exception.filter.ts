import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';

import { Environment } from '../enums/environment.enum';
import { ErrorCode } from '../enums/error-code.enum';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorDetails, ErrorResponse } from '../interfaces/error.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction = process.env.NODE_ENV === Environment.Production;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly cls: ClsService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const context = host.switchToHttp();
    const request = context.getRequest();
    const response = context.getResponse();

    const statusCode = this.getStatusCode(exception);
    const { message, errors } = this.getErrorDetails(exception);
    const errorCode = this.getErrorCode(exception, statusCode);

    const requestId = this.getRequestId();
    const stack = this.getStack(exception);

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      errorCode,
      message,

      ...(errors?.length ? { errors } : {}),

      method: request.method,
      path: request.url,
      timestamp: new Date().toISOString(),

      ...(requestId && { requestId }),

      ...(!this.isProduction && stack ? { stack } : {}),
    };

    this.logException(exception, errorResponse);

    httpAdapter.reply(response, errorResponse, statusCode);
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorCode(exception: unknown, statusCode: number): ErrorCode | string {
    if (exception instanceof BusinessException) {
      return exception.errorCode;
    }

    return HttpStatus[statusCode]?.toUpperCase() ?? ErrorCode.INTERNAL_SERVER_ERROR;
  }

  private getErrorDetails(exception: unknown): ErrorDetails {
    if (exception instanceof BusinessException) {
      return {
        message: exception.message,
        errors: exception.errors,
      };
    }

    if (exception instanceof HttpException) {
      return this.getHttpExceptionDetails(exception);
    }

    return {
      message: this.isProduction
        ? 'An unexpected error occurred. Please try again later.'
        : this.getUnknownExceptionMessage(exception),
    };
  }

  private getHttpExceptionDetails(exception: HttpException): ErrorDetails {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        message: response,
      };
    }

    if (!this.isRecord(response)) {
      return {
        message: exception.message,
      };
    }

    const { message, errors } = response;

    if (Array.isArray(errors)) {
      return {
        message: typeof message === 'string' ? message : 'Request failed',
        errors: this.filterStringErrors(errors),
      };
    }

    if (Array.isArray(message)) {
      return {
        message: 'Validation failed',
        errors: this.filterStringErrors(message),
      };
    }

    if (typeof message === 'string') {
      return {
        message,
      };
    }

    return {
      message: exception.message,
    };
  }

  private filterStringErrors(errors: unknown[]): string[] {
    return errors.filter((error): error is string => typeof error === 'string');
  }

  private getUnknownExceptionMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Internal server error';
  }

  private getRequestId(): string | undefined {
    return this.cls.getId();
  }

  private getStack(exception: unknown): string | undefined {
    return exception instanceof Error ? exception.stack : undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private logException(exception: unknown, errorResponse: ErrorResponse): void {
    const context =
      `[${errorResponse.method}] ` +
      `${errorResponse.path} - ` +
      `Status: ${errorResponse.statusCode} - ` +
      `Code: ${errorResponse.errorCode}`;

    if (errorResponse.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${context} - Error: ${errorResponse.message}`, this.getStack(exception));

      return;
    }

    this.logger.warn(`${context} - Warn: ${errorResponse.message}`);
  }
}
