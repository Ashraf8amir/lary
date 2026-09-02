# Authentication & User Flows

This document covers the authentication architecture, token lifecycle, session management, API endpoint specifications, environment configuration, and security controls for the Lary platform.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Token Lifecycle](#token-lifecycle)
3. [API Endpoints](#api-endpoints)
4. [Request & Response Schemas](#request--response-schemas)
5. [Data Models](#data-models)
6. [Security Controls](#security-controls)
7. [Environment Variables](#environment-variables)
8. [Error Responses](#error-responses)
9. [Security Best Practices](#security-best-practices)

---

## Architecture Overview

The authentication system uses JWT-based stateless access tokens with opaque, hashed refresh tokens stored server-side. The architecture separates concerns across dedicated modules:

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Dashboard)                  │
│                                                         │
│  Login ──► Receives accessToken + refreshToken (cookie) │
│  API ──► Authorization: Bearer <accessToken>            │
│  Refresh ──► Cookie: refreshToken=<token>               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     NestJS Backend                       │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │ AuthGuard     │──►│ AuthController│──►│ AuthService │ │
│  │ (global)      │   │              │   │             │ │
│  └──────────────┘   └──────────────┘   └──────┬──────┘ │
│                                                │        │
│                    ┌───────────────────────────┘        │
│                    ▼                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Auth Repository                     │   │
│  │  ┌────────────┐ ┌─────────────┐ ┌────────────┐  │   │
│  │  │Credentials │ │  Sessions   │ │   Tokens   │  │   │
│  │  │  Service   │ │  Service    │ │  Service   │  │   │
│  │  └────────────┘ └─────────────┘ └────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                    │                                     │
│                    ▼                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │                MongoDB                           │   │
│  │  ┌──────────────┐     ┌──────────────┐          │   │
│  │  │ users        │     │auth_credentials│         │   │
│  │  └──────────────┘     └──────────────┘          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `AuthModule` | Authentication orchestration, token issuance, session lifecycle |
| `UsersModule` | User profile management, email uniqueness, user status |
| `TokenService` | JWT signing/verification, refresh token generation, hashing |
| `SessionService` | Session CRUD, device tracking, active session queries |
| `CredentialsService` | Password hash storage, provider management |
| `AuthRepository` | Database operations for auth_credentials collection |

---

## Token Lifecycle

### Login Flow

```
Client                          Server
  │                               │
  │  POST /auth/login             │
  │  { email, password }          │
  │  Headers:                     │
  │    user-agent: ...            │
  │    x-device-id: ... (opt)     │
  │    x-device-name: ... (opt)   │
  │──────────────────────────────►│
  │                               │── 1. Find user by email
  │                               │── 2. Find auth doc by userId
  │                               │── 3. bcrypt.compare(password, hash)
  │                               │── 4. Delete existing session for deviceId (if any)
  │                               │── 5. Generate sessionId (UUID v4)
  │                               │── 6. Generate refresh token (64 bytes random)
  │                               │── 7. Hash refresh token (SHA-256)
  │                               │── 8. Store session in auth_credentials.sessions
  │                               │── 9. Sign access token (JWT)
  │                               │
  │  200 OK                       │
  │  Set-Cookie: refreshToken=... │
  │  { accessToken,               │
  │    accessTokenExpiresAt }     │
  │◄──────────────────────────────│
```

### Token Refresh Flow (Rotation)

```
Client                          Server
  │                               │
  │  POST /auth/refresh           │
  │  Cookie: refreshToken=...     │
  │──────────────────────────────►│
  │                               │── 1. Extract refresh token from cookie
  │                               │── 2. Hash token (SHA-256)
  │                               │── 3. Find auth doc by token hash
  │                               │── 4. Find matching session
  │                               │── 5. Check expiry
  │                               │
  │                               │   If expired:
  │                               │     ├── Delete entire token family
  │                               │     └── Return 401
  │                               │
  │                               │── 6. Generate new refresh token
  │                               │── 7. Update session token hash in DB
  │                               │── 8. Sign new access token
  │                               │
  │  200 OK                       │
  │  Set-Cookie: refreshToken=... │
  │  { accessToken,               │
  │    accessTokenExpiresAt }     │
  │◄──────────────────────────────│
```

### Token Family & Reuse Detection

Each refresh token belongs to a **token family** (UUID). When a refresh token is rotated, the new token inherits the same `familyId`. If a token is used **after it has expired**, the entire family is revoked — indicating potential token theft.

```
Family ID: abc-123

Token v1 (abc-123) ──► Used ──► Token v2 (abc-123)
                                  │
                                  ├──► Used ──► Token v3 (abc-123)
                                  │
                                  └──► Expired token reused ──► REVOKE ALL abc-123
```

### Logout Flow

```
Client                          Server
  │                               │
  │  POST /auth/logout            │
  │  Authorization: Bearer <jwt>  │
  │──────────────────────────────►│
  │                               │── 1. Extract userId + sessionId from JWT
  │                               │── 2. Delete session by sessionId
  │                               │── 3. Clear refresh token cookie
  │                               │
  │  204 No Content               │
  │  Set-Cookie: refreshToken=;   │
  │◄──────────────────────────────│
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### POST /auth/login

Authenticates a user with email and password. Creates a new session and issues token pair.

**Guard:** None (public endpoint)

**Request:**

| Source | Field | Type | Required | Description |
|--------|-------|------|----------|-------------|
| Body | `email` | string | Yes | User email address |
| Body | `password` | string | Yes | User password |
| Header | `user-agent` | string | No | Client user agent (parsed for device info) |
| Header | `x-device-id` | string | No | Unique device identifier (fallback: hash of UA) |
| Header | `x-device-name` | string | No | Human-readable device name |
| Header | `x-is-primary` | string | No | `"true"` to mark as primary device |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "accessTokenExpiresAt": "2026-09-02T23:30:00.000Z"
  },
  "timestamp": "2026-09-02T23:15:00.000Z"
}
```

**Set-Cookie header:**

```
refreshToken=<raw-token>; HttpOnly; Secure; SameSite=None; Path=/api/v1/auth; Expires=<date>
```

**Errors:**

| Status | Message | Condition |
|--------|---------|-----------|
| 401 | `Invalid credentials` | Email not found, no password set, or wrong password |

---

### POST /auth/refresh

Rotates the refresh token and issues a new access token.

**Guard:** `RefreshTokenGuard` (extracts refresh token from cookie)

**Request:**

| Source | Field | Type | Required | Description |
|--------|-------|------|----------|-------------|
| Cookie | `refreshToken` | string | Yes | Current refresh token |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token refresh successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "accessTokenExpiresAt": "2026-09-02T23:30:00.000Z"
  },
  "timestamp": "2026-09-02T23:15:00.000Z"
}
```

**Set-Cookie header:** New `refreshToken` cookie issued.

**Errors:**

| Status | Message | Condition |
|--------|---------|-----------|
| 401 | `Refresh token is missing` | No cookie provided |
| 401 | `Invalid or revoked refresh token` | Token hash not found in DB |
| 401 | `Refresh token has expired...` | Token expired — family revoked |

---

### POST /auth/logout

Invalidates the current session and clears the refresh cookie.

**Guard:** `JwtAccessGuard` (global)

**Request:**

| Source | Field | Type | Required | Description |
|--------|-------|------|----------|-------------|
| Header | `Authorization` | string | Yes | `Bearer <accessToken>` |

**Response:** `204 No Content`

**Set-Cookie header:** Clears the `refreshToken` cookie.

---

### POST /auth/logout-all

Invalidates all active sessions for the user.

**Guard:** `JwtAccessGuard` (global)

**Request:**

| Source | Field | Type | Required | Description |
|--------|-------|------|----------|-------------|
| Header | `Authorization` | string | Yes | `Bearer <accessToken>` |

**Response:** `204 No Content`

---

### GET /auth/sessions

Returns all active (non-expired) sessions for the authenticated user.

**Guard:** `JwtAccessGuard` (global)

**Request:**

| Source | Field | Type | Required | Description |
|--------|-------|------|----------|-------------|
| Header | `Authorization` | string | Yes | `Bearer <accessToken>` |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Active sessions retrieved successfully",
  "data": [
    {
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "deviceName": "MacBook Pro",
      "browser": "Chrome",
      "os": "macOS",
      "deviceType": "desktop",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-09-02T23:15:00.000Z",
      "expiresAt": "2026-09-09T23:15:00.000Z",
      "isCurrent": true
    }
  ],
  "timestamp": "2026-09-02T23:15:00.000Z"
}
```

---

### GET /auth/me

Returns the profile of the currently authenticated user.

**Guard:** `JwtAccessGuard` (global)

**Request:**

| Source | Field | Type | Required | Description |
|--------|-------|------|----------|-------------|
| Header | `Authorization` | string | Yes | `Bearer <accessToken>` |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User retrieved",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "merchant@example.com",
    "fullName": "John Doe",
    "status": "active",
    "createdAt": "2026-09-01T10:00:00.000Z"
  },
  "timestamp": "2026-09-02T23:15:00.000Z"
}
```

**Errors:**

| Status | Message | Condition |
|--------|---------|-----------|
| 401 | `User not found` | User ID from JWT does not match any user |
| 401 | `Invalid or expired access token` | JWT verification failed |

---

## Request & Response Schemas

### LoginDto

```typescript
{
  email: string;    // @IsEmail()
  password: string; // @IsString(), @IsNotEmpty()
}
```

### AuthResponseDto

```typescript
{
  accessToken?: string;            // JWT access token
  accessTokenExpiresAt?: Date;     // Access token expiry
  refreshTokenExpiresAt?: Date;    // Refresh token expiry (set via cookie)
  requiresTwoFactor?: boolean;     // Reserved for future 2FA
  mfaToken?: string;               // Reserved for future 2FA
}
```

### UserProfileDto

```typescript
{
  id: string;        // MongoDB ObjectId as string
  email: string;     // User email
  fullName: string;  // User full name
  status: string;    // User status (active, pending, suspended)
  createdAt: Date;   // Account creation date
}
```

### GenerateTokensResult (Internal)

```typescript
{
  accessToken: string;
  accessTokenExpiresAt: Date;
  rawRefreshToken?: string;       // Only used to set cookie
  refreshTokenExpiresAt?: Date;
  requiresTwoFactor?: false;
}
```

### SessionContext (Internal)

```typescript
{
  deviceId: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string | null;
  browser?: string;
  os?: string;
  deviceType?: string;
  isPrimary?: boolean;
}
```

---

## Data Models

### User Schema (`users` collection)

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| `_id` | ObjectId | auto | Document identifier |
| `email` | string | required, unique, lowercase, trimmed, maxLength: 254 | User email |
| `fullName` | string | optional, trimmed, maxLength: 100, default: `""` | Display name |
| `status` | enum | `active`, `pending`, `suspended`; default: `active` | Account status |
| `createdAt` | Date | auto (timestamps) | Creation timestamp |
| `updatedAt` | Date | auto (timestamps) | Last update timestamp |

**Indexes:** `{ email: 1 }` (unique)

---

### Auth Schema (`auth_credentials` collection)

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| `_id` | ObjectId | auto | Document identifier |
| `userId` | ObjectId | required, unique, indexed, ref: `User` | Linked user |
| `credentials` | Credentials | subdocument, default: `{}` | Authentication credentials |
| `credentials.provider` | enum | `salla`, `google`; default: `salla` | Auth provider |
| `credentials.providerId` | string \| null | indexed, default: `null` | External provider ID |
| `credentials.passwordHash` | string \| null | **select: false**, default: `null` | Bcrypt password hash |
| `sessions` | ActiveSession[] | array, default: `[]` | Active refresh token sessions |
| `createdAt` | Date | auto (timestamps) | Creation timestamp |
| `updatedAt` | Date | auto (timestamps) | Last update timestamp |

---

### ActiveSession (Embedded Subdocument)

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| `sessionId` | string | required, indexed | UUID v4 session identifier |
| `refreshTokenHash` | string | required, **select: false** | SHA-256 hash of refresh token |
| `familyId` | string | required, indexed | Token rotation family identifier |
| `deviceId` | string | required | Device fingerprint or client-provided ID |
| `deviceName` | string | optional, trimmed | Human-readable device name |
| `ipAddress` | string | optional, trimmed | Client IP address |
| `userAgent` | string \| null | default: `null` | Raw user agent string |
| `browser` | string | default: `"Unknown"` | Parsed browser name |
| `os` | string | default: `"Unknown"` | Parsed operating system |
| `deviceType` | string | default: `"Unknown"` | Device type (desktop, mobile, etc.) |
| `isPrimary` | boolean | default: `false` | Whether this is the primary device |
| `expiresAt` | Date | required | Refresh token expiration timestamp |
| `createdAt` | Date | default: `Date.now` | Session creation timestamp |

---

## Security Controls

### Password Hashing

- **Algorithm:** Bcrypt
- **Storage:** Stored in `credentials.passwordHash` with `select: false` (excluded from default queries)
- **Retrieval:** Requires explicit `.select('+credentials.passwordHash')` in queries
- **Comparison:** Uses `bcrypt.compare()` for constant-time comparison

### Refresh Token Security

- **Generation:** 64 random bytes encoded as base64url
- **Storage:** Only the SHA-256 hash is stored in the database
- **Transmission:** Sent exclusively as an HTTP-only cookie (never in response body)
- **Comparison:** Timing-safe comparison via `crypto.timingSafeEqual`
- **Rotation:** New token issued on every refresh; old token is immediately invalidated
- **Reuse Detection:** If an expired token is reused, the entire token family is revoked
- **Maximum Sessions:** 5 concurrent sessions per user (enforced atomically in MongoDB)

### Access Token Security

- **Algorithm:** HMAC-SHA256 (HS256)
- **Payload:** `{ sub: userId, sessionId, jti: UUID }`
- **Transmission:** `Authorization: Bearer <token>` header
- **Extraction:** `ExtractJwt.fromAuthHeaderAsBearerToken()`
- **Expiration:** Enforced; expired tokens rejected with 401

### Session Management

- **One session per device:** Login replaces any existing session with the same `deviceId`
- **Session limits:** Maximum 5 concurrent sessions; enforced via MongoDB `$expr`
- **Expired session cleanup:** `removeExpiredSessions()` pulls sessions where `expiresAt <= now`
- **Logout-all:** Clears all sessions and increments `security.tokenVersion`

### Cookie Security

| Property | Development | Production |
|----------|------------|------------|
| `httpOnly` | `true` | `true` |
| `secure` | `false` | `true` |
| `sameSite` | `lax` | `none` |
| `path` | `/api/v1/auth` | `/api/v1/auth` |
| `domain` | From `COOKIE_DOMAIN` env | From `COOKIE_DOMAIN` env |

---

## Environment Variables

### JWT Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `JWT_ACCESS_SECRET` | Yes | — | Secret key for signing access tokens | `your_access_token_secret` |
| `JWT_ACCESS_EXPIRATION` | Yes | — | Access token lifetime | `15m` |
| `JWT_REFRESH_SECRET` | Yes | — | Secret key for hashing refresh tokens | `your_refresh_token_secret` |
| `JWT_REFRESH_EXPIRATION` | Yes | — | Refresh token lifetime | `7d` |

**Expiration format:** Supports `s` (seconds), `m` (minutes), `h` (hours), `d` (days). Examples: `30s`, `15m`, `2h`, `7d`.

### Application Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `NODE_ENV` | Yes | — | Environment mode | `development`, `production`, `test` |
| `PORT` | Yes | `3000` | Server port | `3000` |
| `APP_NAME` | Yes | — | Application name | `Lary` |
| `COOKIE_DOMAIN` | No | — | Cookie domain for cross-origin | `.example.com` |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URI` | Yes | — | MongoDB connection string |
| `DATABASE_RETRY_ATTEMPTS` | No | `5` | Connection retry attempts |
| `DATABASE_RETRY_DELAY` | No | `1000` | Delay between retries (ms) |
| `DATABASE_MAX_POOL_SIZE` | No | `10` | Maximum connection pool size |
| `DATABASE_MIN_POOL_SIZE` | No | `5` | Minimum connection pool size |
| `DATABASE_SERVER_SELECTION_TIMEOUT_MS` | No | `5000` | Server selection timeout (ms) |

---

## Error Responses

All errors follow the standard API envelope format:

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "UnauthorizedException",
  "timestamp": "2026-09-02T23:15:00.000Z"
}
```

### Authentication Error Codes

| HTTP Status | Error Code | Message | Trigger |
|-------------|-----------|---------|---------|
| 401 | `UNAUTHORIZED` | `Invalid credentials` | Wrong email or password |
| 401 | `UNAUTHORIZED` | `Invalid or expired access token` | JWT verification failed |
| 401 | `UNAUTHORIZED` | `Refresh token is missing` | No refresh cookie |
| 401 | `UNAUTHORIZED` | `Invalid or revoked refresh token` | Token hash not found |
| 401 | `UNAUTHORIZED` | `Refresh token has expired...` | Expired refresh token reuse |
| 401 | `UNAUTHORIZED` | `User not found` | User ID from JWT not in DB |
| 401 | `UNAUTHORIZED` | `Failed to rotate session` | Session update failed |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded | Throttler triggered |

### Error Handling Notes

- Invalid credentials always return `Invalid credentials` — no distinction between wrong email and wrong password to prevent user enumeration.
- Refresh token reuse detection returns a security alert message but does not leak details about the compromised session.
- Expired refresh tokens trigger automatic family revocation before returning the error.
- Rate limiting is applied via `ThrottlerGuard`: short (3 req/s), medium (20 req/10s), long (100 req/60s).

---

## Security Best Practices

1. **Never expose password hashes** — The `passwordHash` field uses `select: false` and requires explicit selection.
2. **Timing-safe comparisons** — Refresh token comparison uses `crypto.timingSafeEqual` to prevent timing attacks.
3. **HTTP-only cookies** — Refresh tokens are never exposed to JavaScript via `httpOnly: true`.
4. **Token rotation** — Refresh tokens are single-use; each refresh issues a new token and invalidates the previous one.
5. **Family-based revocation** — Stolen token reuse revokes the entire token chain, not just the single token.
6. **Session limits** — Maximum 5 concurrent sessions prevent session proliferation.
7. **Device fingerprinting** — Sessions track device, browser, OS, and IP for anomaly detection.
8. **Secure cookie attributes** — `secure: true` in production, `sameSite: 'none'` for cross-origin, scoped to `/api/v1/auth`.
9. **Generic error messages** — Authentication errors never reveal whether an email exists or a password is wrong.
10. **No sensitive data in JWT payload** — Access tokens contain only `sub`, `sessionId`, and `jti`.

---

## Planned Features

The following authentication features are defined in the sprint scope but not yet implemented:

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Password Setup | `POST /auth/password/setup` | Initial password for OAuth merchants |
| Password Change | `PATCH /auth/password` | Authenticated password update |
| Forgot Password | `POST /auth/password/forgot` | Password reset request |
| Password Reset | `POST /auth/password/reset` | Complete password reset with token |
| Account Lockout | — | Failed attempt tracking and temporary lockout |

---

## File Structure

```
src/modules/auth/
├── auth.controller.ts          # Route handlers
├── auth.module.ts              # Module configuration
├── auth.service.ts             # Business logic
├── decorators/
│   ├── current-user.decorator.ts  # @CurrentUser() decorator
│   └── public.decorator.ts        # @Public() decorator
├── dtos/
│   ├── auth-response.dto.ts       # AuthResponseDto
│   ├── login.dto.ts               # LoginDto
│   └── user-profile.dto.ts        # UserProfileDto
├── enums/
│   └── auth-provider.enum.ts      # AuthProvider enum
├── guards/
│   ├── jwt-auth.guard.ts          # JwtAccessGuard (global)
│   └── refresh.token.guard.ts     # RefreshTokenGuard
├── interfaces/
│   ├── auth-result.interface.ts   # GenerateTokensResult
│   ├── jwt-payload.interface.ts   # AccessTokenPayload
│   └── session-context.interface.ts # SessionContext
├── repositories/
│   └── auth.repository.ts         # AuthRepository (DB operations)
├── schemas/
│   ├── auth.schema.ts             # Auth model
│   ├── credentials.schema.ts      # Credentials subdocument
│   └── session.schema.ts          # ActiveSession subdocument
├── services/
│   ├── credentials.service.ts     # Password/provider management
│   ├── session.service.ts         # Session lifecycle
│   └── token.service.ts           # JWT & refresh token operations
└── strategies/
    ├── jwt-access.strategy.ts     # Passport JWT access strategy
    └── jwt-refresh.strategy.ts    # Passport custom refresh strategy
```
