import { EVENTS } from '@shared/messaging/event.types';
import { ROUTING_KEYS } from '@shared/messaging/routing-keys';
import { SALLA_PRODUCT_EXCHANGE } from './rabbitmq.constant';

export interface DomainEventConfig {
  event: string;
  routingKey: string;
  queueName: string;
}

export interface DomainConfig {
  domain: string;
  exchange: string;
  retryDelaysMs: number[];
  events: DomainEventConfig[];
}

export const DOMAINS: DomainConfig[] = [
  {
    domain: 'salla.product',
    exchange: SALLA_PRODUCT_EXCHANGE,
    retryDelaysMs: [5000, 30000, 180000],
    events: [
      {
        event: EVENTS.PRODUCT_SYNC_FULL,
        routingKey: ROUTING_KEYS.ROUTING_KEY_PRODUCT_SYNC_FULL,
        queueName: 'salla.product.sync.full.queue',
      },
      {
        event: EVENTS.PRODUCT_SYNC_INCREMENTAL,
        routingKey: ROUTING_KEYS.ROUTING_KEY_PRODUCT_SYNC_INCREMENTAL,
        queueName: 'salla.product.sync.incremental.queue',
      },
      {
        event: EVENTS.PRODUCT_SYNC_DELETED,
        routingKey: ROUTING_KEYS.ROUTING_KEY_PRODUCT_SYNC_DELETED,
        queueName: 'salla.product.sync.deleted.queue',
      },
    ],
  },
];
