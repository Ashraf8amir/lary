import { SALLA_PRODUCT_EXCHANGE } from '@/infrastructure/rabbitmq/rabbitmq.constant';
import { RabbitMqMessageHandler } from '@/infrastructure/rabbitmq/rabbitmq.message-handler';
import { ProductUpsertPayload } from '@/modules/products/interfaces/product-upsert.interface';
import { ProductsService } from '@/modules/products/services/products.service';
import { StorePlatform } from '@/modules/stores/enums/stores.enums';
import { ErrorCode } from '@common';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { NonRetryableMessagingError } from '@shared/messaging/errors/non-retryable-messaging.error';
import { RetryableMessagingError } from '@shared/messaging/errors/retryable-messaging.error';
import type { RabbitMqMessage } from '@shared/messaging/message.contract';
import { ROUTING_KEYS } from '@shared/messaging/routing-keys';
import { ClientSession } from 'mongoose';
import { SallaApiClient } from '../../clients/salla-api.client';
import { SallaApiException } from '../../exceptions/salla.exception';
import { SallaProductListItem } from '../../interfaces/salla-product.interface';
import {
  ProductSyncDeletedPayload,
  ProductSyncFullPayload,
  ProductSyncIncrementalPayload,
} from '../../interfaces/salla-sync.interface';
import { SallaProductMapper } from '../../mappers/salla-product.mapper';
import { SallaIntegrationRepository } from '../../repositories/salla-integration.repository';
import { SallaTokenService } from '../../services/salla-token.service';

@Injectable()
export class SallaProductSyncConsumer {
  private readonly logger = new Logger(SallaProductSyncConsumer.name);
  private readonly SALLA_PLATFORM = StorePlatform.Salla;

  constructor(
    private readonly messageHandler: RabbitMqMessageHandler,
    private readonly integrationRepository: SallaIntegrationRepository,
    private readonly tokenService: SallaTokenService,
    private readonly apiClient: SallaApiClient,
    private readonly productsService: ProductsService,
  ) {}

  @RabbitSubscribe({
    exchange: SALLA_PRODUCT_EXCHANGE,
    routingKey: ROUTING_KEYS.ROUTING_KEY_PRODUCT_SYNC_FULL,
    queue: 'salla.product.sync.full.queue',
    createQueueIfNotExists: false,
  })
  async handleFullSyncMessage(
    message: RabbitMqMessage<ProductSyncFullPayload>,
  ): Promise<void | Nack> {
    return this.messageHandler.executeWithoutTransaction(message, () =>
      this.processFullSync(message.payload),
    );
  }

  @RabbitSubscribe({
    exchange: SALLA_PRODUCT_EXCHANGE,
    routingKey: ROUTING_KEYS.ROUTING_KEY_PRODUCT_SYNC_INCREMENTAL,
    queue: 'salla.product.sync.incremental.queue',
    createQueueIfNotExists: false,
  })
  async handleIncrementalSyncMessage(
    message: RabbitMqMessage<ProductSyncIncrementalPayload>,
  ): Promise<void | Nack> {
    return this.messageHandler.execute(message, (session) =>
      this.processIncrementalSync(message.payload, session),
    );
  }

  @RabbitSubscribe({
    exchange: SALLA_PRODUCT_EXCHANGE,
    routingKey: ROUTING_KEYS.ROUTING_KEY_PRODUCT_SYNC_DELETED,
    queue: 'salla.product.sync.deleted.queue',
    createQueueIfNotExists: false,
  })
  async handleProductDeletedMessage(
    message: RabbitMqMessage<ProductSyncDeletedPayload>,
  ): Promise<void | Nack> {
    return this.messageHandler.execute(message, (session) =>
      this.processProductDeleted(message.payload, session),
    );
  }

  private async processFullSync({ storeId }: ProductSyncFullPayload): Promise<void> {
    const syncStartedAt = new Date();

    const integration = await this.integrationRepository.findByStoreId(storeId);
    if (!integration) {
      this.logger.warn(`Full sync skipped: no Salla integration found for store ${storeId}`);
      return;
    }

    const accessToken = await this.getAccessTokenOrThrow(integration);

    let page = 1;
    let totalPages = 1;
    let failedCount = 0;

    do {
      const response = await this.fetchListPageOrThrow(accessToken, page);
      const pagePayloads: ProductUpsertPayload[] = [];

      for (const item of response.data) {
        try {
          pagePayloads.push(SallaProductMapper.toUpsertPayload(item, storeId));
        } catch (error) {
          failedCount += 1;
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Skipping product ${item.id} (store ${storeId}) during full sync: ${message}`,
          );
        }
      }

      if (pagePayloads.length > 0) {
        await this.productsService.bulkUpsertFromIntegration(pagePayloads);
      }

      totalPages = response.pagination.totalPages;
      page += 1;
    } while (page <= totalPages);

    const hiddenCount = await this.productsService.hideProductsNotSyncedSince(
      storeId,
      this.SALLA_PLATFORM,
      syncStartedAt,
    );

    await this.integrationRepository.updateLastSyncAt(storeId);

    this.logger.log(
      `Full sync completed for store ${storeId}: hid ${hiddenCount} stale product(s), failed: ${failedCount}`,
    );
  }

  private async processIncrementalSync(
    { storeId, sallaProductId }: ProductSyncIncrementalPayload,
    session: ClientSession,
  ): Promise<void> {
    const integration = await this.integrationRepository.findByStoreId(storeId);
    if (!integration) {
      this.logger.warn(`Incremental sync skipped: no Salla integration found for store ${storeId}`);
      return;
    }

    const accessToken = await this.getAccessTokenOrThrow(integration);

    let response;
    try {
      response = await this.apiClient.getProduct(accessToken, sallaProductId);
    } catch (error) {
      throw this.classifySallaError(error);
    }

    await this.syncProductItem(response.data, storeId, session);
    await this.integrationRepository.updateLastSyncAt(storeId);
  }

  private async processProductDeleted(
    { storeId, sallaProductId }: ProductSyncDeletedPayload,
    session: ClientSession,
  ): Promise<void> {
    await this.productsService.markDeletedByExternalId(
      storeId,
      this.SALLA_PLATFORM,
      sallaProductId,
      session,
    );
  }

  private async syncProductItem(
    item: SallaProductListItem,
    storeId: string,
    session?: ClientSession,
  ): Promise<void> {
    const productPayload = SallaProductMapper.toUpsertPayload(item, storeId);
    await this.productsService.upsertFromIntegration(productPayload, session);
  }

  private async fetchListPageOrThrow(accessToken: string, page: number) {
    try {
      return await this.apiClient.listProducts(accessToken, page);
    } catch (error) {
      throw this.classifySallaError(error);
    }
  }

  private async getAccessTokenOrThrow(
    integration: Parameters<SallaTokenService['getValidAccessToken']>[0],
  ) {
    try {
      return await this.tokenService.getValidAccessToken(integration);
    } catch (error) {
      throw this.classifySallaError(error);
    }
  }

  private classifySallaError(error: unknown): NonRetryableMessagingError | RetryableMessagingError {
    if (error instanceof SallaApiException) {
      if (
        error.errorCode === ErrorCode.SALLA_AUTHORIZATION_FAILED ||
        error.errorCode === ErrorCode.SALLA_RESOURCE_NOT_FOUND
      ) {
        return new NonRetryableMessagingError(error.message);
      }
      return new RetryableMessagingError(error.message);
    }

    const message = error instanceof Error ? error.message : String(error);
    return new RetryableMessagingError(message);
  }
}
