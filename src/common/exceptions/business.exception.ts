import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export interface BusinessExceptionOptions<T = unknown> {
  statusCode?: HttpStatus;
  errorCode?: ErrorCode;
  errors?: T;
}

export class BusinessException<T = unknown> extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly errors?: T;

  constructor(message: string, options: BusinessExceptionOptions<T> = {}) {
    const statusCode = options.statusCode ?? HttpStatus.BAD_REQUEST;
    super(message, statusCode);

    this.errorCode = options.errorCode ?? ErrorCode.BAD_REQUEST;
    this.errors = options.errors;
  }
}
