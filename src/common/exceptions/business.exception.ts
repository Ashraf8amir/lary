import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';
import { BusinessExceptionOptions } from '../interfaces/error.interface';

export class BusinessException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly errors?: string[];

  constructor(message: string, options: BusinessExceptionOptions = {}) {
    const statusCode = options.statusCode ?? HttpStatus.BAD_REQUEST;

    super(message, statusCode);

    this.errorCode = options.errorCode ?? ErrorCode.BAD_REQUEST;

    this.errors = options.errors;
  }
}
