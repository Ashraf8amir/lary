# Sprint 02 — Authentication & Users

## Sprint Goal

Build the authentication and user foundation required for merchants to securely access the platform dashboard.

By the end of this Sprint, a merchant should be able to:

1. Create a platform account.
2. Associate the account with their connected Salla store.
3. Set and manage their password.
4. Log in to the dashboard.
5. Receive authenticated access through JWT.
6. Refresh an expired access token.
7. Log out and invalidate the active authentication session.
8. Retrieve the currently authenticated user.
9. Change their password.
10. Request a password reset.
11. Reset their password securely.

---

# Milestone

`Sprint 02 — Authentication & Users`

---

# Sprint Scope

## Included

### Users

- User schema
- User creation
- User profile
- Merchant/store relationship
- Current user
- User status

### Authentication

- Password-based authentication
- Password hashing
- Login
- JWT access token
- Refresh token
- Token rotation
- Logout
- Session management
- Password change
- Password reset

### Security

- Login failure handling
- Account lockout
- Refresh token protection
- Token revocation
- Password security
- Authentication guards
- Authentication error handling

### Documentation & Testing

- Authentication tests
- User tests
- Authentication documentation

---

# Authentication Architecture

The authentication architecture is based on:

User
↓
Email + Password
↓
Login
↓
Access Token + Refresh Token
↓
Dashboard
↓
Authenticated API Requests

When the access token expires:

Dashboard
↓
Refresh Token
↓
Backend
↓
New Access Token
↓
Continue Session

---

# Issue List

## Issue 01 — Create User Module

### Issue (Feature Template)

**Title:** `[Feature]: Create user module`  
**Labels:** `type:feature`, `priority:high`, `area:users`

**Description:**
Create the Users module responsible for managing platform user accounts. The module provides a clear boundary for user-related business logic, DTOs, interfaces, and persistence, allowing it to be consumed cleanly by Authentication without circular dependencies or leaked auth responsibilities.

**Acceptance Criteria:**

- [ ] User module exists.
- [ ] User service exists.
- [ ] User persistence has a dedicated location.
- [ ] User-related DTOs have a dedicated location.
- [ ] User-related business logic is isolated.
- [ ] Module can be consumed by Authentication.
- [ ] Module does not contain authentication or token logic.

**Branch Name:**
`feature/create-user-module`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- `Sprint 03 — Salla Integration & OAuth`

**Notes:**
Keep core user profile management cleanly separated from credential and token concerns.

**Plan Commit:**

- Commit 1: `feat: scaffold user module structure`
- Commit 2: `feat: register user module in root application module`

---

### Pull Request 01

**Title:** `feat: create user module`

**Summary:**
Creates the Users module and establishes the baseline structure for user account management.

**Related Issue:**
Closes #23

**Changes:**

- Create `UserModule`, `UserService`, and controller scaffolding.
- Define initial user management DTOs and interfaces.
- Register `UserModule` in `AppModule`.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Ran build to ensure module dependency injection tree is clean and compiles without errors.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 02 — Create User Schema

### Issue (Feature Template)

**Title:** `[Feature]: Add user schema`  
**Labels:** `type:feature`, `priority:critical`, `area:users`

**Description:**
Create the Mongoose database model representing a platform user account. The schema represents the merchant owner, references connected Salla stores, manages account status (`active`, `pending`, `suspended`), normalizes email fields, and prevents duplicate records while keeping password hashes out of the user entity.

**Acceptance Criteria:**

- [ ] User schema is created.
- [ ] Email is normalized (lowercase, trimmed) and indexed uniquely.
- [ ] User status enum is defined.
- [ ] Salla store relationship/reference is represented.
- [ ] Timestamps are enabled.
- [ ] Duplicate user accounts are prevented.
- [ ] Schema does not store passwords or token secrets.
- [ ] Sensitive information is excluded from projections.

**Branch Name:**
`feature/add-user-schema`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 01 — Create User Module

**Notes:**
Credential data (password hashes, refresh tokens) will reside in a dedicated Auth model.

**Plan Commit:**

- Commit 1: `feat: create user mongoose schema and interfaces`

---

### Pull Request 02

**Title:** `feat: add user schema`

**Summary:**
Adds the database schema for platform users and establishes the relationship with connected merchant stores.

**Related Issue:**
Closes #24

**Changes:**

- Create `User` Mongoose schema and interface.
- Add unique index on `email` field.
- Add `storeId` reference and user status enum.
- Register `User` model in `UserModule`.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Verified schema creation in MongoDB and verified unique constraint on email through automated unit tests.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 03 — Create Authentication Module

### Issue (Feature Template)

**Title:** `[Feature]: Create authentication module`  
**Labels:** `type:feature`, `priority:critical`, `area:auth`

**Description:**
Create the authentication module responsible for authenticating users, validating credentials, signing JWTs, managing refresh sessions, and enforcing security policies. The module encapsulates Passport strategies, auth guards, and hashing utilities.

**Acceptance Criteria:**

- [ ] Auth module exists.
- [ ] Auth service exists.
- [ ] Authentication controllers have a dedicated location.
- [ ] Authentication guards have a dedicated location.
- [ ] JWT strategy and utilities have a dedicated location.
- [ ] Refresh token functionality has a dedicated location.
- [ ] Authentication logic is isolated from the Users domain.

**Branch Name:**
`feature/create-auth-module`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 01 — Create User Module

**Notes:**
Import `UserModule` into `AuthModule` to facilitate user lookups during authentication.

**Plan Commit:**

- Commit 1: `feat: scaffold authentication module and controllers`
- Commit 2: `feat: configure passport and jwt module dependencies`

---

### Pull Request 03

**Title:** `feat: create authentication module`

**Summary:**
Creates the authentication module and establishes clear architectural boundaries between authentication and user profile management.

**Related Issue:**
Closes #25

**Changes:**

- Scaffold `AuthModule`, `AuthController`, and `AuthService`.
- Configure `@nestjs/jwt` and `@nestjs/passport` module registrations.
- Setup directory layout for auth guards, strategies, and DTOs.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Ran build to ensure module dependency graph is valid without circular dependencies.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 04 — Create Authentication Credentials Schema

### Issue (Feature Template)

**Title:** `[Feature]: Add authentication credentials schema`  
**Labels:** `type:feature`, `priority:critical`, `area:auth`

**Description:**
Create the database persistence model responsible for storing authentication credentials, password hashes (using Argon2/Bcrypt), hashed refresh token sessions, failed login counts, lock expiry times, and password reset tokens.

**Acceptance Criteria:**

- [ ] Auth credentials schema is created with a reference to `userId`.
- [ ] Password hash is stored securely.
- [ ] Plain-text passwords and plain-text tokens are never persisted.
- [ ] Active session / hashed refresh token storage is supported.
- [ ] Failed login attempts counter and lockout timestamps are tracked.
- [ ] Password reset token hash and expiration fields are included.
- [ ] Sensitive fields are excluded by default (`select: false`).
- [ ] Required indexes on `userId` and token hashes are created.

**Branch Name:**
`feature/add-auth-schema`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 03 — Create Auth Module

**Notes:**
All refresh tokens and reset tokens must be stored as one-way cryptographic hashes.

**Plan Commit:**

- Commit 1: `feat: create auth credentials mongoose schema`

---

### Pull Request 04

**Title:** `feat: add authentication credentials schema`

**Summary:**
Adds the persistence model for password credentials, active refresh sessions, lockout status, and reset state.

**Related Issue:**
Closes #26

**Changes:**

- Create `AuthCredentials` schema and TypeScript interfaces.
- Add fields for password hash, hashed refresh token list, failed attempts, and lock status.
- Add `select: false` flag to sensitive fields.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Verified schema indexing and verified that sensitive fields are stripped from standard find queries.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 05 — Create User Account Flow

### Issue (Feature Template)

**Title:** `[Feature]: Create platform user account`  
**Labels:** `type:feature`, `priority:critical`, `area:users`, `area:auth`

**Description:**
Implement the user creation workflow that creates a new platform account, associates it with a connected Salla store, validates unique email constraints, and creates corresponding authentication credentials with a securely hashed password.

**Acceptance Criteria:**

- [ ] User creation service method exists.
- [ ] Email input is normalized and validated.
- [ ] Duplicate emails are rejected with a conflict error.
- [ ] User is associated with the target Salla store identifier.
- [ ] Password is validated against complexity rules and hashed securely before storage.
- [ ] Transactional/atomic consistency is maintained between User and AuthCredentials records.
- [ ] Sensitive credential fields are omitted from returned DTOs.

**Branch Name:**
`feature/create-user-account`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 02 — Create User Schema
- Issue 04 — Create Auth Schema

**Notes:**
Use Argon2id or bcrypt with appropriate work factor/salt rounds.

**Plan Commit:**

- Commit 1: `feat: implement password hashing service`
- Commit 2: `feat: implement atomic user account creation workflow`

---

### Pull Request 05

**Title:** `feat: implement user account creation`

**Summary:**
Implements user account registration, password hashing, and linking of merchant store context.

**Related Issue:**
Closes #27

**Changes:**

- Implement `PasswordService` for secure hashing and verification.
- Add `createUser` method in `UserService` with email normalization.
- Link account creation with `AuthCredentials` record.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Ran automated unit tests for account creation, verified unique email collision rejection, and confirmed password hash storage.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

### Issue (Feature Template)

**Title:** `[Feature]: Add password setup flow`  
**Labels:** `type:feature`, `priority:critical`, `area:auth`

**Description:**
Allow merchants onboarded via Salla OAuth without a pre-existing password to securely set their dashboard password. The setup mechanism uses a cryptographically secure, short-lived setup token that is invalidated immediately upon successful password creation.

**Acceptance Criteria:**

- [ ] Password setup endpoint (`POST /auth/password/setup`) exists.
- [ ] User without a password can establish one.
- [ ] Password complexity rules are enforced.
- [ ] Setup token is verified and must not be expired.
- [ ] Setup token is single-use and invalidated immediately after use.
- [ ] Accounts with an existing active password cannot overwrite it via this endpoint.
- [ ] Password is saved as a secure hash.

**Branch Name:**
`feature/set-initial-password`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 05 — Create User Account Flow

**Notes:**
Provides a seamless onboarding bridge for OAuth merchants entering the platform dashboard.

**Plan Commit:**

- Commit 1: `feat: implement initial password setup token generation`
- Commit 2: `feat: add password setup endpoint and token consumption`

---

### Pull Request 06

**Title:** `feat: add initial password setup`

**Summary:**
Allows newly onboarded Salla merchants to securely set their platform dashboard password via token verification.

**Related Issue:**
Closes #28

**Changes:**

- Add `POST /auth/password/setup` route and DTO validation.
- Implement token verification and password initialization service logic.
- Invalidate setup token upon successful password assignment.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Executed test cases for valid setup token, expired token, and attempted reuse on an account that already has a password.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 06 — Implement User Login

### Issue (Feature Template)

**Title:** `[Feature]: Add user login`  
**Labels:** `type:feature`, `priority:critical`, `area:auth`

**Description:**
Implement password-based authentication endpoint (`POST /auth/login`). Validates email and password, checks account lock status, verifies credentials using constant-time comparisons, resets failed login counters upon success, generates JWT access and refresh tokens, and persists the refresh session.

**Acceptance Criteria:**

- [ ] Endpoint `POST /auth/login` exists.
- [ ] Incoming email is normalized and validated.
- [ ] Password hash is verified securely.
- [ ] Locked accounts are blocked from logging in.
- [ ] Failed login attempts increment the failure counter.
- [ ] Successful login resets the failed login attempt counter.
- [ ] Short-lived JWT access token is issued.
- [ ] Long-lived refresh token is generated, hashed, and stored.
- [ ] Invalid credentials return a generic `401 Unauthorized` error without leaking email existence.

**Branch Name:**
`feature/user-login`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 04 — Create Auth Schema
- Issue 05 — Create User Account Flow

**Notes:**
Return access token in payload; handle refresh token securely via response body or httpOnly cookie.

**Plan Commit:**

- Commit 1: `feat: implement login credential validation and attempt tracking`
- Commit 2: `feat: add login endpoint with token pair generation`

---

### Pull Request 07

**Title:** `feat: implement user login`

**Summary:**
Implements password login, credential verification, failed attempt tracking, and token session issuance.

**Related Issue:**
Closes #29

**Changes:**

- Add `POST /auth/login` controller endpoint and `LoginDto`.
- Implement `validateUserCredentials` in `AuthService`.
- Issue JWT access token and refresh token session.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Tested valid login, invalid password, nonexistent email, and locked user states; verified token issuance.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 07 — Implement JWT Authentication

### Issue (Feature Template)

**Title:** `[Feature]: Implement JWT access authentication`  
**Labels:** `type:feature`, `priority:critical`, `area:auth`

**Description:**
Implement JWT access token strategy and authentication guard (`JwtAuthGuard`) for protecting API routes. Validates token signature, expiration, and payload claims, attaching the authenticated user context to incoming HTTP requests.

**Acceptance Criteria:**

- [ ] JWT signing and verification are configured via environment secrets.
- [ ] Token expiration is enforced (e.g., 15 minutes).
- [ ] `PassportJwtStrategy` extracts Bearer tokens from authorization headers.
- [ ] `JwtAuthGuard` protects routes and rejects invalid or expired tokens with `401 Unauthorized`.
- [ ] Authenticated `User` entity is attached to `request.user`.
- [ ] Sensitive fields are omitted from token payload claims.

**Branch Name:**
`feature/jwt-authentication`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 03 — Create Auth Module
- Issue 07 — Implement User Login

**Notes:**
Keep JWT payload minimal (`sub`, `email`, `storeId`).

**Plan Commit:**

- Commit 1: `feat: implement passport jwt strategy and jwt guard`
- Commit 2: `feat: configure access token signing and token extractor`

---

### Pull Request 08

**Title:** `feat: implement JWT authentication`

**Summary:**
Adds JWT access token authentication strategy, guards, and request user context population for protected routes.

**Related Issue:**
Closes #30

**Changes:**

- Implement `JwtStrategy` and `JwtAuthGuard`.
- Configure JWT options from centralized configuration.
- Add `@CurrentUser()` decorator to extract user from request context.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Applied guard to test endpoint; verified success with valid token and rejection with missing, tampered, or expired tokens.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 08 — Implement Refresh Token Flow

### Issue (Feature Template)

**Title:** `[Feature]: Add refresh token rotation`  
**Labels:** `type:feature`, `priority:critical`, `area:auth`

**Description:**
Implement refresh token endpoint (`POST /auth/refresh`) using token rotation. Validates incoming refresh token against stored hash, revokes used refresh token, issues a new access token and a new refresh token, and detects token reuse to invalidate compromised sessions.

**Acceptance Criteria:**

- [ ] Endpoint `POST /auth/refresh` exists.
- [ ] Incoming refresh token is cryptographically verified against persisted hash.
- [ ] Expired or revoked refresh tokens are rejected.
- [ ] Token rotation is enforced: previous refresh token is immediately invalidated upon replacement.
- [ ] Refresh token reuse detection revokes all active sessions for the user.
- [ ] New access token and rotated refresh token are returned.

**Branch Name:**
`feature/refresh-token-rotation`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 08 — Implement JWT Authentication

**Notes:**
Ensure rotation is atomic to prevent race conditions during concurrent client refresh calls.

**Plan Commit:**

- Commit 1: `feat: implement refresh token hashing and rotation service`
- Commit 2: `feat: add refresh token endpoint and reuse detection`

---

### Pull Request 09

**Title:** `feat: implement refresh token rotation`

**Summary:**
Implements refresh-token rotation, reuse detection, and session renewal.

**Related Issue:**
Closes #31

**Changes:**

- Add `POST /auth/refresh` route and validation DTO.
- Implement token rotation logic in `AuthService`.
- Add token reuse detection mechanism to revoke sessions on replay attempts.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Tested normal token rotation, expired token failure, and simulated token reuse to verify full session revocation.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 09 — Implement Logout

### Issue (Feature Template)

**Title:** `[Feature]: Add user logout`  
**Labels:** `type:feature`, `priority:high`, `area:auth`

**Description:**
Implement logout endpoint (`POST /auth/logout`) for authenticated users. The endpoint invalidates and removes the current active refresh token/session from database storage, preventing subsequent token renewals.

**Acceptance Criteria:**

- [ ] Protected endpoint `POST /auth/logout` exists.
- [ ] Active session is identified from the user context or refresh token.
- [ ] Refresh token hash is removed/revoked from the database.
- [ ] Revoked session cannot be used with `/auth/refresh`.
- [ ] Repeated logout requests are handled idempotently.
- [ ] User can log in again to establish a new session.

**Branch Name:**
`feature/user-logout`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 09 — Implement Refresh Token Flow

**Notes:**
Can support single-session logout or revoke-all sessions option.

**Plan Commit:**

- Commit 1: `feat: implement session revocation in auth repository`
- Commit 2: `feat: add authenticated logout endpoint`

---

### Pull Request 10

**Title:** `feat: implement user logout`

**Summary:**
Implements authenticated logout and refresh session invalidation.

**Related Issue:**
Closes #32

**Changes:**

- Add `POST /auth/logout` endpoint guarded by `JwtAuthGuard`.
- Implement `logout` method in `AuthService` to revoke target refresh token.
- Add unit tests verifying session deletion.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Executed logout and confirmed subsequent `/auth/refresh` calls using the previous token fail with `401 Unauthorized`.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 10 — Add Current User Endpoint

### Issue (Feature Template)

**Title:** `[Feature]: Add current authenticated user endpoint`  
**Labels:** `type:feature`, `priority:high`, `area:auth`, `area:users`

**Description:**
Create protected endpoint (`GET /auth/me`) that returns the profile data and store association of the currently authenticated merchant. Enables dashboard state rehydration on client startup.

**Acceptance Criteria:**

- [ ] Endpoint `GET /auth/me` exists and requires JWT authentication.
- [ ] Authenticated user is extracted from JWT claims.
- [ ] User profile information (`id`, `name`, `email`, `storeId`, `status`) is returned.
- [ ] Password hashes and session secrets are strictly excluded from the response.
- [ ] Unauthenticated requests return `401 Unauthorized`.

**Branch Name:**
`feature/current-user-endpoint`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 08 — Implement JWT Authentication

**Notes:**
Return clean DTO wrapped in consistent JSON response structure.

**Plan Commit:**

- Commit 1: `feat: add get me service query`
- Commit 2: `feat: add get current user endpoint and serialization dto`

---

### Pull Request 11

**Title:** `feat: add current authenticated user endpoint`

**Summary:**
Adds the authenticated user profile endpoint required by the dashboard.

**Related Issue:**
Closes #33

**Changes:**

- Add `GET /auth/me` route in `AuthController`.
- Implement user profile serialization DTO excluding sensitive fields.
- Integrate `@CurrentUser()` decorator with endpoint handler.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Called `/auth/me` with valid JWT and confirmed user profile fields are returned without credentials.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

### Issue (Feature Template)

**Title:** `[Feature]: Add password change`  
**Labels:** `type:feature`, `priority:high`, `area:auth`

**Description:**
Implement password change endpoint (`PATCH /auth/password`) for authenticated users. Verifies the user's current password, validates new password strength, updates the password hash, and invalidates other active refresh sessions.

**Acceptance Criteria:**

- [ ] Protected endpoint `PATCH /auth/password` exists.
- [ ] Current password is verified against stored hash before updating.
- [ ] Incorrect current password throws `400 Bad Request` or `401 Unauthorized`.
- [ ] New password complexity rules are enforced.
- [ ] New password is hashed securely before persistence.
- [ ] Existing refresh token sessions are invalidated according to security policy.
- [ ] Active password reset tokens are cleared.

**Branch Name:**
`feature/change-password`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 07 — Implement User Login
- Issue 09 — Implement Refresh Token Flow

**Notes:**
Ensure previous password and new password are not identical.

**Plan Commit:**

- Commit 1: `feat: implement password verification and update logic`
- Commit 2: `feat: add change password endpoint with session invalidation`

---

### Pull Request 12

**Title:** `feat: implement password change`

**Summary:**
Allows authenticated users to securely update their password while invalidating other active sessions.

**Related Issue:**
Closes #34

**Changes:**

- Add `PATCH /auth/password` endpoint and `ChangePasswordDto`.
- Implement password verification, hashing, and credential update in `AuthService`.
- Invalidate all existing refresh tokens for the account.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Tested changing password with correct and incorrect current password; confirmed old sessions could no longer refresh.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

### Issue (Feature Template)

**Title:** `[Feature]: Add password reset request`  
**Labels:** `type:feature`, `priority:high`, `area:auth`

**Description:**
Implement forgot password endpoint (`POST /auth/password/forgot`). Generates a cryptographically random, short-lived reset token, stores a hash of the token with expiration in the database, and returns a generic success response to prevent email enumeration.

**Acceptance Criteria:**

- [ ] Public endpoint `POST /auth/password/forgot` exists.
- [ ] Accepts email and normalizes it.
- [ ] Response returns identical generic success message regardless of whether the email exists.
- [ ] Secure random reset token is generated.
- [ ] Only the cryptographic hash of the reset token is persisted with a short TTL (e.g., 15 minutes).
- [ ] Previously issued reset tokens for the user are overwritten/invalidated.

**Branch Name:**
`feature/password-reset-request`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 04 — Create Authentication Credentials Schema

**Notes:**
Prepare email notification dispatch hook/event.

**Plan Commit:**

- Commit 1: `feat: implement secure reset token generator and hashing`
- Commit 2: `feat: add forgot password endpoint with generic response`

---

### Pull Request 13

**Title:** `feat: add password reset request`

**Summary:**
Implements the password reset request flow using secure, short-lived reset token hashes without leaking account existence.

**Related Issue:**
Closes #35

**Changes:**

- Add `POST /auth/password/forgot` endpoint and `ForgotPasswordDto`.
- Implement token generation and token hash persistence in `AuthService`.
- Enforce constant response payload for security against user enumeration.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Sent requests with registered and unregistered emails; verified identical responses and verified token hash creation in DB.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

### Issue (Feature Template)

**Title:** `[Feature]: Implement password reset`  
**Labels:** `type:feature`, `priority:high`, `area:auth`

**Description:**
Implement password reset completion endpoint (`POST /auth/password/reset`). Validates the plain reset token against the stored token hash, verifies expiration, updates the password hash, invalidates the used reset token, and terminates all active sessions.

**Acceptance Criteria:**

- [ ] Public endpoint `POST /auth/password/reset` exists.
- [ ] Reset token is verified against stored hash.
- [ ] Expired or invalid reset tokens return `400 Bad Request`.
- [ ] New password complexity requirements are enforced.
- [ ] New password is hashed and stored.
- [ ] Used reset token is cleared immediately.
- [ ] All existing refresh token sessions are invalidated.

**Branch Name:**
`feature/password-reset`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 13 — Request Password Reset

**Notes:**
Ensures complete token invalidation upon successful reset.

**Plan Commit:**

- Commit 1: `feat: implement reset token verification and password reset logic`
- Commit 2: `feat: add reset password endpoint with session cleanup`

---

### Pull Request 14

**Title:** `feat: implement password reset`

**Summary:**
Completes the secure password reset flow with token consumption and session revocation.

**Related Issue:**
Closes #36

**Changes:**

- Add `POST /auth/password/reset` route and `ResetPasswordDto`.
- Implement token validation, credential update, and token invalidation in `AuthService`.
- Invalidate all active sessions for the user.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Tested reset with valid token, expired token, reused token, and confirmed successful login with the new password.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

### Issue (Feature Template)

**Title:** `[Feature]: Add authentication security controls`  
**Labels:** `type:feature`, `priority:high`, `area:auth`

**Description:**
Implement defense-in-depth security controls around login attempts. Tracks consecutive failed attempts, locks the account when a configurable threshold is reached (e.g., 5 failed attempts locks for 15 minutes), handles automatic lock expiration, and audits security events safely without logging passwords.

**Acceptance Criteria:**

- [ ] Failed login attempts increment consecutive failure counter.
- [ ] Account is locked when threshold is exceeded (`maxFailedAttempts`).
- [ ] Lock duration is configurable via environment variables (`lockDurationMinutes`).
- [ ] Locked accounts reject authentication with informative error (`Account is temporarily locked`).
- [ ] Expired lock allows authentication retry and resets counter on success.
- [ ] Passwords and auth tokens are stripped from security logs.

**Branch Name:**
`feature/auth-security-controls`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- Issue 07 — Implement User Login

**Notes:**
Use centralized environment configuration for lock thresholds.

**Plan Commit:**

- Commit 1: `feat: implement account lockout logic and failed attempts tracker`
- Commit 2: `feat: add security event audit logging without credential leaks`

---

### Pull Request 15

**Title:** `feat: add authentication security controls`

**Summary:**
Adds login attempt tracking, configurable account lockout, and sanitized security audit logging.

**Related Issue:**
Closes #37

**Changes:**

- Implement lockout checking and failure increment in `AuthService`.
- Add environment options for lock threshold and duration.
- Add structured security audit logs for lock/unlock and failure events.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Simulated repeated failed logins to trigger lock state; confirmed lock prevented authentication until timeout elapsed.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

### Issue (Feature Template)

**Title:** `[Feature]: Add authentication and user test coverage`  
**Labels:** `type:test`, `priority:critical`, `area:auth`, `area:users`

**Description:**
Add comprehensive automated unit and integration tests covering user creation, login, JWT validation, refresh token rotation, token reuse detection, logout, password change, password reset, and account lockout.

**Acceptance Criteria:**

- [ ] User creation and duplicate prevention tests pass.
- [ ] Login credential verification and attempt counters are tested.
- [ ] JWT authentication guard and claim extraction are tested.
- [ ] Refresh token rotation, expiry, and reuse detection scenarios pass.
- [ ] Logout and session invalidation are verified.
- [ ] Password change and forgot/reset password flows pass.
- [ ] Account lockout behavior is tested.
- [ ] Test suite runs reliably in CI.

**Branch Name:**
`test/authentication-and-users`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- All implementation Issues in Sprint 02

**Notes:**
Use NestJS testing module and in-memory MongoDB / mock repositories.

**Plan Commit:**

- Commit 1: `test: add user and auth service unit tests`
- Commit 2: `test: add authentication e2e test suite covering full token lifecycle`

---

### Pull Request 16

**Title:** `test: add authentication and user coverage`

**Summary:**
Adds automated unit and E2E test suites covering user management, authentication, token rotation, password flows, and security controls.

**Related Issue:**
Closes #38

**Changes:**

- Add `test/auth/auth.e2e-spec.ts`.
- Add unit tests for `UserService`, `AuthService`, and `PasswordService`.
- Add tests for lockout and token reuse detection logic.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Ran `npm run test` and `npm run test:e2e` to verify 100% passing suites across all auth scenarios.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 11 — Document Authentication and User Flows

### Issue (Documentation Template)

**Title:** `[Docs]: Document authentication and user flows`  
**Labels:** `type:documentation`, `priority:medium`, `area:auth`, `area:users`

**Description:**
Document the authentication architecture, token lifecycle, password management, account lockout policies, and API endpoints for developers and dashboard integrators.

**Scope:**

- Authentication architecture diagrams and token rotation sequence.
- API endpoint specifications (`/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/password/*`).
- Environment variables checklist for JWT secrets and lockout configs.
- Password complexity requirements and reset token lifespan details.
- Security best practices and error responses.

**Branch Name:**
`docs/document-authentication`

**Milestone:**
`Sprint 02 — Authentication & Users`

**Dependencies:**

- All implementation Issues in Sprint 02

**Notes:**
Place documentation in `docs/auth/authentication.md`.

**Plan Commit:**

- Commit 1: `docs: document authentication architecture and token lifecycle`
- Commit 2: `docs: document auth api endpoints and security controls`

---

### Pull Request 17

**Title:** `docs: document authentication and user flows`

**Summary:**
Adds comprehensive developer and integration documentation covering authentication, session management, password flows, and security controls.

**Related Issue:**
Closes #39

**Changes:**

- Create `docs/auth/authentication.md`.
- Document token rotation and lockout policies.
- Document all `/auth/*` endpoints with request and response schemas.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Reviewed markdown rendering and validated request/response payload examples against actual controllers.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.
