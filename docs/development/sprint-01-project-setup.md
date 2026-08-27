# Sprint 01 — Project Setup & Foundation

## Sprint Goal

Establish a clean, scalable, and production-ready backend foundation for the project.

By the end of this Sprint, the backend should be able to run locally, connect to MongoDB, load environment configuration, validate incoming requests, handle errors consistently, expose a health check, and provide a clean foundation for the upcoming Salla Integration and Authentication Sprints.

---

# Milestone

`Sprint 01 — Project Setup & Foundation`

---

# Sprint Scope

This Sprint focuses only on the backend foundation.

---

# Issue List

## Issue 01 — Initialize NestJS Backend

### Issue (Feature Template)

**Title:** `[Feature]: Initialize NestJS backend project`  
**Labels:** `type:feature`, `priority:high`, `area:foundation`

**Description:**
Initialize the backend application using NestJS. The project should provide the basic application entry point and the minimum structure required to start building the backend. The initial setup includes TypeScript configuration, entry points, package configuration, development scripts, and production build configurations.

**Acceptance Criteria:**
- [ ] NestJS project is initialized.
- [ ] Application starts successfully in development mode.
- [ ] Application builds successfully for production.
- [ ] Basic project scripts are available.
- [ ] Application entry point is configured.
- [ ] No unnecessary default/demo code remains.

**Branch Name:**
`feature/initialize-nestjs-backend`

**Milestone:**
`Sprint 01 — Project Setup & Foundation`

**Dependencies:**
None.

**Notes:**
Initial foundational repository setup.

---

### Pull Request 01

**Title:** `chore: initialize NestJS backend`

**Summary:**
Initializes the NestJS backend application, configures TypeScript and basic scripts, and removes boilerplate demo code.

**Related Issue:**
Closes #1

**Changes:**
- Initialize NestJS project scaffolding.
- Configure `tsconfig.json` and package build scripts.
- Set up main application entry point.
- Clean up default boilerplate/demo files.

**Acceptance Criteria:**
- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Ran `npm run start:dev` to verify local startup and `npm run build` to confirm production build generation.

**Checklist:**
- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

**Plan Commit:**
- Commit 1: `chore: initialize nestjs project`
- Commit 2: `chore: configure project scripts`

---

## Issue 02 — Establish Project Structure

### Issue (Feature Template)

**Title:** `[Feature]: Establish scalable backend project structure`  
**Labels:** `type:feature`, `priority:high`, `area:foundation`

**Description:**
Define the initial backend folder structure to support future modules. The structure separates shared application concerns (config, database, common utilities) from business domain modules following NestJS architectural conventions.

**Acceptance Criteria:**
- [ ] Base source structure is created.
- [ ] Common/shared functionality has a dedicated location.
- [ ] Configuration has a dedicated location.
- [ ] Database functionality has a dedicated location.
- [ ] Business modules have a dedicated location.
- [ ] Structure is consistent with NestJS conventions.

**Branch Name:**
`feature/establish-project-structure`

**Milestone:**
`Sprint 01 — Project Setup & Foundation`

**Dependencies:**
- Issue 01 — Initialize NestJS Backend

**Notes:**
Ensures directory scalability before adding domain modules.

---

### Pull Request 02

**Title:** `chore: establish backend project structure`

**Summary:**
Sets up the modular directory layout separating configuration, core database connections, common utilities, and business modules.

**Related Issue:**
Closes #2

**Changes:**
- Create `src/config`, `src/database`, `src/common`, and `src/modules` directories.
- Configure barrel exports and module scaffolding.
- Link core directories inside the root application module.

**Acceptance Criteria:**
- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Verified that the application compiles and starts with the restructured folder architecture.

**Checklist:**
- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

**Plan Commit:**
- Commit 1: `chore: create modular folder architecture`
- Commit 2: `chore: configure core shared layout`

---

## Issue 03 — Configure Environment Management

### Issue (Feature Template)

**Title:** `[Feature]: Configure environment management`  
**Labels:** `type:feature`, `priority:high`, `area:foundation`

**Description:**
Add a centralized environment configuration and validation system using `@nestjs/config`. Ensures environment variables are validated at startup across development, testing, and production environments, while preventing secrets from being tracked by git.

**Acceptance Criteria:**
- [ ] Environment variables can be loaded by the application.
- [ ] Configuration is centralized.
- [ ] Required configuration values are strictly validated.
- [ ] Development, test, and production profiles are supported.
- [ ] `.env*` secrets are excluded from Git.
- [ ] Example `.env.example` file is documented.

**Branch Name:**
`feature/configure-environment-management`

**Milestone:**
`Sprint 01 — Project Setup & Foundation`

**Dependencies:**
- Issue 01 — Initialize NestJS Backend

**Notes:**
Use Joi or `class-validator` / `class-transformer` for environment schema validation.

---

### Pull Request 03

**Title:** `feat: configure environment management`

**Summary:**
Introduces centralized environment management with schema validation and environment template files.

**Related Issue:**
Closes #3

**Changes:**
- Add `@nestjs/config` integration.
- Implement configuration validation schema.
- Add `.env.example` template and verify `.gitignore` ignores actual environment secrets.

**Acceptance Criteria:**
- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Tested startup with missing required variables (fails fast) and valid `.env` variables (starts cleanly).

**Checklist:**
- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

**Plan Commit:**
- Commit 1: `chore: add environment configuration`
- Commit 2: `chore: add environment validation schema`

---

## Issue 04 — Configure MongoDB Connection

### Issue (Feature Template)

**Title:** `[Feature]: Configure MongoDB database connection`  
**Labels:** `type:feature`, `priority:high`, `area:foundation`

**Description:**
Configure backend connectivity to MongoDB via `@nestjs/mongoose` using validated environment variables. The database connection should fail clearly and gracefully if credentials or hosts are misconfigured.

**Acceptance Criteria:**
- [ ] MongoDB connection is configured via Mongoose.
- [ ] Connection uses centralized environment configuration.
- [ ] Application connects successfully to the configured database.
- [ ] Database connection errors are handled and logged.
- [ ] Database configuration values are not hardcoded.

**Branch Name:**
`feature/configure-mongodb-connection`

**Milestone:**
`Sprint 01 — Project Setup & Foundation`

**Dependencies:**
- Issue 03 — Configure Environment Management

**Notes:**
Ensures standard connection pooling and retry strategies are supported.

---

### Pull Request 04

**Title:** `feat: configure MongoDB connection`

**Summary:**
Integrates Mongoose with `@nestjs/config` to manage asynchronous database connections.

**Related Issue:**
Closes #4

**Changes:**
- Add `@nestjs/mongoose` and `mongoose` dependencies.
- Register `MongooseModule.forRootAsync` using environment variables.
- Add error handling for database connection failures.

**Acceptance Criteria:**
- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Connected against a local MongoDB instance, verified active connection logs, and tested behavior with invalid URI.

**Checklist:**
- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

**Plan Commit:**
- Commit 1: `feat: configure mongodb connection module`
- Commit 2: `test: verify mongodb connection lifecycle`

---

## Issue 05 — Configure Global Request Validation

### Issue (Feature Template)

**Title:** `[Feature]: Configure global request validation`  
**Labels:** `type:feature`, `priority:high`, `area:foundation`

**Description:**
Configure global input validation using NestJS `ValidationPipe`. Guarantees that incoming request bodies and query parameters conform strictly to DTO definitions before hitting controller methods.

**Acceptance Criteria:**
- [ ] Global `ValidationPipe` is enabled.
- [ ] Request DTO validation is active with stripping of non-whitelisted properties.
- [ ] Invalid requests are rejected with a structured `400 Bad Request` response.
- [ ] Validation errors follow a predictable response format.

**Branch Name:**
`feature/configure-global-validation`

**Milestone:**
`Sprint 01 — Project Setup & Foundation`

**Dependencies:**
- Issue 02 — Establish Project Structure

**Notes:**
Set `whitelist: true` and `forbidNonWhitelisted: true` in the pipe options.

---

### Pull Request 05

**Title:** `feat: configure global request validation`

**Summary:**
Sets up global validation pipes with DTO validation and consistent error responses.

**Related Issue:**
Closes #5

**Changes:**
- Configure `ValidationPipe` globally in `main.ts`.
- Set validation rules (`whitelist`, `transform`, `forbidNonWhitelisted`).
- Standardize the validation error payload formatting.

**Acceptance Criteria:**
- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Tested sample POST endpoints with valid and invalid payloads to confirm validation behavior and error payloads.

**Checklist:**
- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

**Plan Commit:**
- Commit 1: `feat: configure global validation pipe`
- Commit 2: `chore: standardize validation error formatting`

---

## Issue 06 — Configure Global Exception Handling

### Issue (Feature Template)

**Title:** `[Feature]: Configure global exception handling`  
**Labels:** `type:feature`, `priority:high`, `area:foundation`

**Description:**
Create a centralized global exception filter (`AllExceptionsFilter`) to capture both standard `HttpException` instances and unhandled exceptions, formatting them into a unified response schema while hiding internal stack traces from clients in production.

**Acceptance Criteria:**
- [ ] Global exception filter is configured.
- [ ] API errors adhere to a uniform response envelope (`statusCode`, `message`, `timestamp`, `path`).
- [ ] Unhandled internal errors return safe `500 Internal Server Error` responses.
- [ ] Internal implementation details and stack traces are excluded from client payloads.
- [ ] HTTP status codes remain accurate.

**Branch Name:**
`feature/configure-global-exception-handling`

**Milestone:**
`Sprint 01 — Project Setup & Foundation`

**Dependencies:**
- Issue 02 — Establish Project Structure

**Notes:**
Should log error stacks server-side while keeping client output clean.

---

### Pull Request 06

**Title:** `feat: configure global exception handling`

**Summary:**
Introduces a custom global exception filter for unified error envelopes and security against stack trace leaks.

**Related Issue:**
Closes #6

**Changes:**
- Implement `GlobalExceptionFilter` implementing `ExceptionFilter`.
- Register filter globally in `main.ts` or as a core provider.
- Standardize the error response structure.

**Acceptance Criteria:**
- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Triggered simulated 404, 400, and unhandled 500 exceptions to verify consistent JSON output format.

**Checklist:**
- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

**Plan Commit:**
- Commit 1: `feat: implement global exception filter`
- Commit 2: `chore: register global error handler in bootstrap`

---

## Issue 07 — Configure Application Logging

### Issue (Feature Template)

**Title:** `[Feature]: Configure application logging`  
**Labels:** `type:feature`, `priority:medium`, `area:foundation`

**Description:**
Establish a consistent logging infrastructure across the application for tracking request flows, lifecycle events, and application errors without leaking credentials or sensitive customer data.

**Acceptance Criteria:**
- [ ] Application logger is configured.
- [ ] Lifecycle events and HTTP requests can be logged.
- [ ] Errors are logged with contextual metadata and stack traces server-side.
- [ ] Sensitive keys (passwords, tokens) are excluded/masked from log output.
- [ ] Log levels can be adjusted based on environment (`debug`, `log`, `warn`, `error`).

**Branch Name:**
`feature/configure-application-logging`

**Milestone:**
`Sprint 01 — Project Setup & Foundation`

**Dependencies:**
- Issue 06 — Configure Global Exception Handling

**Notes:**
Can use built-in NestJS `Logger` or Winston/Pino.

---

### Pull Request 07

**Title:** `feat: configure application logging`

**Summary:**
Implements structured logging across application startup, HTTP requests, and exception boundaries.

**Related Issue:**
Closes #7

**Changes:**
- Set up logging service with environment-specific log levels.
- Integrate logging with the global exception filter.
- Add HTTP logging middleware/interceptor.

**Acceptance Criteria:**
- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Triggered endpoints and verified log format output in terminal and error log aggregation.

**Checklist:**
- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

**Plan Commit:**
- Commit 1: `feat: configure application logging service`
- Commit 2: `feat: add http request logging interceptor`

---

## Issue 08 — Configure API Prefix and CORS

### Issue (Feature Template)

**Title:** `[Feature]: Configure API prefix and CORS`  
**Labels:** `type:feature`, `priority:medium`, `area:foundation`

**Description:**
Set up a global API prefix (e.g., `/api/v1`) and configure CORS rules dynamically based on environment variables to allow secure communication with the frontend.

**Acceptance Criteria:**
- [ ] Global API prefix is configured.
- [ ] API routing follows versioning conventions.
- [ ] CORS origins, methods, and credentials are configurable via environment variables.
- [ ] Local frontend origins can access the API during development.
- [ ] Production origins are restricted without requiring code changes.

**Branch Name:**
`feature/configure-api-prefix-and-cors`

**Milestone:**
`Sprint 01 — Project Setup & Foundation`

**Dependencies:**
- Issue 03 — Configure Environment Management

**Notes:**
Ensures support for credentials (cookies/authorization headers).

---

### Pull Request 08

**Title:** `feat: configure API prefix and CORS`

**Summary:**
Configures global route prefixing and dynamic CORS handling linked to environment settings.

**Related Issue:**
Closes #8

**Changes:**
- Add `app.setGlobalPrefix('api/v1')` in bootstrap.
- Implement CORS configuration using environment values.
- Support preflight options and credential handling.

**Acceptance Criteria:**
- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Sent cross-origin test requests with matching and non-matching origin headers to verify CORS enforcement.

**Checklist:**
- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

**Plan Commit:**
- Commit 1: `feat: set global api route prefix`
- Commit 2: `feat: configure dynamic cors options`

---

## Issue 09 — Add Health Check

### Issue (Feature Template)

**Title:** `[Feature]: Add application health check`  
**Labels:** `type:feature`, `priority:medium`, `area:foundation`

**Description:**
Provide a public health check endpoint (`/api/v1/health`) using `@nestjs/terminus` to verify application readiness, database connectivity, and overall system availability.

**Acceptance Criteria:**
- [ ] Health check endpoint exists at `/api/v1/health`.
- [ ] Endpoint is accessible without authentication.
- [ ] Returns overall status (`ok` / `error`).
- [ ] Checks MongoDB connectivity status.
- [ ] Returns appropriate HTTP status codes (200 for healthy, 503 for unhealthy).

**Branch Name:**
`feature/add-health-check`

**Milestone:**
`Sprint 01 — Project Setup & Foundation`

**Dependencies:**
- Issue 04 — Configure MongoDB Connection

**Notes:**
Terminus `MongooseHealthIndicator` should be used.

---

### Pull Request 09

**Title:** `feat: add application health check`

**Summary:**
Implements health check endpoints for system uptime and database connectivity monitoring using Terminus.

**Related Issue:**
Closes #9

**Changes:**
- Add `@nestjs/terminus` module.
- Create `HealthModule` and `HealthController`.
- Implement MongoDB database connection indicator.

**Acceptance Criteria:**
- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Called `GET /api/v1/health` while DB was active (returned 200 OK) and while DB was stopped (returned 503 Service Unavailable).

**Checklist:**
- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

**Plan Commit:**
- Commit 1: `feat: add health check module using terminus`
- Commit 2: `feat: integrate mongodb health indicator`

---

## Issue 10 — Add Base Project Documentation

### Issue (Documentation Template)

**Title:** `[Docs]: Add backend setup documentation`  
**Labels:** `type:documentation`, `priority:medium`, `area:foundation`

**Description:**
Document setup, configuration, and execution instructions for developers running the backend locally.

**Scope:**
- Project prerequisites (Node.js, package manager, MongoDB).
- Environment variable configuration guide (`.env.example` mapping).
- Local installation and startup steps.
- Production build commands.
- Health check verification instructions.

**Branch Name:**
`docs/add-backend-setup-documentation`

**Milestone:**
`Sprint 01 — Project Setup & Foundation`

**Dependencies:**
- Issue 03 — Configure Environment Management
- Issue 04 — Configure MongoDB Connection

---

### Pull Request 10

**Title:** `docs: add backend setup documentation`

**Summary:**
Adds a comprehensive `README.md` containing local setup guidelines, prerequisite requirements, and environment management details.

**Related Issue:**
Closes #10

**Changes:**
- Add setup guide to `README.md`.
- Document configuration parameters and running modes (`dev`, `build`, `prod`).
- Include health check verification steps.

**Acceptance Criteria:**
- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Reviewed markdown rendering and validated steps by running setup commands on a clean workspace.

**Checklist:**
- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

**Plan Commit:**
- Commit 1: `docs: add project setup and run instructions`
- Commit 2: `docs: document environment variables and health check`