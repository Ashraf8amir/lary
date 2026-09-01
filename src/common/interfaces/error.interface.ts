import { HttpStatus } from '@nestjs/common';

import { ErrorCode } from '../enums/error-code.enum';

export interface ErrorDetails {
  message: string;
  errors?: string[];
}

export interface BusinessExceptionOptions {
  statusCode?: HttpStatus;
  errorCode?: ErrorCode;
  errors?: string[];
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode: ErrorCode | string;
  message: string;
  errors?: string[];
  method: string;
  path: string;
  timestamp: string;
  requestId?: string;
  stack?: string;
}
