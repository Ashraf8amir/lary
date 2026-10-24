interface SwaggerTag {
  name: string;
  description: string;
}

export const SWAGGER_DESCRIPTION = `
**Lary** is an enterprise-grade AI shopping assistant and customer insights platform for Salla stores.
It embeds a natural-language shopping assistant directly inside merchant storefronts: shoppers describe
what they are looking for, the assistant matches products from the store catalog, and surfaces them as
interactive product cards inside the conversation — while merchants control branding, policies and
persona from a dedicated dashboard.

---

## General Information

| | |
|---|---|
| **Base path** | \`/api/v1\` |
| **Versioning** | URI-based (\`/api/v1/...\`), default version \`v1\` |
| **Content type** | \`application/json\` (request and response) |
| **Interactive docs** | Served at \`/api/v1/docs\` (HTTP Basic-Auth protected in production) |
| **Request tracing** | An \`x-request-id\` header may be sent to correlate results and logs; one is generated when omitted |

## Endpoint Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | \`/chat/message\` | Public ‡ | Sends a shopper message and returns the assistant reply plus product cards |
| GET | \`/assistant-settings/public/{merchantId}\` | Public | Storefront-safe assistant widget settings for a merchant |
| GET | \`/assistant-settings/me\` | Bearer | Full assistant settings of the authenticated store |
| PATCH | \`/assistant-settings/me\` | Bearer | Partial update of the assistant settings of the authenticated store |
| GET | \`/integrations/salla/status\` | Bearer | Salla connection status of the authenticated store |
| POST | \`/integrations/salla/embedded/session\` | Public | Exchanges a Salla embedded token for a store-scoped Lary access token |

‡ Public (no bearer token required), but gated by the store's subscription: the store referenced in the
request must have an active subscription that has not exhausted its monthly message allowance.

System-facing endpoints (\`POST /integrations/salla/webhook\`, \`GET /health/liveness\`,
\`GET /health/readiness\`) are documented at the bottom of this page but intentionally hidden from the
reference UI.

---

## Authentication

The API protects merchant endpoints with short-lived, **store-scoped JWT Bearer access tokens**.
A token's \`sub\` claim identifies exactly one store, so every authenticated call acts on behalf of a
single store.

Send the token in the \`Authorization\` header of each authenticated request:

\`\`\`http
Authorization: Bearer <access_token>
\`\`\`

Access tokens are issued automatically when a store finishes onboarding, and are delivered to embedded
app integrations through \`POST /integrations/salla/embedded/session\`. Tokens carry a unique \`jti\` and
are subject to expiry validation on every request.

**401 Unauthorized — missing, malformed, or expired token:**

\`\`\`json
{
  "success": false,
  "statusCode": 401,
  "errorCode": "UNAUTHORIZED",
  "message": "Unauthorized",
  "method": "GET",
  "path": "/api/v1/assistant-settings/me",
  "requestId": "3f2b1c7e-8a4d-4e9b-9c6f-1d2e3f4a5b6c",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
\`\`\`

---

## Rate Limiting

Requests are throttled per client through Redis-backed sliding windows. Exceeding a limit returns
**429 Too Many Requests**. All limits apply simultaneously (global and per-endpoint).

**Global limits:**

| Window | Limit |
|---|---|
| 1 s | 3 requests |
| 10 s | 20 requests |
| 60 s | 100 requests |

**Per-endpoint overrides:**

| Endpoint | Window | Limit |
|---|---|---|
| \`POST /chat/message\` | 5 s | 2 requests |
| \`POST /chat/message\` | 60 s | 8 requests |
| \`POST /integrations/salla/embedded/session\` | 60 s | 5 requests |

**429 Too Many Requests:**

\`\`\`json
{
  "success": false,
  "statusCode": 429,
  "errorCode": "TOO_MANY_REQUESTS",
  "message": "ThrottlerException: Too Many Requests",
  "method": "POST",
  "path": "/api/v1/chat/message",
  "requestId": "3f2b1c7e-8a4d-4e9b-9c6f-1d2e3f4a5b6c",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
\`\`\`

---

## Response Format

Successful responses share a consistent envelope. \`data\` holds the endpoint payload, and \`metadata\`
appears only for paginated results.

\`\`\`json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": {},
  "metadata": { "pagination": {} },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
\`\`\`

Errors follow this structure. \`errors\` is an array of human-readable violation messages produced by
request validation, and \`stack\` is included only outside production.

\`\`\`json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "VALIDATION_FAILED",
  "message": "Validation failed",
  "errors": ["message must not exceed 1000 characters"],
  "method": "POST",
  "path": "/api/v1/chat/message",
  "requestId": "3f2b1c7e-8a4d-4e9b-9c6f-1d2e3f4a5b6c",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
\`\`\`

Unknown paths return \`404\` with \`errorCode: "NOT_FOUND"\` and a message such as \`Cannot GET /api/v1/... \| Cannot POST /api/v1/...\`.

---

# System Endpoints

These endpoints are production infrastructure surface — hidden from the reference UI and not intended
for merchant integration.

## \`POST /api/v1/integrations/salla/webhook\`

Ingests Salla platform events. Used as the webhook destination configured in the Salla App; drives
store provisioning, catalog synchronization, and subscription lifecycle management.

**Access:** Public, but every call must be authenticated with an **HMAC-SHA256 signature** of the raw
request body, computed with the shared webhook secret and delivered in the \`x-salla-signature\` header
as exactly 64 lower- or upper-case hex characters. Comparison is timing-safe; unsigned or mismatched
requests are rejected.

### Headers

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| \`x-salla-signature\` | header | string (64 hex chars) | Yes | HMAC-SHA256 of the raw request body using the webhook secret |

### Request Body

| Field | Type | Required | Constraints |
|---|---|---|---|
| \`event\` | string | Yes | Salla event name |
| \`merchant\` | number | Yes | Salla merchant identifier |
| \`created_at\` | string | No | Event timestamp |
| \`data\` | object | No | Event-specific data — for \`app.store.authorize\` it must include \`access_token\`, \`refresh_token\`, \`expires\` (Unix seconds); \`scope\` and \`token_type\` are optional |

### Handled Events

| Event | Effect |
|---|---|
| \`app.installed\` | Logged only; no provisioning |
| \`app.store.authorize\` | Creates/links the merchant user and store, encrypts and stores OAuth tokens, activates the integration, and triggers a full catalog sync |
| \`app.uninstalled\` | Marks the integration disconnected and deactivates the store |
| \`product.created\`, \`product.updated\`, \`product.price.updated\`, \`product.status.updated\`, \`product.image.updated\`, \`product.category.updated\`, \`product.brand.updated\`, \`product.option.updated\` | Triggers an incremental sync of the affected product |
| \`product.deleted\` | Removes the product from the store catalog |
| \`app.trial.started\`, \`app.subscription.started\`, \`app.subscription.renewed\` | Updates the store's subscription status (trialing / active) |
| \`app.trial.expired\`, \`app.subscription.expired\`, \`app.trial.canceled\`, \`app.subscription.canceled\` | Ends the store's subscription access |
| Other events | Ignored |

### \`200 OK\` — Webhook processed

\`\`\`json
{
  "success": true,
  "statusCode": 200,
  "message": "Salla webhook processed",
  "data": { "success": true },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
\`\`\`

### Errors

| Status | \`errorCode\` | Trigger |
|---|---|---|
| 400 | \`VALIDATION_FAILED\` | Malformed \`app.store.authorize\` payload |
| 401 | \`UNAUTHORIZED\` | Missing \`x-salla-signature\` header or signature mismatch |

## \`GET /health/liveness\`

Process-level health probe. No dependencies are checked. Note: served without the \`/api/v1\` prefix
and without versioning.

**Access:** Public.

### \`200 OK\` — Healthy (Terminus payload inside \`data\`)

\`\`\`json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {
    "status": "ok",
    "info": {},
    "error": {},
    "details": {}
  },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
\`\`\`

## \`GET /health/readiness\`

Full readiness probe validating: MongoDB connectivity, RabbitMQ, Redis, disk usage (fails above 85 %
of the storage path), and JVM-style memory ceilings (heap 300 MB, RSS 500 MB). Note: served without
the \`/api/v1\` prefix and without versioning.

**Access:** Public.

### \`200 OK\` — All dependencies healthy

\`\`\`json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {
    "status": "ok",
    "info": {
      "mongodb": { "status": "up" },
      "rabbitmq": { "status": "up" },
      "redis": { "status": "up" }
    },
    "error": {},
    "details": {
      "mongodb": { "status": "up" },
      "rabbitmq": { "status": "up" },
      "redis": { "status": "up" },
      "disk_storage": { "status": "up" },
      "memory_heap": { "status": "up" },
      "memory_rss": { "status": "up" }
    }
  },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
\`\`\`

### \`503 Service Unavailable\` — One or more indicators failed

\`\`\`json
{
  "success": false,
  "statusCode": 503,
  "errorCode": "SERVICE_UNAVAILABLE",
  "message": "Request failed",
  "method": "GET",
  "path": "/health/readiness",
  "requestId": "3f2b1c7e-8a4d-4e9b-9c6f-1d2e3f4a5b6c",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
\`\`\`

---

# Error Code Reference

| \`errorCode\` | HTTP | Meaning |
|---|---|---|
| \`VALIDATION_FAILED\` | 400 | Request validation failed; details in \`errors\` |
| \`UNAUTHORIZED\` | 401 | Authentication missing, invalid, or expired |
| \`SALLA_AUTHORIZATION_FAILED\` | 401 | Salla rejected an embedded token |
| \`FORBIDDEN\` | 403 | Verified request not permitted (subscription, limits, disabled assistant) |
| \`NOT_FOUND\` | 404 | Unknown merchant, store, or route |
| \`REQUEST_TIMEOUT\` | 408 | Request exceeded the 120 s limit |
| \`TOO_MANY_REQUESTS\` | 429 | Rate limit exceeded |
| \`SALLA_INTEGRATION_NOT_FOUND\` | 400 | Store is not connected — app reinstall required |
| \`SALLA_API_ERROR\` | 502 | Upstream Salla request failed |
| \`SERVICE_UNAVAILABLE\` | 503 | Readiness probe failed |
| \`INTERNAL_SERVER_ERROR\` | 500 | Unexpected server error |
`;

export const API_TAGS: SwaggerTag[] = [
  {
    name: 'Assistant Settings',
    description:
      'Per-store assistant configuration: storefront-safe public settings, plus JWT-protected dashboard retrieval and partial updates of branding, widget behaviour, support contacts, policies, FAQs and persona.',
  },
  {
    name: 'Salla Integration',
    description:
      'Salla platform connectivity: signed webhook-driven OAuth provisioning and catalog/subscription sync (system endpoint, hidden from the UI), connection status for the authenticated store, and embedded-app session creation that issues store-scoped access tokens.',
  },
  {
    name: 'Chat',
    description:
      'Conversational shopping assistant for storefronts. Public but subscription-gated; rate limited; returns the assistant reply with matched interactive product cards.',
  },
];
