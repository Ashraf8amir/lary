import { SALLA_PRODUCT_EXCHANGE } from '@/infrastructure/rabbitmq/rabbitmq.constant';
import { RabbitMqMessageHandler } from '@/infrastructure/rabbitmq/rabbitmq.message-handler';
import { ProductsService } from '@/modules/products/products.service';
import { ErrorCode } from '@common';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { NonRetryableMessagingError } from '@shared/messaging/errors/non-retryable-messaging.error';
import { RetryableMessagingError } from '@shared/messaging/errors/retryable-messaging.error';
import type { RabbitMqMessage } from '@shared/messaging/message.contract';
import { ClientSession } from 'mongoose';
import { SallaApiClient } from '../../clients/salla-api.client';
import { SallaApiException } from '../../exceptions/salla.exception';
import { SallaProductListItem } from '../../interfaces/salla-product.interface';
import { SallaProductMapper } from '../../mappers/salla-product.mapper';
import { SallaIntegrationRepository } from '../../repositories/salla-integration.repository';
import { SallaTokenService } from '../../services/salla-token.service';
import {
  ProductSyncDeletedPayload,
  ProductSyncFullPayload,
  ProductSyncIncrementalPayload,
} from '../publishers/salla-product-sync.publisher';

const PLATFORM = 'salla';
const ROUTING_KEYS_MAP = {
  full: 'salla.product.sync.full',
  incremental: 'salla.product.sync.incremental',
  deleted: 'salla.product.sync.deleted',
};

@Injectable()
export class SallaProductSyncConsumer {
  private readonly logger = new Logger(SallaProductSyncConsumer.name);

  constructor(
    private readonly messageHandler: RabbitMqMessageHandler,
    private readonly integrationRepository: SallaIntegrationRepository,
    private readonly tokenService: SallaTokenService,
    private readonly apiClient: SallaApiClient,
    private readonly productsService: ProductsService,
  ) {}

  @RabbitSubscribe({
    exchange: SALLA_PRODUCT_EXCHANGE,
    routingKey: ROUTING_KEYS_MAP.full,
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
    routingKey: ROUTING_KEYS_MAP.incremental,
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
    routingKey: ROUTING_KEYS_MAP.deleted,
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

      for (const item of response.data) {
        try {
          await this.syncProductItem(item, storeId);
        } catch (error) {
          failedCount += 1;
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Skipping product ${item.id} (store ${storeId}) during full sync: ${message}`,
          );
        }
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
  }

  private async processProductDeleted(
    { storeId, sallaProductId }: ProductSyncDeletedPayload,
    session: ClientSession,
  ): Promise<void> {
    await this.productsService.markDeletedByExternalId(storeId, PLATFORM, sallaProductId, session);
  }

  private async syncProductItem(
    item: SallaProductListItem,
    storeId: string,
    session?: ClientSession,
  ): Promise<void> {
    const productPayload = SallaProductMapper.toUpsertPayload(item, storeId);
    await this.productsService.upsertFromIntegration(productPayload, session);

    if (item.options?.length && item.skus?.length) {
      const optionValueLookup = SallaProductMapper.buildOptionValueLookup(item.options);

      for (const variant of item.skus) {
        try {
          const variantPayload = SallaProductMapper.toVariantUpsertPayload(
            variant,
            item.id.toString(),
            storeId,
            optionValueLookup,
            !!item.unlimited_quantity,
          );
          await this.productsService.upsertVariant(variantPayload, session);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Skipping variant ${variant.id} of product ${item.id} (store ${storeId}): ${message}`,
          );
        }
      }
    }
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
