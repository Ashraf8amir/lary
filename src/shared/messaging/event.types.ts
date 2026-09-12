export const EVENTS = {
  PRODUCT_SYNC_FULL: 'salla.product.sync.full',
  PRODUCT_SYNC_INCREMENTAL: 'salla.product.sync.incremental',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
