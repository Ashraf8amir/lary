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
import { ErrorResponse } from '../interfaces/error-response.interface';

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
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttp = exception instanceof HttpException;
    const statusCode = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, errors } = this.extractDetails(exception, statusCode);
    const errorCode = this.extractErrorCode(exception, statusCode);
    const requestId = this.cls?.getId?.();
    const errorStack = this.extractStack(exception);

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      errorCode,
      message,
      ...(errors && { errors }),
      method: request.method,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
      ...(!this.isProduction && errorStack && { stack: errorStack }),
    };

    this.logException(exception, errorResponse);

    httpAdapter.reply(response, errorResponse, statusCode);
  }

  private extractErrorCode(exception: unknown, status: HttpStatus): ErrorCode | string {
    if (exception instanceof BusinessException) {
      return exception.errorCode;
    }

    // Mapping HTTP Status to default ErrorCode if not explicitly provided
    const statusKey = HttpStatus[status];
    return statusKey ? statusKey.toUpperCase() : ErrorCode.INTERNAL_SERVER_ERROR;
  }

  private extractDetails(
    exception: unknown,
    _statusCode: HttpStatus,
  ): { message: string; errors?: any } {
    if (exception instanceof BusinessException) {
      return {
        message: exception.message,
        errors: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;

        // Handles class-validator error array
        if (Array.isArray(resObj.message)) {
          return {
            message: 'Validation failed',
            errors: resObj.message,
          };
        }

        return {
          message: resObj.message || exception.message,
        };
      }

      return { message: String(res) };
    }

    // Safety fallback for unknown runtime errors in Production
    return {
      message: this.isProduction
        ? 'An unexpected error occurred. Please try again later.'
        : exception instanceof Error
          ? exception.message
          : 'Internal server error',
    };
  }

  private extractStack(exception: unknown): string | undefined {
    return exception instanceof Error ? exception.stack : undefined;
  }

  private logException(exception: unknown, errorRes: ErrorResponse): void {
    const logContext = `[${errorRes.method}] ${errorRes.path} - Status: ${errorRes.statusCode} - Code: ${errorRes.errorCode}`;

    if (errorRes.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${logContext} - Error: ${errorRes.message}`, this.extractStack(exception));
    } else {
      this.logger.warn(`${logContext} - Warn: ${errorRes.message}`);
    }
  }
}
