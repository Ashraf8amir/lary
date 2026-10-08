export enum SallaWebhookEvent {
  AppInstalled = 'app.installed',
  AppStoreAuthorize = 'app.store.authorize',
  AppUninstalled = 'app.uninstalled',
  ProductCreated = 'product.created',
  ProductUpdated = 'product.updated',
  ProductDeleted = 'product.deleted',
  ProductPriceUpdated = 'product.price.updated',
  ProductStatusUpdated = 'product.status.updated',
  ProductImageUpdated = 'product.image.updated',
  ProductCategoryUpdated = 'product.category.updated',
  ProductBrandUpdated = 'product.brand.updated',
  ProductOptionUpdated = 'product.option.updated',
}

export const SALLA_PRODUCT_UPSERT_EVENTS: ReadonlySet<string> = new Set([
  SallaWebhookEvent.ProductCreated,
  SallaWebhookEvent.ProductUpdated,
  SallaWebhookEvent.ProductPriceUpdated,
  SallaWebhookEvent.ProductStatusUpdated,
  SallaWebhookEvent.ProductImageUpdated,
  SallaWebhookEvent.ProductCategoryUpdated,
  SallaWebhookEvent.ProductBrandUpdated,
  SallaWebhookEvent.ProductOptionUpdated,
]);
