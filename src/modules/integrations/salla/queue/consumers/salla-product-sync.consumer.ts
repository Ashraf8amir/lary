import { SALLA_EVENTS_EXCHANGE } from '@/infrastructure/rabbitmq/constants/exchanges.constant';
import {
  PRODUCT_SYNC_QUEUE,
  ROUTING_KEY_PRODUCT_SYNC_FULL,
  ROUTING_KEY_PRODUCT_SYNC_INCREMENTAL,
} from '@/infrastructure/rabbitmq/constants/queues.constant';
import { QueueMessage } from '@/infrastructure/rabbitmq/interfaces/queue-message.interface';
import { RabbitMqPublisherService } from '@/infrastructure/rabbitmq/rabbitmq-publisher.service';
import { ProductsService } from '@/modules/products/products.service';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { SallaApiClient } from '../../clients/salla-api.client';
import { SallaProductListItem } from '../../interfaces/salla-product.interface';
import { SallaProductMapper } from '../../mappers/salla-product.mapper';
import { SallaIntegrationRepository } from '../../repositories/salla-integration.repository';
import { SallaTokenService } from '../../services/salla-token.service';
import {
  ProductSyncFullMessage,
  ProductSyncIncrementalMessage,
} from '../publishers/salla-product-sync.publisher';

const PLATFORM = 'salla';
const MAX_ATTEMPTS = 3;

type SyncMessage = QueueMessage<ProductSyncFullMessage | ProductSyncIncrementalMessage>;

@Injectable()
export class SallaProductSyncConsumer {
  private readonly logger = new Logger(SallaProductSyncConsumer.name);

  constructor(
    private readonly integrationRepository: SallaIntegrationRepository,
    private readonly tokenService: SallaTokenService,
    private readonly apiClient: SallaApiClient,
    private readonly productsService: ProductsService,
    private readonly publisher: RabbitMqPublisherService,
  ) {}

  @RabbitSubscribe({
    exchange: SALLA_EVENTS_EXCHANGE,
    routingKey: [ROUTING_KEY_PRODUCT_SYNC_FULL, ROUTING_KEY_PRODUCT_SYNC_INCREMENTAL],
    queue: PRODUCT_SYNC_QUEUE,
  })
  async handle(message: SyncMessage): Promise<void> {
    try {
      if (message.type === 'product.sync.full') {
        await this.handleFullSync(message.payload as ProductSyncFullMessage);
      } else if (message.type === 'product.sync.incremental') {
        await this.handleIncrementalSync(message.payload as ProductSyncIncrementalMessage);
      } else {
        this.logger.warn(`Ignoring unknown message type: ${message.type}`);
      }
    } catch (error) {
      await this.handleFailure(message, error);
    }
  }

  private async handleFullSync({ storeId }: ProductSyncFullMessage): Promise<void> {
    const syncStartedAt = new Date();

    const integration = await this.integrationRepository.findByStoreId(storeId);
    if (!integration) {
      // Not transient — retrying this exact job will never succeed on its
      // own. Log and drop rather than burning retry attempts on it.
      this.logger.warn(`Full sync skipped: no Salla integration found for store ${storeId}`);
      return;
    }

    const accessToken = await this.tokenService.getValidAccessToken(integration);

    let page = 1;
    let totalPages = 1;

    do {
      const response = await this.apiClient.listProducts(accessToken, page);

      for (const item of response.data) {
        await this.syncProductItem(item, storeId);
      }

      totalPages = response.pagination.totalPages;
      page += 1;
    } while (page <= totalPages);

    const hiddenCount = await this.productsService.hideProductsNotSyncedSince(
      storeId,
      PLATFORM,
      syncStartedAt,
    );

    this.logger.log(
      `Full sync completed for store ${storeId}: hid ${hiddenCount} stale product(s)`,
    );
  }

  private async handleIncrementalSync({
    storeId,
    sallaProductId,
  }: ProductSyncIncrementalMessage): Promise<void> {
    const integration = await this.integrationRepository.findByStoreId(storeId);
    if (!integration) {
      this.logger.warn(`Incremental sync skipped: no Salla integration found for store ${storeId}`);
      return;
    }

    const accessToken = await this.tokenService.getValidAccessToken(integration);
    const response = await this.apiClient.getProduct(accessToken, sallaProductId);

    await this.syncProductItem(response.data, storeId);
  }

  private async syncProductItem(item: SallaProductListItem, storeId: string): Promise<void> {
    const productPayload = SallaProductMapper.toUpsertPayload(item, storeId);
    await this.productsService.upsertFromIntegration(productPayload);

    if (item.options?.length && item.skus?.length) {
      const optionValueLookup = SallaProductMapper.buildOptionValueLookup(item.options);

      for (const variant of item.skus) {
        const variantPayload = SallaProductMapper.toVariantUpsertPayload(
          variant,
          item.id.toString(),
          storeId,
          optionValueLookup,
        );
        await this.productsService.upsertVariant(variantPayload);
      }
    }
  }

  private async handleFailure(message: SyncMessage, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (message.attempt < MAX_ATTEMPTS) {
      this.logger.warn(
        `Retrying "${message.type}" (attempt ${message.attempt + 1}/${MAX_ATTEMPTS}) after error: ${errorMessage}`,
      );

      await this.publisher.publish(
        SALLA_EVENTS_EXCHANGE,
        this.routingKeyFor(message.type),
        message.type,
        message.payload,
        message.attempt + 1,
      );

      return; // original message is acked; the retry now exists as a new message
    }

    this.logger.error(
      `Giving up on "${message.type}" after ${message.attempt} attempts: ${errorMessage}`,
    );

    throw error; // nacked -> routed to the dead-letter queue configured in RabbitMqModule
  }

  private routingKeyFor(type: string): string {
    return type === 'product.sync.full'
      ? ROUTING_KEY_PRODUCT_SYNC_FULL
      : ROUTING_KEY_PRODUCT_SYNC_INCREMENTAL;
  }
}
