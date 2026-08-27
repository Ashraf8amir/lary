# Project Roadmap

## Product Vision

Build an enterprise-grade AI shopping assistant for Salla stores that simplifies product discovery for customers while providing merchants with actionable demand intelligence and lost opportunity analytics.

---

## Release Timeline Overview

| Milestone | Deliverable Scope | Target Release |
| :--- | :--- | :--- |
| **Sprint 01** | Project Setup & Foundation | `v0.1.0` |
| **Sprint 02** | Salla Integration & OAuth | `v0.2.0` |
| **Sprint 03** | Authentication & Users | `v0.3.0` |
| **Sprint 04** | Product Synchronization | `v0.4.0` |
| **Sprint 05** | Chatbot & Conversational Search | `v0.5.0` |
| **Sprint 06** | Analytics & Event Pipeline | `v0.6.0` |
| **Sprint 07** | Merchant Dashboard API | `v0.7.0` |
| **Sprint 08** | Production Hardening & Launch | `v1.0.0` |

---

## Sprint 01 — Project Setup & Foundation

### Goal
Establish a clean, scalable, and production-ready backend foundation with centralized configuration, database connectivity, global validation, structured error handling, and health monitoring.

### Main Areas
- NestJS application architecture and modular folder structure
- Centralized environment configuration and startup schema validation
- MongoDB connection setup using `@nestjs/mongoose`
- Global request validation (`ValidationPipe`) and consistent response formatting
- Centralized exception filter (`AllExceptionsFilter`)
- Application logging interceptor and operational visibility
- Global API routing prefix (`/api/v1`) and environment-based CORS
- Infrastructure health check endpoint (`/api/v1/health`) via Terminus
- Local development environment documentation and base scripts

### Target Release
`v0.1.0`

---

## Sprint 02 — Salla Integration & OAuth

### Goal
Implement the end-to-end Salla OAuth installation flow to authenticate and connect merchants' Salla stores securely, handle token lifecycle events, and establish the reusable Salla API client.

### Main Areas
- Salla application credentials configuration and validation
- Isolated Salla integration module and merchant connection schema
- OAuth authorization URL generator with cryptographic state verification
- OAuth callback handler for authorization code exchange
- Merchant and store profile extraction from Salla APIs
- Idempotent integration creation and reinstallation/upsert handling
- Reusable Salla HTTP API client foundation
- Integration lifecycle management (`connected`, `disconnected`)
- Disconnect endpoint with secure token revocation and data retention
- Salla domain exception handling and automated integration tests

### Target Release
`v0.2.0`

---

## Sprint 03 — Authentication & Users

### Goal
Provide secure password-based authentication, user account management, and session controls for merchants accessing the platform dashboard.

### Main Areas
- Dedicated Users domain module and Mongoose user schema
- Decoupled authentication module and protected credentials schema
- User account creation and Salla store association workflow
- Secure initial password setup for OAuth-onboarded merchants
- Password-based login with credential verification and failed attempt tracking
- JWT access token signing, token verification, and `JwtAuthGuard`
- Refresh token rotation and replay/reuse detection mechanisms
- Authenticated user logout with session revocation
- Current user profile endpoint (`GET /auth/me`)
- Password change and secure, single-use password reset flows
- Security controls: configurable account lockout and sanitized security audit logs
- Automated authentication test suites and developer documentation

### Target Release
`v0.3.0`

---

## Sprint 04 — Product Synchronization

### Goal
Build the product catalog pipeline that ingests, normalizes, indexes, and maintains product and variant data for high-speed conversational search.

### Main Areas
- Product and variant Mongoose schemas (attributes, pricing, options, inventory state)
- Salla product ingestion pipeline (bulk catalog sync via Salla API)
- Real-time catalog invalidation using Salla Webhooks (`product.updated`, `product.deleted`)
- Fast caching layer (Redis) for catalog queries and recommendations
- Variant availability and stock-level tracking
- Search indexing optimization for color, size, category, price, and attributes
- Hybrid sync verification service for validating real-time price and stock prior to cart actions
- Catalog synchronization error handling and sync status monitoring

### Target Release
`v0.4.0`

---

## Sprint 05 — Chatbot & Conversational Search

### Goal
Build the conversational AI shopping engine capable of understanding natural language and dialect queries, performing semantic product searches, maintaining context, and executing Add-to-Cart actions.

### Main Areas
- Conversational session management and short-term message context
- Intent recognition and Named Entity Recognition (NER) for attributes (color, size, price range)
- Arabic language support with native handling of Saudi and Gulf dialects
- Conversational product search with follow-up refinement logic
- Scope boundary enforcement: shopping-focused guardrails and safe redirection
- Escalation engine routing unsupported queries to merchant human support channels
- Salla Add-to-Cart integration with real-time stock verification
- Embedded storefront widget communication layer

### Target Release
`v0.5.0`

---

## Sprint 06 — Analytics & Event Pipeline

### Goal
Capture conversational and shopping events in real-time to compute customer demand intelligence, conversion funnels, and potential lost opportunities.

### Main Areas
- Event-driven analytics pipeline (tracking searches, views, add-to-cart, out-of-scope queries)
- Demand signal extraction: logging unfulfilled searches and missing catalog items
- Missing variant analytics: tracking specific out-of-stock sizes, colors, and models
- Potential Cart Value calculation engine (honest tracking of influenced cart additions)
- Salla order webhook integration (`order.created`, `order.paid`) for conversion attribution
- Realized Value tracking: calculating confirmed sales and conversion rates from assistant interactions
- Aggregated metrics aggregation pipelines for daily, weekly, and custom timeframes

### Target Release
`v0.6.0`

---

## Sprint 07 — Merchant Dashboard API

### Goal
Expose structured analytics, demand insights, and assistant management APIs for the merchant dashboard interface.

### Main Areas
- Overview metrics endpoint (conversations count, searches, products added, cart value)
- Honest ROI reporting endpoints: Potential Cart Value vs. Realized Paid Value
- Top interacting and most frequently added products reporting
- Customer Demand Insights: recurring search keywords and missing product requests
- Potential Lost Opportunities reporting with estimated missed value
- Product availability breakdown: "Product Not Found" vs. "Variant Unavailable"
- Time-series analytics endpoints (today, yesterday, last 7/30 days, custom date range)
- Merchant store configuration endpoints (widget styling, human escalation channels)

### Target Release
`v0.7.0`

---

## Sprint 08 — Production Hardening & Launch

### Goal
Optimize system performance, enforce enterprise security standards, set up production infrastructure, and ensure high availability for launch.

### Main Areas
- Distributed rate limiting and brute-force protection
- Security audit, dependency vulnerability scanning, and OWASP compliance
- Production environment configurations, secret management, and environment isolation
- Database indexing optimization and query performance tuning
- Graceful shutdown handlers and worker queue resilience
- Monitoring, structured application logging, and APM alerting
- End-to-end regression testing and performance/load testing under high concurrency
- Production deployment checklist and Salla App Store submission readiness

### Target Release
`v1.0.0`