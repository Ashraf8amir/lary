import { ErrorCode } from '../enums/error-code.enum';

export interface ErrorDetail {
  field?: string;
  message: string;
  value?: unknown;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode: ErrorCode | string;
  message: string;
  errors?: ErrorDetail[] | string[];
  method: string;
  path: string;
  timestamp: string;
  requestId?: string;
  stack?: string;
}
