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

## Issue 07 — Handle Salla Integration Errors

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

## Issue 08 — Implement Salla Embedded App Session Flow

### Issue (Feature Template)

**Title:** `[Feature]: Implement Salla Embedded App session flow`
**Labels:** `type:feature`, `priority:high`, `area:salla`, `area:auth`, `area:integration`

**Description:**
Implement backend support for Salla's Embedded App SDK "Trust-but-Verify" flow. When a merchant opens the app from inside the Salla Merchant Dashboard, the frontend (running in an iframe) forwards Salla's short-lived embedded token to our backend, which verifies it via Salla's Introspection API, resolves the internal store/owner, and issues a stateless application access token. Also introduces a shared HTTP client base for Salla-facing clients and a dedicated rate limit for this new public endpoint.

**Acceptance Criteria:**

- [ ] `BaseHttpClient` abstract class created with shared axios setup/logging; `SallaHttpClient` refactored to extend it with no behavior change.
- [ ] `SallaEmbeddedClient` created to call Salla's Introspect API (`POST /exchange-authority/v1/introspect`) authenticated via the `s-source` header.
- [ ] `SallaEmbeddedAuthService.createSession()` verifies the embedded token, rejects unknown/unlinked Salla merchants, and resolves the store via the existing `SallaIntegrationRepository`.
- [ ] `AuthService.issueStatelessAccessToken()` added: issues a plain JWT access token (random `sessionId`, default expiration) without creating a persisted session or refresh token, reusing the existing `TokenService`/`jwt-access` strategy unchanged.
- [ ] `POST /integrations/salla/embedded/session` endpoint added (`@Public()`), returning `{ accessToken, accessTokenExpiresAt, nextStep }`.
- [ ] `nextStep` is computed from `Store.onboardingCompletedAt` (`complete_onboarding` | `dashboard`); field added to `Store` schema, set only by a future onboarding-completion flow (out of scope here — deferred to the widget-settings module).
- [ ] Single-owner limitation documented in code: any user opening the app from the Salla dashboard is treated as `store.ownerId` internally; no per-staff distinction.
- [ ] Endpoint-scoped `EmbeddedSessionThrottlerGuard` (stricter limit, e.g. 5 req/min) applied on top of the existing app-wide Redis-backed throttlers, since this is the module's only fully unauthenticated route.
- [ ] `salla.appId` and `salla.embeddedApiUrl` added to config; `SALLA_APP_ID` / `SALLA_EMBEDDED_API_URL` documented as required env vars.
- [ ] Fixed pre-existing config key mismatch: `salla.tokenRefreshWindow` renamed to `salla.tokenRefreshWindowSeconds` to match what `SallaTokenService.isTokenExpiringSoon()` actually reads (was silently ignoring `SALLA_TOKEN_REFRESH_WINDOW` and always falling back to the hardcoded default).
- [ ] No refresh token is issued or stored for embedded sessions; renewal relies on the frontend re-verifying a fresh Salla embedded token (via `embedded.auth.refresh()`) against the same endpoint.

**Branch Name:**
`feature/salla-embedded-app-session`

**Milestone:**
`Sprint 03 — Salla Integration & OAuth`

**Dependencies:**

- Issue 05 — Implement Salla OAuth Callback
- Issue 06 — Handle Salla Webhooks (`app.store.authorize`, `app.uninstalled`)
- Issue 07 — Create Salla API Client

**Notes:**
This flow is separate from the server-to-server OAuth token stored per integration (`SallaIntegration.accessToken`), which continues to be used exclusively for Merchant API calls via `SallaTokenService.getValidAccessToken()`. The embedded session token is only used to establish identity for our own API, never to call Salla's Merchant API.

**Plan Commit:**

- Commit 1: `refactor(salla): extract BaseHttpClient and add SallaEmbeddedClient #61`
- Commit 2: `feat(salla): add embedded session DTO/interfaces and onboarding flag #61`
- Commit 3: `feat(auth,salla): add stateless access token issuance + embedded auth service #61`
- Commit 4: `feat(salla): add embedded session endpoint with dedicated rate limit #61`
- Commit 5: `fix(config): add embedded app config + fix silent tokenRefreshWindow typo #61`

---

### Pull Request 08

**Title:** `feat: implement Salla Embedded App session flow`

**Summary:**
Adds backend support for Salla's Embedded App authentication flow, letting merchants open the app from the Salla dashboard and receive a verified, stateless application session without relying on cookies inside a third-party iframe context.

**Related Issue:**
Closes #21

**Changes:**

- Add `src/modules/salla/clients/base-http.client.ts` and refactor `salla-http.client.ts` to extend it.
- Add `src/modules/salla/clients/salla-embedded.client.ts` (Introspect API client).
- Add `src/modules/salla/services/salla-embedded-auth.service.ts`.
- Add `src/modules/auth/auth.service.ts#issueStatelessAccessToken`.
- Add `POST /integrations/salla/embedded/session` endpoint + `EmbeddedSessionThrottlerGuard`.
- Add `Store.onboardingCompletedAt` field (schema/repository/service).
- Update `salla.config.ts`: add `appId`, `embeddedApiUrl`; fix `tokenRefreshWindowSeconds` key mismatch.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Simulated valid/expired/invalid Salla embedded tokens against the Introspect API and verified: correct `nextStep` resolution for stores with/without `onboardingCompletedAt`, rejection of embedded tokens for merchants with no linked integration, and the dedicated throttle guard rejecting excess requests independently of the app-wide throttlers.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

## Issue 09 — Document Salla Integration Flow

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
