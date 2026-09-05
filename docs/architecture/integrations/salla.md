# Salla Integration

## Architecture Overview

The Salla integration connects the platform to merchants' Salla stores through two distinct authentication flows:

1. **Webhook-Driven OAuth** — Salla sends webhook events (`app.store.authorize`, `app.uninstalled`) when a merchant installs/uninstalls the app. Tokens are delivered directly via the webhook payload; there is no browser redirect flow.
2. **Embedded App Session** — When a merchant opens the app from the Salla Merchant Dashboard, the frontend sends Salla's short-lived embedded token to our backend, which introspects it and issues a stateless JWT.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          Webhook-Driven OAuth                             │
│                                                                            │
│  Salla Platform ──POST /integrations/salla/webhook──► Backend              │
│  { event: "app.store.authorize", merchant, data: { access_token, ... } }   │
│                                                                            │
│  Backend validates HMAC-SHA256 signature                                   │
│  → Fetches merchant profile via Salla API                                  │
│  → Creates/links merchant user                                             │
│  → Encrypts tokens (AES-256-GCM) and stores integration                    │
│  → Creates or updates Store document                                       │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                        Embedded App Session                                │
│                                                                            │
│  Salla Dashboard ──iframe──► Frontend ──POST /embedded/session──► Backend   │
│  { token: "<salla-embedded-token>" }                                       │
│                                                                            │
│  Backend introspects token via Salla Introspect API                        │
│  → Resolves merchant_id → integration → store → owner                      │
│  → Issues stateless JWT access token (no refresh token, no DB session)     │
│  → Returns { accessToken, accessTokenExpiresAt, nextStep }                 │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                          Disconnect Flow                                   │
│                                                                            │
│  Salla Platform ──POST /integrations/salla/webhook──► Backend              │
│  { event: "app.uninstalled", merchant }                                    │
│                                                                            │
│  Backend validates signature                                               │
│  → Marks integration as disconnected (removes tokens)                      │
│  → Sets store status to Inactive                                           │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### POST /api/v1/integrations/salla/webhook

Receives Salla webhook events. **No JWT required** (`@Public()`). Signature is verified via HMAC-SHA256 using the `x-salla-signature` header.

**Supported events:**

| Event | Action |
|---|---|
| `app.installed` | Logs the installation event |
| `app.store.authorize` | Creates or activates the integration (OAuth token exchange) |
| `app.uninstalled` | Disconnects the integration and deactivates the store |
| Any other | Ignored (debug log) |

**Request body:**

```json
{
  "event": "app.store.authorize",
  "merchant": 123456,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "expires": 3600,
    "scope": "orders products"
  }
}
```

**Headers:**

| Header | Required | Description |
|---|---|---|
| `x-salla-signature` | Yes | HMAC-SHA256 hex digest of the raw request body, signed with `SALLA_WEBHOOK_SECRET` |

---

### GET /api/v1/integrations/salla/status/:storeId

Returns the integration status for a given store. **Requires JWT.**

**Response:**

```json
{
  "connected": true,
  "status": "connected",
  "connectedAt": "2026-01-15T10:30:00.000Z",
  "lastSyncAt": null,
  "lastRefreshedAt": "2026-01-16T10:30:00.000Z",
  "scopes": ["orders", "products"]
}
```

---

### POST /api/v1/integrations/salla/embedded/session

Exchanges a Salla embedded token for a stateless application JWT. **No JWT required** (`@Public()`). Rate-limited to **5 requests per 60 seconds** per IP via `EmbeddedSessionThrottlerGuard`.

**Request body:**

```json
{
  "token": "<salla-embedded-token>"
}
```

**Response:**

```json
{
  "accessToken": "<jwt-access-token>",
  "accessTokenExpiresAt": "2026-01-15T10:45:00.000Z",
  "nextStep": "dashboard"
}
```

`nextStep` values:
- `"dashboard"` — Store has completed onboarding (`onboardingCompletedAt` is set).
- `"complete_onboarding"` — Store has not completed onboarding yet.

---

## Authentication Flows

### OAuth (Webhook-Driven)

```
Merchant installs app on Salla
        │
        ▼
Salla sends POST /integrations/salla/webhook
  event: "app.store.authorize"
  data: { access_token, refresh_token, expires, scope }
        │
        ▼
Backend validates x-salla-signature (HMAC-SHA256)
        │
        ▼
Fetches merchant profile via Salla API
  GET {oauthUrl}/oauth2/user/info
        │
        ▼
Creates or finds merchant user (UsersService.findOrCreateMerchantUser)
        │
        ▼
Encrypts tokens (AES-256-GCM) and stores integration
  - Status → Connected
  - Store created (platform: 'salla') if new
```

### Embedded Session

```
Merchant opens app in Salla Dashboard
        │
        ▼
Frontend receives Salla embedded token (short-lived)
        │
        ▼
Frontend sends POST /integrations/salla/embedded/session
  { token: "<salla-embedded-token>" }
        │
        ▼
Backend introspects token via Salla Introspect API
  POST {embeddedApiUrl}/exchange-authority/v1/introspect
  Headers: s-source: <SALLA_APP_ID>
  Body: { token }
        │
        ▼
Resolves: merchant_id → SallaIntegration → Store → Owner
        │
        ▼
Issues stateless JWT access token (no DB session, no refresh token)
        │
        ▼
Returns { accessToken, accessTokenExpiresAt, nextStep }
```

### Token Refresh

Salla access tokens expire. When a token is needed for API calls, `SallaTokenService` handles refresh automatically:

```
SallaTokenService.getValidAccessToken(integration)
        │
        ▼
Is token expired or expiring soon? (within tokenRefreshWindowSeconds, default 24h)
  No → Return decrypted token
  Yes → Proceed with refresh
        │
        ▼
Acquire distributed cache lock (prevents thundering herd)
        │
        ▼
Reload integration from DB (double-check another process didn't refresh)
        │
        ▼
Call SallaApiClient.refreshAccessToken(refreshToken)
  POST {oauthUrl}/oauth2/token
  Body: grant_type=refresh_token, client_id, client_secret, refresh_token
        │
        ▼
Encrypt new tokens and save to DB
  repository.updateTokens(integrationId, newTokens)
        │
        ▼
Release lock
        │
        ▼
Return decrypted access token
```

### Disconnect

```
Merchant uninstalls app on Salla
        │
        ▼
Salla sends POST /integrations/salla/webhook
  event: "app.uninstalled"
        │
        ▼
Backend validates signature
        │
        ▼
Finds integration by sallaStoreId
  → If not found: logs warning, returns (no-op)
        │
        ▼
repository.markDisconnected(integrationId)
  - Status → Disconnected
  - disconnectedAt → now
  - accessToken, refreshToken → removed
        │
        ▼
storesService.update(storeId, { status: StoreStatus.Inactive })
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|---|---|---|
| `SALLA_CLIENT_ID` | Salla app client ID | `your_client_id` |
| `SALLA_CLIENT_SECRET` | Salla app client secret | `your_client_secret` |
| `SALLA_ENCRYPTION_KEY` | 64-character hex string for AES-256-GCM token encryption | `0123456789abcdef...` (64 chars) |
| `SALLA_WEBHOOK_SECRET` | Secret for HMAC-SHA256 webhook signature verification | `your_webhook_secret` |
| `SALLA_APP_ID` | Salla application ID (used in embedded app `s-source` header) | `your_app_id` |

### Optional

| Variable | Default | Description |
|---|---|---|
| `SALLA_BASE_URL` | `https://api.salla.dev/admin/v2` | Salla Merchant API base URL |
| `SALLA_OAUTH_URL` | `https://accounts.salla.sa` | Salla OAuth/token endpoint base URL |
| `SALLA_EMBEDDED_API_URL` | `https://api.salla.dev` | Salla Embedded App API base URL |
| `SALLA_TOKEN_REFRESH_WINDOW_SECONDS` | `86400` (24h) | How long before expiry to proactively refresh tokens |

---

## Token Storage and Lifecycle

### Encryption

All Salla tokens (access and refresh) are encrypted at rest using **AES-256-GCM** before being stored in MongoDB. Each token is stored as:

```typescript
{
  encrypted: string;  // AES-256-GCM ciphertext (hex)
  iv: string;         // Initialization vector (hex, 12 bytes)
  authTag: string;    // GCM authentication tag (hex)
}
```

Access tokens also store an `expiresAt` timestamp for expiry checking.

### Lifecycle States

| Status | Meaning |
|---|---|
| `pending` | Initial state before authorization completes |
| `connected` | Active integration with valid tokens |
| `disconnected` | App uninstalled by merchant; tokens removed |
| `token_expired` | Refresh token permanently revoked by Salla; re-authorization required |
| `error` | Transient error state |

### Query Exclusion

The `accessToken` and `refreshToken` fields have `select: false` in the Mongoose schema, preventing accidental token leakage in API responses. Tokens are only decrypted on-demand via `SallaTokenService.decryptAccessToken()` / `decryptRefreshToken()`.

### Refresh Window

Tokens are proactively refreshed when they are within `SALLA_TOKEN_REFRESH_WINDOW_SECONDS` (default 24 hours) of expiry. This prevents mid-request failures due to near-expiry tokens.

### Distributed Lock

Token refresh uses a cache-based distributed lock (`CACHE_KEYS.TOKEN_LOCK`) to prevent multiple processes from simultaneously refreshing the same token. If the lock is held, the waiting process polls at 200ms intervals and reads the refreshed token from the database once the lock is released.

---

## Error Handling

### Custom Exceptions

| Exception | HTTP Status | Error Code | When |
|---|---|---|---|
| `SallaApiException` | 400 | `SALLA_API_ERROR` | Generic Salla API failure |
| `SallaApiException` | 401 | `SALLA_AUTHORIZATION_FAILED` | Invalid/expired embedded token |
| `SallaApiException` | 429 | `SALLA_RATE_LIMITED` | Salla API rate limit exceeded |
| `BusinessException` | 401 | `UNAUTHORIZED` | Webhook signature mismatch |
| `BusinessException` | 400 | `SALLA_INTEGRATION_NOT_FOUND` | No integration for merchant/store |
| `BusinessException` | 400 | `SALLA_INTEGRATION_DISCONNECTED` | Integration not connected |
| `BusinessException` | 500 | `SALLA_TOKEN_REFRESH_FAILED` | Token refresh failed (transient) |

### Error Codes Reference

| Code | Description |
|---|---|
| `SALLA_API_ERROR` | Upstream Salla API returned an error |
| `SALLA_AUTHORIZATION_FAILED` | OAuth credentials invalid, token revoked, or `invalid_grant`/`invalid_client` from Salla |
| `SALLA_RATE_LIMITED` | Salla returned HTTP 429 |
| `SALLA_INTEGRATION_NOT_FOUND` | No integration record exists for this merchant/store |
| `SALLA_INTEGRATION_DISCONNECTED` | Integration exists but status is not `Connected` |
| `SALLA_TOKEN_REFRESH_FAILED` | Refresh token invalid/revoked, or transient refresh failure |

### Logging

All errors are logged with contextual metadata (merchant ID, integration ID, operation name). Sensitive values (access tokens, refresh tokens, encryption keys) are never included in log output.

---

## Rate Limiting

| Endpoint | Guard | Limit | Window |
|---|---|---|---|
| `POST /integrations/salla/embedded/session` | `EmbeddedSessionThrottlerGuard` | 5 requests | 60 seconds |
| All other endpoints | App-wide `ThrottlerGuard` (Redis-backed) | Configured in `ThrottlerModule` | Configured in `ThrottlerModule` |

---

## Troubleshooting

### "Invalid webhook signature"

- Verify `SALLA_WEBHOOK_SECRET` matches the value configured in the Salla developer dashboard.
- Ensure the raw request body is not modified by middleware (e.g., body parsing, compression).
- Check that the `x-salla-signature` header is being forwarded unchanged.

### "Salla refresh token is invalid or revoked"

- The merchant may have revoked the app or Salla invalidated the token.
- Re-authorization is required — the integration will be marked as `token_expired`.

### "Salla API rate limited"

- The platform exceeded Salla's API rate limit.
- Retry after the `Retry-After` period.
- Consider caching API responses to reduce call volume.

### "Embedded session token is invalid or expired"

- Salla embedded tokens are short-lived (typically a few minutes).
- The frontend should obtain a fresh embedded token from the Salla Dashboard SDK before calling the endpoint.

### "No Salla integration found for this store"

- The merchant has not completed the OAuth flow, or the integration was removed.
- The merchant needs to reinstall the app from the Salla marketplace.

---

## Module Structure

```
src/modules/integrations/salla/
├── salla.module.ts                          # Module definition
├── salla-integration.controller.ts          # Webhook, status, embedded session endpoints
├── salla-integration.service.ts             # Main orchestrator (webhook dispatch, upsert, disconnect)
├── clients/
│   ├── base-http.client.ts                  # Abstract axios wrapper with error handling
│   ├── salla-http.client.ts                 # Salla Merchant API client (extends BaseHttpClient)
│   ├── salla-api.client.ts                  # OAuth token refresh + merchant profile API
│   └── salla-embedded.client.ts             # Salla Introspect API client (extends BaseHttpClient)
├── services/
│   ├── salla-token.service.ts               # Token encryption, decryption, refresh with distributed lock
│   ├── salla-embedded-auth.service.ts       # Embedded session verification and JWT issuance
│   └── salla-sync.service.ts                # Stub (not yet implemented)
├── repositories/
│   └── salla-integration.repository.ts      # Mongoose CRUD + upsert, markDisconnected, updateTokens
├── schemas/
│   └── salla-integration.schema.ts          # Mongoose schema + TypeScript interface
├── dtos/
│   ├── salla-webhook.dto.ts                 # Webhook payload + authorize/uninstall data DTOs
│   └── embedded-session.dto.ts              # Embedded session request DTO
├── interfaces/
│   ├── salla-api.interface.ts               # SallaUserInfo type
│   ├── salla-introspect.interface.ts        # SallaIntrospectData/Response types
│   └── salla-oauth.interface.ts             # SallaRefreshTokenResponse type
├── enums/
│   └── salla-integration-status.enum.ts     # IntegrationStatus enum
├── exceptions/
│   └── salla.exception.ts                   # SallaApiException class
├── guards/
│   └── embedded-session-throttler.guard.ts  # 5 req/60s rate limit for embedded session endpoint
└── index.ts                                 # Barrel exports
```
