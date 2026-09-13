export const EVENTS = {
  PRODUCT_SYNC_FULL: 'salla.product.sync.full',
  PRODUCT_SYNC_INCREMENTAL: 'salla.product.sync.incremental',
  PRODUCT_SYNC_DELETED: 'salla.product.sync.deleted',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
