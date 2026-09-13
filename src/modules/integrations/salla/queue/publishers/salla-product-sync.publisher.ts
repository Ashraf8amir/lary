import { SALLA_EVENTS_EXCHANGE } from '@/infrastructure/rabbitmq/constants/exchanges.constant';
import {
  ROUTING_KEY_PRODUCT_SYNC_FULL,
  ROUTING_KEY_PRODUCT_SYNC_INCREMENTAL,
} from '@/infrastructure/rabbitmq/constants/queues.constant';
import { RabbitMqPublisherService } from '@/infrastructure/rabbitmq/rabbitmq-publisher.service';
import { Injectable } from '@nestjs/common';

export interface ProductSyncFullMessage {
  storeId: string;
}

export interface ProductSyncIncrementalMessage {
  storeId: string;
  sallaProductId: string;
}

@Injectable()
export class SallaProductSyncPublisher {
  constructor(private readonly publisher: RabbitMqPublisherService) {}

  async publishFullSync(storeId: string): Promise<void> {
    await this.publisher.publish<ProductSyncFullMessage>(
      SALLA_EVENTS_EXCHANGE,
      ROUTING_KEY_PRODUCT_SYNC_FULL,
      'product.sync.full',
      { storeId },
    );
  }

  async publishIncrementalSync(storeId: string, sallaProductId: string): Promise<void> {
    await this.publisher.publish<ProductSyncIncrementalMessage>(
      SALLA_EVENTS_EXCHANGE,
      ROUTING_KEY_PRODUCT_SYNC_INCREMENTAL,
      'product.sync.incremental',
      { storeId, sallaProductId },
    );
  }
}
