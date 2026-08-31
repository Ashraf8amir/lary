# Project Management Guide

## 1. Purpose

This document defines how the project will be managed and developed using GitHub.

It describes:

- Sprint organization
- Issues
- Branches
- Pull Requests
- Labels
- Milestones
- GitHub Project Board
- Releases
- Git Tags
- Versioning
- Definition of Done
- Project development workflow

The goal is to keep development organized, traceable, and easy to maintain as the project grows.

---

## 2. GitHub Project Board

The development lifecycle is tracked visually on the GitHub Project Board using five defined stages:

```text
Backlog ──► Ready ──► In Progress ──► In Review ──► Done
```

### Board Columns

* **Backlog:** Ideas, future enhancements, and scoped requirements that are not yet scheduled for the active Sprint.
* **Ready:** Scoped and refined Issues selected for the active Sprint, with clear acceptance criteria and dependencies resolved.
* **In Progress:** Issues currently undergoing active implementation on a dedicated branch.
* **In Review:** Issues with an open Pull Request undergoing peer code review and automated checks.
* **Done:** Issues whose Pull Requests have been approved, merged, and verified against all acceptance criteria.

---

## 3. Development Lifecycle Flow

Every unit of development must adhere strictly to the following linear progression:

```text
Product Requirement
       ↓
Sprint Planning
       ↓
GitHub Issue Created
       ↓
Labels & Milestone Assigned
       ↓
Moved to Ready
       ↓
Dedicated Branch Created
       ↓
In Progress (Implementation & Local Tests)
       ↓
Pull Request Submitted
       ↓
In Review (Code Review & CI Checks)
       ↓
Merged into Base Branch
       ↓
Moved to Done & Issue Closed
       ↓
Sprint Milestone Completed (100%)
       ↓
Semantic Git Tag Created
       ↓
GitHub Release Published (when applicable)
```

---

## 4. GitHub Issues

Every deliverable, fix, refactoring effort, or documentation change starts as an atomic GitHub Issue.

### Issue Structure Requirements

Each Issue must include:
* **Title:** Structured with standard type prefix (e.g., `[Feature]: Implement Salla OAuth callback`).
* **Description:** Detailed context covering what needs to be built and why.
* **Acceptance Criteria:** Verifiable checkbox list defining the conditions for completion.
* **Branch Name:** Convention-compliant git branch name.
* **Milestone:** Associated Sprint milestone.
* **Labels:** One Type, one Priority, and at least one Area label.
* **Dependencies:** Explicit prerequisite issues (if any).

---

## 5. Issue Types

The project recognizes five functional Issue types:

| Type | Prefix | Description | Example |
| :--- | :--- | :--- | :--- |
| **Feature** | `[Feature]:` | New user-facing or platform capability | `[Feature]: Implement Salla OAuth callback` |
| **Bug** | `[Bug]:` | Defect, unexpected error, or regression | `[Bug]: Fix invalid refresh token handling` |
| **Documentation** | `[Docs]:` | Technical guides, API docs, or READMEs | `[Docs]: Document authentication flow` |
| **Refactor** | `[Refactor]:` | Code restructuring without altering behavior | `[Refactor]: Modularize Salla API client` |
| **Test** | `[Test]:` | Automated unit, integration, or E2E tests | `[Test]: Add Salla OAuth integration tests` |

---

## 6. Branching Strategy

Work is never committed directly to the `main` or `develop` branches. Every Issue must be developed on an isolated branch created from the primary base branch.

### Branch Naming Convention

```text
<type>/<short-description>
```

### Branch Types & Examples

* **Features:** `feature/salla-oauth-callback`, `feature/user-login`, `feature/refresh-token-rotation`
* **Bug Fixes:** `fix/invalid-refresh-token`, `fix/cors-preflight-error`
* **Documentation:** `docs/document-authentication`, `docs/salla-api-guide`
* **Refactoring:** `refactor/modularize-salla-client`, `refactor/exception-filters`
* **Tests:** `test/salla-integration`, `test/auth-e2e-coverage`
* **Maintenance:** `chore/initialize-nestjs-backend`, `chore/configure-environment`

### Branching Rules

* Use lowercase letters only.
* Separate words with hyphens (`-`).
* Keep branch names short, descriptive, and tied to a single Issue.
* Avoid commit mixing across multiple functional concerns.

---

## 7. Label Taxonomy

Labels categorize and filter Issues. Status must **never** be tracked via labels (e.g., no `status:ready`, `status:done`), as state is managed exclusively by the Project Board.

Every Issue must have:
1. Exactly **one** Type label.
2. Exactly **one** Priority label.
3. At least **one** Area label.

### Type Labels

* `type:feature` — New functional capability.
* `type:bug` — Defect or bug fix.
* `type:documentation` — Technical or project documentation.
* `type:refactor` — Code maintenance and architecture refactoring.
* `type:test` — Automated test suites.

### Priority Labels

* `priority:critical` — Blocker or highest urgency requirement.
* `priority:high` — Core milestone deliverable.
* `priority:medium` — Standard priority work.
* `priority:low` — Minor improvement or low urgency item.

### Area Labels

* `area:foundation` — Core framework setup, logging, configuration, health checks.
* `area:auth` — Password hashing, JWT access tokens, refresh tokens, sessions.
* `area:users` — User profiles, accounts, and merchant relationships.
* `area:integration` — Generic integration contracts and architecture.
* `area:salla` — Salla API client, OAuth flow, and merchant webhooks.
* `area:products` — Product catalog synchronization and caching.
* `area:cart` — Cart verification and add-to-cart operations.
* `area:chatbot` — LLM engine, prompt templates, and conversational context.
* `area:analytics` — Demand intelligence, lost opportunities, and conversion metrics.
* `area:dashboard` — Merchant dashboard endpoints and reporting.

---

## 8. Sprint Milestones

Each development Sprint corresponds directly to one GitHub Milestone representing a focused delivery phase.

### Milestone Schedule

* **Sprint 01 — Project Setup & Foundation:** Backend scaffolding, configuration, MongoDB, logging, exception filters, and health checks.
* **Sprint 02 — Salla Integration & OAuth:** Salla application setup, OAuth authorization, code exchange, store persistence, and API client.
* **Sprint 03 — Authentication & Users:** User accounts, password management, JWT authentication, refresh token rotation, and security controls.
* **Sprint 04 — Product Synchronization:** Catalog ingestion, caching, variant indexing, and Salla webhook updates.
* **Sprint 05 — Chatbot Core:** Conversational engine, natural language product search, scope boundaries, and dialect support.
* **Sprint 06 — Analytics & Events:** Demand tracking, lost opportunities engine, potential cart value, and event pipelines.
* **Sprint 07 — Merchant Dashboard:** Merchant dashboard APIs, conversion tracking, reporting, and metrics visualization.
* **Sprint 08 — Production Hardening:** Rate limiting, security audits, performance profiling, and production deployment readiness.

---

## 9. Pull Requests

Every completed Issue branch results in a single Pull Request (PR) targeted at the base development branch.

### Pull Request Rules

* Link to the related Issue using closing keywords (`Closes #123`).
* Use the official repository Pull Request template.
* Include an itemized summary of changes and explicit validation steps.
* Ensure all unit and integration tests pass cleanly.
* Obtain code review approval before merging.
* Merges should be handled cleanly (Squash and Merge or Rebase and Merge per repository setting).

### Pull Request Title Convention

Follow the Conventional Commits specification:

```text
<type>: <short description>
```

#### Examples

* `feat: initialize NestJS backend`
* `feat: implement Salla OAuth callback`
* `feat: add merchant JWT authentication`
* `fix: handle expired Salla access token`
* `refactor: clean up user repository queries`
* `docs: add project management guide`

---

## 10. Commit Standards

Commits must be atomic, focused, and follow standard commit conventions:

```text
<type>: <concise description>
```

### Examples

* `feat: initialize nestjs project`
* `feat: configure mongoose connection`
* `feat: add salla oauth authorization endpoint`
* `fix: prevent duplicate user registration`
* `refactor: extract token verification to security service`
* `docs: document salla integration architecture`

---

## 11. Sprint Planning & Execution Workflow

### At Sprint Kickoff

1. Validate the Sprint Goal and finalize scoped deliverables.
2. Verify all Sprint Issues are created and assigned to the active Milestone.
3. Confirm issue dependencies and priority classifications.
4. Move target Issues from **Backlog** to **Ready** on the Project Board.

### During Active Sprint

1. Pick an Issue from **Ready** and move it to **In Progress**.
2. Create the branch following the `<type>/<short-description>` pattern.
3. Write clean code, adhere to project conventions, and implement automated tests.
4. Open a Pull Request referencing the Issue and move card to **In Review**.
5. Address code review feedback.
6. Merge PR upon approval; card automatically moves to **Done** and Issue closes.

### At Sprint Closure

1. Confirm all scoped Issues in the Milestone are in **Done**.
2. Close the Sprint Milestone (100% completion).
3. Cut a semantic Git Tag representing the release point.
4. Publish a GitHub Release containing changelogs and deliverables (when applicable).

---

## 12. Release & Versioning Strategy

The project uses Semantic Versioning (`MAJOR.MINOR.PATCH`). Milestones and Releases serve distinct purposes:
* **Milestone:** Tracks the delivery progress of a Sprint phase.
* **Release:** Publishes a stable, verified product version checkpoint.

### Version Formats

* **MAJOR (v1.0.0):** Production-ready milestone or breaking architecture changes.
* **MINOR (v0.x.0):** Significant functional milestones completed at the end of key Sprints.
* **PATCH (v0.x.1):** Critical hotfixes, minor patches, and urgent bug repairs.

### Initial Release Roadmap

```text
Sprint 01 Complete  ──►  Release v0.1.0 (Foundation)
Sprint 02 Complete  ──►  Release v0.2.0 (Salla OAuth)
Sprint 03 Complete  ──►  Release v0.3.0 (Authentication & Users)
Sprint 04 Complete  ──►  Release v0.4.0 (Product Sync)
Sprint 05 Complete  ──►  Release v0.5.0 (Chatbot Core)
Sprint 06 Complete  ──►  Release v0.6.0 (Analytics & Events)
Sprint 07 Complete  ──►  Release v0.7.0 (Merchant Dashboard)
Sprint 08 Complete  ──►  Release v1.0.0 (Production Release)
```

---

## 13. Definition of Done (DoD)

### For an Individual Issue

- [ ] Implementation satisfies all Acceptance Criteria.
- [ ] Automated tests (unit/integration) are written and passing.
- [ ] Code follows architectural patterns, TypeScript types, and linting rules.
- [ ] Pull Request is reviewed and approved.
- [ ] PR is merged into base branch without merge conflicts.
- [ ] Related GitHub Issue is closed and card is in **Done**.

### For a Sprint Milestone

- [ ] Sprint Goal is fully achieved.
- [ ] All scoped Issues are marked **Done**.
- [ ] Test suites execute 100% green without regressions.
- [ ] Sprint technical documentation is merged and accurate.
- [ ] Milestone is closed (100%).
- [ ] Corresponding Git Tag and GitHub Release are published.

---

## 14. Golden Rules of Engineering Workflow

1. **No Untracked Work:** Never start development without an associated GitHub Issue.
2. **Atomic Issues:** Keep Issues small, focused, and independently reviewable.
3. **Protected Main:** Never commit or push directly to `main` or `develop`.
4. **Single-Branch per Issue:** Every implementation task must live on its own isolated branch.
5. **No Bloated PRs:** Keep Pull Requests strictly focused on their specific Issue scope.
6. **No Label Statuses:** Manage workflow state exclusively through the Project Board columns.