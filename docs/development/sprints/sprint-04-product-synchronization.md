# Sprint 04 — Product Synchronization

## Sprint Goal

Build the product catalog pipeline that ingests, normalizes, and maintains product and variant data from Salla stores, using RabbitMQ as the backbone for asynchronous bulk synchronization and real-time webhook-driven invalidation.

By the end of this Sprint, the platform should be able to:

1. Receive product data from Salla via bulk catalog sync.
2. Normalize and persist products and variants in the database.
3. Process catalog updates in real-time through Salla webhooks.
4. Maintain accurate stock levels and pricing for conversational search.
5. Track synchronization status per store.

---

# Milestone

`Sprint 04 — Product Synchronization`

---

# Sprint Scope

## Included

- RabbitMQ configuration and connection management
- Product and variant Mongoose schemas
- Salla product data normalization layer
- Bulk catalog ingestion pipeline via RabbitMQ consumers
- Real-time catalog invalidation via Salla webhooks (`product.updated`, `product.deleted`)
- Sync status tracking per store
- Synchronization error handling and dead-letter queue support

---

# Architecture

Store Owner
↓
Salla Platform (products created/updated/deleted)
↓
┌─────────────────────────────┐
│ Salla Webhooks │
│ (product.updated, │
│ product.deleted) │
└──────────┬──────────────────┘
↓
┌─────────────────────────────┐
│ Bulk Sync Trigger │
│ (Full catalog pull via │
│ Salla Admin API) │
└──────────┬──────────────────┘
↓
┌─────────────────────────────┐
│ RabbitMQ │
│ Exchange: catalog.sync │
│ Queue: catalog.product.sync │
└──────────┬──────────────────┘
↓
┌─────────────────────────────┐
│ Product Sync Consumer │
│ (Normalize → Persist → │
│ Update sync status) │
└──────────┬──────────────────┘
↓
┌─────────────────────────────┐
│ MongoDB │
│ Products / Variants / │
│ Sync Status │
└─────────────────────────────┘

---

# Issue List

## Issue 01 — Configure RabbitMQ Connection

### Issue (Feature Template)

**Title:** `[Feature]: Add RabbitMQ configuration and connection module`  
**Labels:** `type:feature`, `priority:critical`, `area:foundation`, `area:infrastructure`

**Description:**
Integrate RabbitMQ as the asynchronous message broker for background job processing. Add a centralized configuration namespace, install required dependencies (`@nestjs/microservices`, `amqplib`), create a dedicated RabbitMQ module with connection lifecycle management, and configure the exchange and queue topology required for the product synchronization pipeline.

**Acceptance Criteria:**

- [ ] `@nestjs/microservices` and `amqplib` dependencies are installed.
- [ ] RabbitMQ configuration namespace is added (host, port, user, password, vhost).
- [ ] RabbitMQ connection is established on application bootstrap.
- [ ] Exchange `catalog.sync` (topic) is declared.
- [ ] Queue `catalog.product.sync` is declared and bound to the exchange.
- [ ] Dead-letter queue `catalog.product.sync.dlq` is declared for failed messages.
- [ ] Connection health is monitored and reconnection is handled gracefully.
- [ ] RabbitMQ configuration is validated at startup via Joi schema.
- [ ] `.env.example` is updated with required RabbitMQ variables.
- [ ] Secrets are not committed to the repository.

**Branch Name:**
`feature/configure-rabbitmq-connection`

**Milestone:**
`Sprint 04 — Product Synchronization`

**Dependencies:**
`Sprint 01 — Project Setup & Foundation`

**Notes:**
Follow the same config pattern used for Redis and Salla: a dedicated `rabbitmq.config.ts` file using `registerAs()`. The RabbitMQ module should be importable globally or via `AppModule`.

**Plan Commit:**

- Commit 1: `chore(deps): install @nestjs/microservices and amqplib`
- Commit 2: `feat(config): add rabbitmq configuration schema and env validation`
- Commit 3: `feat(rabbitmq): add connection module with lifecycle management`
- Commit 4: `feat(rabbitmq): declare catalog.sync exchange and queues`
- Commit 5: `fix(config): add rabbitmq variables to .env.example`

---

### Pull Request 01

**Title:** `feat: add RabbitMQ configuration and connection module`

**Summary:**
Integrates RabbitMQ as the project's message broker with centralized configuration, connection lifecycle management, and exchange/queue topology for the product synchronization pipeline.

**Related Issue:**
Closes #1

**Changes:**

- Add `@nestjs/microservices` and `amqplib` to `package.json`.
- Add `src/config/rabbitmq.config.ts` with Joi validation.
- Add `src/infrastructure/rabbitmq/rabbitmq.module.ts` with connection provider.
- Add `src/infrastructure/rabbitmq/rabbitmq.service.ts` with connect/disconnect lifecycle.
- Declare `catalog.sync` topic exchange, `catalog.product.sync` queue, and dead-letter queue.
- Register `RabbitMQModule` in `AppModule`.
- Update `.env.example` with `RABBITMQ_*` variables.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Started the application with a running RabbitMQ instance and verified exchange/queue declaration via the RabbitMQ management UI or connection logs.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 02 — Create Product & Variant Schemas

### Issue (Feature Template)

**Title:** `[Feature]: Add product and variant Mongoose schemas`  
**Labels:** `type:feature`, `priority:high`, `area:products`, `area:database`

**Description:**
Create the Mongoose database schemas for persisting product catalog data ingested from Salla. Products represent top-level catalog entries (name, description, category, images, base price), while variants represent purchasable sub-units of a product (size, color, SKU, price override, stock level, and attributes). Each product belongs to a store and tracks Salla-specific metadata for synchronization.

**Acceptance Criteria:**

- [ ] `Product` schema is created with fields: `storeId`, `sallaId`, `name`, `slug`, `description`, `category`, `images`, `basePrice`, `currency`, `status`, `attributes`, `createdAt`, `updatedAt`.
- [ ] `Variant` schema is created with fields: `productId`, `sallaId`, `sku`, `name`, `options` (color, size, etc.), `price`, `stock`, `attributes`, `status`, `createdAt`, `updatedAt`.
- [ ] `ProductStatus` enum includes at least: `active`, `inactive`, `archived`.
- [ ] `VariantStatus` enum includes at least: `active`, `out_of_stock`.
- [ ] Unique compound index on `storeId` + `sallaId` for products.
- [ ] Unique compound index on `productId` + `sallaId` for variants.
- [ ] Index on `storeId` for fast store-scoped queries.
- [ ] Index on `category` for category-based filtering.
- [ ] Timestamps are enabled.
- [ ] Schemas are registered in `MongooseModule.forFeature`.
- [ ] Product module is created and registered in `AppModule`.

**Branch Name:**
`feature/add-product-variant-schemas`

**Milestone:**
`Sprint 04 — Product Synchronization`

**Dependencies:**
`Sprint 01 — Project Setup & Foundation`

**Notes:**
Place schemas in `src/modules/products/schemas/`. The `options` field on Variant should be a flexible `Map` type to accommodate arbitrary Salla variant attributes (color, size, material, etc.).

**Plan Commit:**

- Commit 1: `feat(products): create product mongoose schema`
- Commit 2: `feat(products): create variant mongoose schema`
- Commit 3: `feat(products): register product module in app module`

---

### Pull Request 02

**Title:** `feat: add product and variant Mongoose schemas`

**Summary:**
Adds the persistence models for products and variants with proper indexing, status tracking, and Salla synchronization metadata.

**Related Issue:**
Closes #2

**Changes:**

- Add `src/modules/products/schemas/product.schema.ts`.
- Add `src/modules/products/schemas/variant.schema.ts`.
- Add `src/modules/products/enums/product-status.enum.ts`.
- Add `src/modules/products/enums/variant-status.enum.ts`.
- Add `src/modules/products/products.module.ts`.
- Register `ProductsModule` in `AppModule`.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Ran application bootstrap and confirmed schema compilation; verified indexes created against a test MongoDB instance.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 03 — Implement Salla Product Sync Service

### Issue (Feature Template)

**Title:** `[Feature]: Implement Salla product synchronization service`  
**Labels:** `type:feature`, `priority:critical`, `area:products`, `area:integration`, `area:salla`

**Description:**
Build the service responsible for pulling the full product catalog from a connected Salla store via the Salla Admin API, normalizing the response into the Product and Variant schemas, and processing the results through a RabbitMQ consumer. The sync is triggered per-store and processes messages from the `catalog.product.sync` queue, with each message representing a batch of products to upsert.

**Acceptance Criteria:**

- [ ] `ProductSyncService` is created with a method to trigger a full catalog sync for a store.
- [ ] Salla Admin API products endpoint is called with pagination support.
- [ ] Salla product response is normalized into Product and Variant schema shapes.
- [ ] Normalized products are published to the `catalog.product.sync` RabbitMQ queue.
- [ ] RabbitMQ consumer listens on `catalog.product.sync` and processes messages.
- [ ] Consumer performs idempotent upsert of products and variants by `sallaId`.
- [ ] Failed messages are routed to the dead-letter queue after retry exhaustion.
- [ ] Sync status per store is tracked (total products, synced, failed, last sync timestamp).
- [ ] Salla access token is retrieved via `SallaTokenService` before API calls.
- [ ] Sync is scoped per-store and does not affect other stores' catalogs.

**Branch Name:**
`feature/implement-product-sync-service`

**Milestone:**
`Sprint 04 — Product Synchronization`

**Dependencies:**

- Issue 01 — Configure RabbitMQ Connection
- Issue 02 — Create Product & Variant Schemas
- Sprint 03 — Salla Integration & OAuth

**Notes:**
Use the existing `SallaApiClient` for API calls and `SallaTokenService` for token retrieval. Pagination should handle Salla's standard pagination format (`data`, `pagination.next`). The consumer should be registered as a NestJS microservice listener using `@nestjs/microservices` transport.

**Plan Commit:**

- Commit 1: `feat(products): add salla product normalization mapper`
- Commit 2: `feat(products): add product sync service with catalog pull logic`
- Commit 3: `feat(products): add rabbitmq consumer for product sync queue`
- Commit 4: `feat(products): add sync status tracking schema and service`
- Commit 5: `test(products): add unit tests for product normalization and upsert`

---

### Pull Request 03

**Title:** `feat: implement Salla product synchronization service`

**Summary:**
Implements the full product catalog ingestion pipeline: pulls products from Salla, normalizes them, publishes to RabbitMQ, and processes them idempotently in a consumer with sync status tracking.

**Related Issue:**
Closes #3

**Changes:**

- Add `src/modules/products/services/product-sync.service.ts`.
- Add `src/modules/products/consumers/product-sync.consumer.ts`.
- Add `src/modules/products/mappers/salla-product.mapper.ts`.
- Add `src/modules/products/schemas/sync-status.schema.ts`.
- Add `src/modules/products/repositories/product.repository.ts`.
- Add `src/modules/products/repositories/variant.repository.ts`.
- Register RabbitMQ consumer listener in `ProductsModule`.
- Add unit tests for normalization and upsert logic.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Triggered a sync with a mocked Salla API response and verified: correct Product/Variant documents persisted in MongoDB, sync status updated, and failed messages routed to DLQ.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 04 — Handle Salla Product Webhooks

### Issue (Feature Template)

**Title:** `[Feature]: Handle Salla product webhooks for real-time catalog updates`  
**Labels:** `type:feature`, `priority:high`, `area:products`, `area:integration`, `area:salla`

**Description:**
Implement webhook handlers for Salla's `product.updated` and `product.deleted` events to keep the local product catalog in sync with real-time changes on the Salla store. When a product is updated or deleted on Salla, the webhook payload is processed to either re-normalize and upsert the product or soft-delete it from the local catalog.

**Acceptance Criteria:**

- [ ] Webhook endpoint handles `product.updated` events from Salla.
- [ ] Webhook endpoint handles `product.deleted` events from Salla.
- [ ] Webhook signature is validated against `SALLA_WEBHOOK_SECRET`.
- [ ] `product.updated` triggers re-fetch and upsert of the affected product.
- [ ] `product.deleted` marks the product as `archived` (soft delete).
- [ ] Variant data is updated or removed alongside the parent product.
- [ ] Webhook processing is idempotent (duplicate deliveries do not create duplicates).
- [ ] Invalid or unverifiable webhooks are rejected with appropriate HTTP status.
- [ ] Webhook events are logged for audit and debugging purposes.

**Branch Name:**
`feature/handle-product-webhooks`

**Milestone:**
`Sprint 04 — Product Synchronization`

**Dependencies:**

- Issue 02 — Create Product & Variant Schemas
- Issue 03 — Implement Salla Product Sync Service
- Sprint 03 — Salla Integration & OAuth

**Notes:**
Extend the existing Salla webhook controller or create a product-specific handler within the `ProductsModule`. Reuse the existing webhook signature validation logic from Sprint 03.

**Plan Commit:**

- Commit 1: `feat(products): add product.updated webhook handler`
- Commit 2: `feat(products): add product.deleted webhook handler with soft delete`
- Commit 3: `feat(products): add webhook signature validation middleware`
- Commit 4: `test(products): add webhook handler unit tests`

---

### Pull Request 04

**Title:** `feat: handle Salla product webhooks`

**Summary:**
Adds real-time product catalog synchronization via Salla webhook events, ensuring the local catalog reflects product updates and deletions as they happen on the store.

**Related Issue:**
Closes #4

**Changes:**

- Add `src/modules/products/controllers/product-webhook.controller.ts`.
- Add `src/modules/products/handlers/product-updated.handler.ts`.
- Add `src/modules/products/handlers/product-deleted.handler.ts`.
- Register product webhook routes in `ProductsModule`.
- Add webhook signature validation using existing Salla webhook secret.
- Add unit tests for webhook handlers.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Sent simulated `product.updated` and `product.deleted` webhook payloads and verified: product data updated/archived in MongoDB, variants synced accordingly, and invalid signatures rejected.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

# Release

## `v0.4.0` — Product Synchronization

The platform now ingests, normalizes, and maintains product catalog data from connected Salla stores. RabbitMQ handles asynchronous bulk synchronization while Salla webhooks keep the local catalog up to date in real time. Products and variants are persisted with full indexing, ready to power the conversational search engine in the next sprint.

### Highlights

- **RabbitMQ integration** — dedicated message broker for background catalog processing with dead-letter queue support.
- **Product & Variant schemas** — normalized data models with compound indexes on store and Salla identifiers.
- **Bulk catalog sync** — full product ingestion pipeline via Salla Admin API, processed asynchronously through RabbitMQ consumers.
- **Real-time webhook updates** — `product.updated` and `product.deleted` events update or archive the local catalog instantly.
- **Sync status tracking** — per-store visibility into sync progress, failures, and last sync timestamps.
