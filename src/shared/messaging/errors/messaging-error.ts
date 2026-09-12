import { BusinessException } from '@common/exceptions/business.exception';

export abstract class MessagingError extends BusinessException {
  abstract readonly retryable: boolean;

  protected constructor(message: string) {
    super(message);

    this.name = this.constructor.name;
  }
}
