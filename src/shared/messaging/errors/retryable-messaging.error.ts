import { MessagingError } from './messaging-error';

export class RetryableMessagingError extends MessagingError {
  readonly retryable = true;

  constructor(message: string) {
    super(message);
  }
}
