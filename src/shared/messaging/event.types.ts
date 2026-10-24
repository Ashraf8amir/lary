export const EVENTS = {
  PRODUCT_SYNC_FULL: 'salla.product.sync.full',
  PRODUCT_SYNC_INCREMENTAL: 'salla.product.sync.incremental',
  PRODUCT_SYNC_DELETED: 'salla.product.sync.deleted',
  CHAT_CONVERSATION_SUMMARIZE: 'chat.conversation.summarize',
  CHAT_CONVERSATION_PERSIST: 'chat.conversation.persist',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
