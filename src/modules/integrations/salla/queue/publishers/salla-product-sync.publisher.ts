import { RabbitMqEventPublisherService } from '@/infrastructure/rabbitmq/publisher/rabbitmq-event-publisher.service';
import { SALLA_PRODUCT_EXCHANGE } from '@/infrastructure/rabbitmq/rabbitmq.constant';
import { Injectable } from '@nestjs/common';
import { EVENTS } from '@shared/messaging/event.types';
import { ROUTING_KEYS } from '@shared/messaging/routing-keys';
export interface ProductSyncFullPayload {
  storeId: string;
}

export interface ProductSyncIncrementalPayload {
  storeId: string;
  sallaProductId: string;
}

export interface ProductSyncDeletedPayload {
  storeId: string;
  sallaProductId: string;
}

@Injectable()
export class SallaProductSyncPublisher {
  constructor(private readonly publisher: RabbitMqEventPublisherService) {}

  async publishFullSync(storeId: string): Promise<void> {
    await this.publisher.publish<ProductSyncFullPayload>(
      SALLA_PRODUCT_EXCHANGE,
      ROUTING_KEYS.ROUTING_KEY_PRODUCT_SYNC_FULL,
      EVENTS.PRODUCT_SYNC_FULL,
      { storeId },
    );
  }

  async publishIncrementalSync(storeId: string, sallaProductId: string): Promise<void> {
    await this.publisher.publish<ProductSyncIncrementalPayload>(
      SALLA_PRODUCT_EXCHANGE,
      ROUTING_KEYS.ROUTING_KEY_PRODUCT_SYNC_INCREMENTAL,
      EVENTS.PRODUCT_SYNC_INCREMENTAL,
      { storeId, sallaProductId },
    );
  }

  async publishProductDeleted(storeId: string, sallaProductId: string): Promise<void> {
    await this.publisher.publish<ProductSyncDeletedPayload>(
      SALLA_PRODUCT_EXCHANGE,
      ROUTING_KEYS.ROUTING_KEY_PRODUCT_SYNC_DELETED,
      EVENTS.PRODUCT_SYNC_DELETED,
      { storeId, sallaProductId },
    );
  }
}
