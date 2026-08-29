import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export interface BusinessExceptionOptions {
  statusCode?: HttpStatus;
  errorCode?: ErrorCode;
  errors?: any;
}

export class BusinessException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly details?: any;

  constructor(message: string, options: BusinessExceptionOptions = {}) {
    const statusCode = options.statusCode ?? HttpStatus.BAD_REQUEST;
    super(message, statusCode);

    this.errorCode = options.errorCode ?? ErrorCode.BAD_REQUEST;
    this.details = options.errors;
  }
}
