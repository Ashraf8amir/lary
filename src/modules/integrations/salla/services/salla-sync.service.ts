import { Injectable, Logger } from '@nestjs/common';
import { SallaProductSyncPublisher } from '../queue/publishers/salla-product-sync.publisher';

@Injectable()
export class SallaSyncService {
  private readonly logger = new Logger(SallaSyncService.name);

  constructor(private readonly publisher: SallaProductSyncPublisher) {}

  async triggerFullSync(storeId: string): Promise<void> {
    this.logger.log(`Queuing full product sync for store ${storeId}`);
    await this.publisher.publishFullSync(storeId);
  }

  async triggerIncrementalSync(storeId: string, sallaProductId: string): Promise<void> {
    this.logger.log(`Queuing incremental sync for product ${sallaProductId} (store ${storeId})`);
    await this.publisher.publishIncrementalSync(storeId, sallaProductId);
  }

  async triggerProductDeleted(storeId: string, sallaProductId: string): Promise<void> {
    this.logger.log(`Queuing deletion for product ${sallaProductId} (store ${storeId})`);
    await this.publisher.publishProductDeleted(storeId, sallaProductId);
  }
}
