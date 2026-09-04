import { BusinessException } from '@common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { HttpStatus } from '@nestjs/common';

export class SallaApiException extends BusinessException {
  constructor(message: string, options: { statusCode?: number; errorCode?: ErrorCode } = {}) {
    super(message, {
      statusCode: options.statusCode ?? HttpStatus.BAD_REQUEST,
      errorCode: options.errorCode ?? ErrorCode.SALLA_API_ERROR,
    });
  }
}
