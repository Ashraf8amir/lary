import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { SubscriptionsService } from '../../modules/subscriptions/services/subscriptions.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const storeId: unknown = request.body?.storeId;
    if (typeof storeId !== 'string' || !storeId) {
      throw new BadRequestException('storeId is required to validate subscription.');
    }

    await this.subscriptionsService.validateChatAllowanceOrThrow(storeId);
    return true;
  }
}
