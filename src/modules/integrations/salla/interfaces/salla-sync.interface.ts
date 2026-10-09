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
