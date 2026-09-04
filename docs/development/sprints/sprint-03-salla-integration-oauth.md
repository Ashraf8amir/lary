# Sprint 03 — Salla Integration & OAuth

## Sprint Goal

Build the complete Salla integration flow that allows a merchant to connect their Salla store to the platform through OAuth.

By the end of this Sprint, a merchant should be able to:

1. Start the Salla installation/connect flow.
2. Authorize the application on Salla.
3. Return to the platform through the OAuth callback.
4. Exchange the authorization code for Salla credentials.
5. Identify the connected merchant/store.
6. Persist the Salla integration.
7. Securely manage Salla credentials.
8. Disconnect the Salla store.

---

# Milestone

`Sprint 03 — Salla Integration & OAuth`

---

# Sprint Scope

## Included

- Salla OAuth configuration
- OAuth authorization flow
- Authorization code exchange
- Merchant/store identification
- Salla integration persistence
- Salla credential storage
- Integration status
- Integration disconnect
- Salla API client foundation
- Salla authentication/credential handling
- Integration error handling
- Integration documentation

---

# Architecture

The basic flow is:

Merchant
↓
Connect / Install App
↓
Backend OAuth Authorization Endpoint
↓
Salla Authorization Page
↓
Merchant Approves
↓
Salla OAuth Callback
↓
Backend Exchanges Authorization Code
↓
Identify Merchant / Store
↓
Create or Update Integration
↓
Integration Connected

---

# Issue List

## Issue 01 — Configure Salla Application

### Issue (Feature Template)

**Title:** `[Feature]: Configure Salla application credentials`  
**Labels:** `type:feature`, `priority:high`, `area:salla`, `area:integration`

**Description:**
Configure the backend to communicate with the Salla application using environment-based configuration. Salla-specific credentials and configuration (client ID, client secret, redirect URI, authorization/token endpoints) must be centralized and validated, preventing sensitive information from being committed.

**Acceptance Criteria:**

- [ ] Salla client/application configuration is defined.
- [ ] Salla credentials are loaded from environment configuration.
- [ ] Redirect URI is configurable.
- [ ] Required Salla configuration values are validated.
- [ ] Secrets are not committed to the repository.
- [ ] Example configuration is documented.

**Branch Name:**
`feature/configure-salla-application`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**
`Sprint 01 — Project Setup & Foundation`

**Notes:**
Integrate into the centralized config module with strict schema validation.

**Plan Commit:**

- Commit 1: `chore: add salla application configuration schema`

---

### Pull Request 01

**Title:** `feat: configure Salla application credentials`

**Summary:**
Configures environment-based Salla application settings required for OAuth and API communication.

**Related Issue:**
Closes #11

**Changes:**

- Add Salla configuration namespace in configuration module.
- Add Joi / class-validator validation for Salla client ID, secret, and webhook secret.
- Update `.env.example` with required Salla variables.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Verified that application fails to start when required Salla variables are missing, and passes when configured properly.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 02 — Create Salla Integration Module

### Issue (Feature Template)

**Title:** `[Feature]: Create Salla integration module`  
**Labels:** `type:feature`, `priority:high`, `area:integration`, `area:salla`

**Description:**
Create the dedicated NestJS module responsible for managing the relationship between the platform and external Salla stores. The module should isolate OAuth workflows, credential handling, API communication, and lifecycle persistence, allowing clean extension for future ecommerce platforms.

**Acceptance Criteria:**

- [ ] Integration module exists.
- [ ] Salla-specific logic is isolated.
- [ ] OAuth logic has a clear location.
- [ ] Salla API communication has a clear location.
- [ ] Integration persistence has a clear location.
- [ ] Module can be extended for future platforms.

**Branch Name:**
`feature/create-salla-integration-module`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- Issue 01 — Configure Salla Application

**Notes:**
Ensure controllers and providers are scoped inside `src/modules/salla` or `src/modules/integrations/salla`.

**Plan Commit:**

- Commit 1: `feat: scaffold salla integration module`
- Commit 2: `feat: register salla module in root application module`

---

### Pull Request 02

**Title:** `feat: create Salla integration module`

**Summary:**
Introduces the Salla integration module and isolates platform-specific integration responsibilities.

**Related Issue:**
Closes #12

**Changes:**

- Create `SallaModule`, `SallaController`, and `SallaService` scaffolding.
- Setup directory hierarchy for DTOs, interfaces, and strategies.
- Register `SallaModule` in `AppModule`.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Ran build to ensure module dependency injection tree is clean and module compiles.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 03 — Create Integration Schema

### Issue (Feature Template)

**Title:** `[Feature]: Add merchant Salla integration schema`  
**Labels:** `type:feature`, `priority:high`, `area:integration`, `area:salla`

**Description:**
Create the Mongoose database schema responsible for storing merchant connections to Salla. The schema tracks store identity, platform type, encrypted/protected OAuth tokens (access token, refresh token, expiry), and connection status, ensuring unique indexing per merchant store to prevent duplicate records.

**Acceptance Criteria:**

- [ ] Integration schema is created.
- [ ] Salla merchant/store identifier is stored.
- [ ] Platform is represented.
- [ ] Integration status is represented (`connected`, `disconnected`).
- [ ] Credentials are stored securely.
- [ ] Sensitive fields (`accessToken`, `refreshToken`) are excluded from default queries (`select: false`).
- [ ] Required compound indexes are created.
- [ ] Timestamps are enabled.
- [ ] Duplicate Salla connections for the same store are prevented.

**Branch Name:**
`feature/add-salla-integration-schema`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- Issue 02 — Create Salla Integration Module

**Notes:**
Add field transformation or select exclusion to avoid accidental token leakage in API responses.

**Plan Commit:**

- Commit 1: `feat: create salla integration mongoose schema`

---

### Pull Request 03

**Title:** `feat: add Salla integration schema`

**Summary:**
Adds the persistence model for merchant Salla connections, including connection status, unique indexing, and protected credentials.

**Related Issue:**
Closes #13

**Changes:**

- Create `SallaIntegration` schema definition and interface.
- Add unique compound index on `merchantId` and `storeId`.
- Add credential fields with query exclusion flags (`select: false`).
- Register schema in `MongooseModule.forFeature`.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Verified schema creation in MongoDB and validated index constraints with automated model unit test.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 04 — Implement OAuth Authorization Endpoint

### Issue (Feature Template)

**Title:** `[Feature]: Add Salla OAuth authorization endpoint`  
**Labels:** `type:feature`, `priority:critical`, `area:salla`, `area:integration`

**Description:**
Create the backend endpoint (`GET /api/v1/integrations/salla/oauth`) that initiates the OAuth flow. The endpoint generates a cryptographically secure random `state` parameter, persists/caches it for subsequent validation, builds the Salla authorization URL, and redirects the merchant to Salla.

**Acceptance Criteria:**

- [ ] Endpoint `GET /api/v1/integrations/salla/oauth` exists.
- [ ] Endpoint generates the Salla authorization URL.
- [ ] Required OAuth query parameters are included (`client_id`, `redirect_uri`, `response_type=code`, `scope`, `state`).
- [ ] Cryptographic OAuth state is generated and temporarily persisted (e.g., Redis/session).
- [ ] Merchant is redirected via HTTP 302 to Salla's authorization page.
- [ ] Salla client secret is strictly excluded from authorization URLs.

**Branch Name:**
`feature/salla-oauth-authorization`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- Issue 01 — Configure Salla Application
- Issue 02 — Create Salla Integration Module

**Notes:**
State should have a short TTL (e.g., 5–10 minutes).

**Plan Commit:**

- Commit 1: `feat: add oauth state generation and redirect endpoint`

---

### Pull Request 04

**Title:** `feat: add Salla OAuth authorization flow`

**Summary:**
Adds the endpoint responsible for initiating the Salla OAuth authorization flow with secure state generation and redirection.

**Related Issue:**
Closes #14

**Changes:**

- Add `GET /api/v1/integrations/salla/oauth` route handler.
- Implement state generator service with temporary cache storage.
- Construct compliant Salla OAuth authorization URL.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Called the authorization endpoint and verified redirect target location and generated state parameters.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

### Issue (Feature Template)

**Title:** `[Feature]: Implement Salla OAuth callback`  
**Labels:** `type:feature`, `priority:critical`, `area:salla`, `area:integration`

**Description:**
Create the OAuth callback endpoint (`GET /api/v1/integrations/salla/callback`) that processes authorization responses. The endpoint validates the incoming `state`, exchanges the authorization `code` with Salla's token endpoint for access and refresh tokens, identifies merchant/store info, updates integration state, and redirects the merchant.

**Acceptance Criteria:**

- [ ] Callback endpoint `GET /api/v1/integrations/salla/callback` exists.
- [ ] Authorization code and state query parameters are captured.
- [ ] OAuth state is validated against stored state; invalid state throws an unauthorized error.
- [ ] Authorization code is exchanged with Salla via POST request.
- [ ] Salla token response is validated.
- [ ] Merchant/store identity is extracted from user/merchant info.
- [ ] Integration is persisted and marked as connected.
- [ ] Sensitive credentials are never reflected in the browser URL or response body.
- [ ] Merchant is redirected to the dashboard/frontend setup page.
- [ ] OAuth errors/rejections from Salla are handled gracefully.

**Branch Name:**
`feature/salla-oauth-callback`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- Issue 03 — Create Integration Schema
- Issue 04 — Implement OAuth Authorization Endpoint

**Notes:**
Ensure callback returns proper HTTP redirects rather than raw JSON payloads for merchant browser flow.

**Plan Commit:**

- Commit 1: `feat: implement authorization code exchange service`
- Commit 2: `feat: add oauth callback route and merchant profile retrieval`

---

### Pull Request 05

**Title:** `feat: implement Salla OAuth callback`

**Summary:**
Implements the Salla OAuth callback, authorization-code exchange, merchant identification, and integration persistence.

**Related Issue:**
Closes #15

**Changes:**

- Implement `GET /api/v1/integrations/salla/callback` controller and handler.
- Add code exchange logic contacting Salla token endpoint.
- Add merchant user info endpoint call to identify store metadata.
- Persist integration data and redirect to configured frontend success/failure route.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Simulated complete OAuth callback lifecycle with mocked Salla OAuth provider; verified store persistence and redirect headers.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 05 — Implement Integration Upsert

### Issue (Feature Template)

**Title:** `[Feature]: Implement Salla integration create or update flow`  
**Labels:** `type:feature`, `priority:high`, `area:integration`, `area:salla`

**Description:**
Implement idempotent persistence logic for Salla store integrations. The service must handle initial merchant installations as well as app reinstallations/reconnections without creating duplicate database records, ensuring tokens and statuses are updated cleanly.

**Acceptance Criteria:**

- [ ] New Salla store integrations are inserted.
- [ ] Existing store records are updated idempotently on reconnection.
- [ ] Duplicate integrations for the same store/merchant ID are prevented.
- [ ] Integration status is set to `connected`.
- [ ] New tokens (access token, refresh token, expiry) overwrite previous tokens securely.
- [ ] `updatedAt` timestamps are refreshed properly.
- [ ] Repository operation is safe for concurrent invocations.

**Branch Name:**
`feature/salla-integration-upsert`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- Issue 03 — Create Integration Schema
- Issue 05 — Implement Salla OAuth Callback

**Notes:**
Use atomic Mongoose `findOneAndUpdate` with `upsert: true`.

**Plan Commit:**

- Commit 1: `feat: implement salla integration repository upsert method`
- Commit 2: `test: add unit tests for integration upsert idempotency`

---

### Pull Request 06

**Title:** `feat: implement Salla integration upsert`

**Summary:**
Implements idempotent creation and update of Salla merchant integrations following OAuth authorization.

**Related Issue:**
Closes #16

**Changes:**

- Create `SallaIntegrationRepository` with atomic `upsertByStoreId`.
- Handle token encryption/hashing hooks before persisting credentials.
- Add status transition guarantees during reconnect flows.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Ran repeated upsert queries with identical store identifiers to confirm single document persistence.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 06 — Create Salla API Client

### Issue (Feature Template)

**Title:** `[Feature]: Create Salla API client foundation`  
**Labels:** `type:feature`, `priority:high`, `area:salla`, `area:integration`

**Description:**
Build an HTTP client wrapper using NestJS `HttpModule` (Axios) for interacting with the Salla Merchant API. The client encapsulates base URLs, authorization bearer injection, timeout policies, response data unwrapping, and standardized error translation.

**Acceptance Criteria:**

- [ ] Salla API client service is implemented.
- [ ] Base URL (`https://api.salla.dev/admin/v2`) is centralized.
- [ ] Authorization header injection mechanism is implemented.
- [ ] Request timeouts and retry options are configured.
- [ ] Salla-specific HTTP errors are mapped into domain exceptions.
- [ ] Sensitive tokens and payloads are stripped from outbound request logs.
- [ ] Client interface is decoupled and injectable into upcoming Salla domain services.

**Branch Name:**
`feature/create-salla-api-client`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- Issue 03 — Create Integration Schema

**Notes:**
Provide a clean interface like `sallaClient.getStoreDetails(token)` or `sallaClient.getProducts(storeId)`.

**Plan Commit:**

- Commit 1: `feat: add salla http client service`
- Commit 2: `feat: add error handling and request interceptors for salla client`

---

### Pull Request 07

**Title:** `feat: create Salla API client`

**Summary:**
Creates the reusable Salla API client for communicating with Salla admin endpoints.

**Related Issue:**
Closes #17

**Changes:**

- Add `@nestjs/axios` configuration for Salla API.
- Create `SallaApiClient` service with unified request methods.
- Add response interceptor to unwrap Salla standard response payloads (`data`, `status`, `pagination`).

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Executed mock API calls through `SallaApiClient` to verify header injection and payload unwrap handling.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 07 — Implement Integration Status

### Issue (Feature Template)

**Title:** `[Feature]: Add Salla integration status management`  
**Labels:** `type:feature`, `priority:medium`, `area:integration`, `area:salla`

**Description:**
Implement status query and management capabilities for Salla integrations. The platform must expose status indicators (`connected`, `disconnected`, `expired`) to allow the merchant dashboard to determine whether a store connection is healthy and active.

**Acceptance Criteria:**

- [ ] Integration status enum and state transitions are defined.
- [ ] Query service returns current integration status without exposing credentials.
- [ ] Failed or revoked integrations reflect correct non-connected states.
- [ ] Integration status endpoint or internal service method is available.
- [ ] Status changes are persisted and audited via timestamp fields.

**Branch Name:**
`feature/salla-integration-status`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- Issue 03 — Create Integration Schema
- Issue 06 — Implement Integration Upsert

**Notes:**
Expose a lightweight DTO containing `status`, `storeName`, `connectedAt`, and `lastSyncedAt`.

**Plan Commit:**

- Commit 1: `feat: add integration status query service`
- Commit 2: `feat: add integration status dto and response mapper`

---

### Pull Request 08

**Title:** `feat: add Salla integration status management`

**Summary:**
Adds integration lifecycle status handling and safe metadata queries for Salla connections.

**Related Issue:**
Closes #18

**Changes:**

- Add `getIntegrationStatus` method in `SallaService`.
- Create clean `IntegrationStatusResponseDto`.
- Filter out all sensitive tokens from integration status queries.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Queried status for both active and disconnected test store records to ensure accurate data projection.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 08 — Implement Salla Integration Disconnect

### Issue (Feature Template)

**Title:** `[Feature]: Add Salla integration disconnect`  
**Labels:** `type:feature`, `priority:medium`, `area:integration`, `area:salla`

**Description:**
Implement the endpoint (`DELETE /api/v1/integrations/salla`) and business logic to disconnect an existing Salla store integration. Disconnecting updates the integration status to `disconnected`, safely invalidates/removes stored access credentials, and preserves historical data without destructive merchant account deletion.

**Acceptance Criteria:**

- [ ] Disconnect endpoint `DELETE /api/v1/integrations/salla` exists.
- [ ] Integration record is located by store/merchant context.
- [ ] Integration status is transitioned to `disconnected`.
- [ ] Access/refresh credentials are wiped or invalidated.
- [ ] Platform business data (e.g., historical analytics) is preserved.
- [ ] Repeated disconnect calls on already disconnected integrations are handled idempotently.
- [ ] Reconnecting subsequent to disconnect is fully supported.

**Branch Name:**
`feature/salla-integration-disconnect`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- Issue 08 — Implement Integration Status

**Notes:**
Ensure endpoint responds with a 200 OK or 204 No Content upon success.

**Plan Commit:**

- Commit 1: `feat: implement salla disconnect service logic`
- Commit 2: `feat: add delete integration endpoint and credential wipe`

---

### Pull Request 09

**Title:** `feat: add Salla integration disconnect`

**Summary:**
Adds the ability to disconnect a Salla store while clearing sensitive tokens and preserving platform records.

**Related Issue:**
Closes #19

**Changes:**

- Add `DELETE /api/v1/integrations/salla` controller endpoint.
- Implement `disconnectStore` method in `SallaService`.
- Transition status to `disconnected` and clear active OAuth tokens.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Tested disconnect endpoint; verified token fields were cleared in DB and status updated to `disconnected`.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 09 — Handle Salla Integration Errors

### Issue (Feature Template)

**Title:** `[Feature]: Add Salla integration error handling`  
**Labels:** `type:feature`, `priority:high`, `area:salla`, `area:integration`

**Description:**
Implement centralized error handling and domain exceptions for the Salla integration lifecycle. Captures OAuth exchange rejections, invalid/expired state tokens, Salla upstream API failures, and network timeouts, converting them into clear application errors without exposing provider secrets.

**Acceptance Criteria:**

- [ ] Custom domain exceptions are created (`SallaOAuthException`, `SallaApiException`, `InvalidOAuthStateException`).
- [ ] OAuth errors from Salla query parameters (`?error=access_denied`) are caught and handled.
- [ ] Upstream Salla 4xx/5xx responses are caught and translated into consistent API errors.
- [ ] Sensitive access tokens/keys are excluded from error messages and logs.
- [ ] Errors are logged with contextual operation metadata for debugging.

**Branch Name:**
`feature/handle-salla-integration-errors`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- Issue 05 — Implement Salla OAuth Callback
- Issue 07 — Create Salla API Client

**Notes:**
Integrate with the global exception filter configured in Sprint 01.

**Plan Commit:**

- Commit 1: `feat: define salla domain exception classes`
- Commit 2: `feat: add salla api error translation interceptor`

---

### Pull Request 10

**Title:** `feat: handle Salla integration errors`

**Summary:**
Adds domain-specific exception handling across the Salla OAuth and API integration flows.

**Related Issue:**
Closes #20

**Changes:**

- Add `src/modules/salla/exceptions` module classes.
- Implement error translator inside `SallaApiClient`.
- Handle callback failure redirects for unauthorized / canceled OAuth attempts.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Simulated Salla API 401, 403, 500 responses and verified that sanitized domain errors were logged and returned.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

### Issue (Feature Template)

**Title:** `[Feature]: Add Salla OAuth integration tests`  
**Labels:** `type:test`, `priority:high`, `area:salla`, `area:integration`

**Description:**
Add automated end-to-end and integration tests covering the complete Salla OAuth authorization and integration lifecycle against mocked Salla API endpoints.

**Acceptance Criteria:**

- [ ] Test suite verifies authorization redirect and state generation.
- [ ] Test suite verifies successful callback code exchange and merchant persistence.
- [ ] Test suite validates invalid OAuth state rejection.
- [ ] Test suite covers reconnection and duplicate prevention logic.
- [ ] Test suite covers store disconnect flow and credential cleanup.
- [ ] Salla API client failures and network timeouts are tested.
- [ ] Tests pass consistently in CI/test environments without external network dependencies.

**Branch Name:**
`test/salla-integration`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- All implementation Issues in Sprint 03

**Notes:**
Use NestJS testing module and mock Axios calls / Nock.

**Plan Commit:**

- Commit 1: `test: add salla oauth flow e2e tests`
- Commit 2: `test: add salla integration service and client unit tests`

---

### Pull Request 11

**Title:** `test: add Salla integration tests`

**Summary:**
Adds automated integration and E2E test suites covering the Salla OAuth lifecycle, upsert behavior, and disconnect flows.

**Related Issue:**
Closes #21

**Changes:**

- Add `test/integrations/salla-oauth.e2e-spec.ts`.
- Add unit tests for `SallaService` and `SallaApiClient`.
- Add mock fixtures for Salla OAuth token and user profile responses.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Ran `npm run test:e2e` to confirm all integration test suites pass green.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 10 — Document Salla Integration Flow

### Issue (Documentation Template)

**Title:** `[Docs]: Document Salla OAuth integration`  
**Labels:** `type:documentation`, `priority:medium`, `area:salla`, `area:integration`

**Description:**
Create developer documentation detailing the Salla OAuth installation flow, available API endpoints, credential lifecycle, environment requirements, and disconnect architecture.

**Scope:**

- Complete OAuth sequence diagram and flow breakdown.
- API endpoints documentation (`GET /oauth`, `GET /callback`, `DELETE /integrations/salla`).
- Environment variables checklist for Salla developer apps.
- Token storage and lifecycle documentation.
- Troubleshooting guide for common OAuth errors.

**Branch Name:**
`docs/document-salla-integration`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- All implementation Issues in Sprint 03

**Notes:**
Place documentation in `docs/integrations/salla.md`.

**Plan Commit:**

- Commit 1: `docs: document salla oauth architecture and sequence`
- Commit 2: `docs: document salla api endpoints and configuration guide`

---

### Pull Request 12

**Title:** `docs: document Salla OAuth integration`

**Summary:**
Adds comprehensive developer documentation covering the Salla OAuth flow, integration lifecycle, endpoints, and troubleshooting.

**Related Issue:**
Closes #22

**Changes:**

- Add `docs/integrations/salla.md`.
- Include OAuth flow architecture diagrams and endpoint specifications.
- Document configuration and token management policies.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Reviewed markdown rendering and validated accuracy against implemented Salla routes.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.
