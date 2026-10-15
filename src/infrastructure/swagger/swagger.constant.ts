interface SwaggerTag {
  name: string;
  description: string;
}

export const SWAGGER_DESCRIPTION = `
**Lary** is an enterprise-grade AI shopping assistant and customer insights platform for Salla stores.
It powers natural-language product discovery inside merchant storefronts: shoppers describe what they
are looking for, the assistant matches products from the store catalog and surfaces them as interactive
product cards in the conversation, while merchants gain insight into customer demand.

---

## Overview

| | |
|---|---|
| **Base path** | \`/api/v1\` |
| **Versioning** | URI-based (\`/api/v1/...\`), default version \`v1\` |
| **Format** | JSON (\`application/json\`) |
| **Interactive docs** | Served at \`/api/v1/docs\` (HTTP Basic Auth protected in production) |

### Modules

- **Chat** — Send messages to the AI assistant and receive responses enriched with product cards.
- **Assistant Settings** — Retrieve and update per-store assistant behavior and storefront-facing settings.
- **Salla Integration** — OAuth connectivity, webhook ingestion, status checks, and embedded-app session creation for Salla merchants.

---

## Authentication

The API uses a dual-token JWT scheme:

1. **Access token** — Send a short-lived JWT in the \`Authorization\` header of every authenticated request:

   \`\`\`http
   Authorization: Bearer <access_token>
   \`\`\`

2. **Refresh token** — Delivered exclusively as an \`HttpOnly\` \`refreshToken\` cookie on login. Exchange it
   at \`POST /api/v1/auth/refresh\` to obtain a new access token. Refresh tokens are rotated on every use
   and organized into families: reusing a revoked token invalidates the entire family as theft protection.

> **Note:** Endpoints marked as public do not require an access token. Rate limits apply regardless of authentication status.

---

## Rate Limiting

Requests are throttled per client. Exceeding a limit returns **429 Too Many Requests**.

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

---

## Response Format

Successful responses follow a consistent envelope:

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

Errors follow this structure:

\`\`\`json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "VALIDATION_FAILED",
  "message": "Validation failed",
  "errors": [{ "field": "message", "messages": ["message should not be empty"] }],
  "method": "POST",
  "path": "/api/v1/chat/message",
  "requestId": "3f2b1c7e-8a4d-4e9b-9c6f-1d2e3f4a5b6c",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
\`\`\`

`;

export const API_TAGS: SwaggerTag[] = [
  {
    name: 'Assistant Settings',
    description:
      'Assistant settings endpoints including retrieval and update of assistant settings for specific stores and merchants.',
  },
  {
    name: 'Salla Integration',
    description:
      'Endpoints related to Salla integration, including webhook handling, status retrieval, and embedded session creation.',
  },
  {
    name: 'Chat',
    description:
      'Endpoints for chat functionality, including sending messages and receiving responses with product card information.',
  },
];
