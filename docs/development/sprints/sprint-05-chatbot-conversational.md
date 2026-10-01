# Sprint 05 — Conversational AI Assistant

## Sprint Goal

Build the first working version of the AI shopping assistant: a provider-agnostic chat orchestration layer that lets a customer converse in Gulf Arabic dialect with the store's product catalog through tool calling, returning both a natural-language reply and structured product cards for the storefront widget to render.

By the end of this Sprint, the platform should be able to:

1. Receive a customer chat message scoped to a store and conversation.
2. Maintain short-lived, per-conversation memory without any cross-session persistence.
3. Let the model request a product search against the store's own synced catalog (never Salla directly).
4. Return a unified response shape the storefront widget can render as text and/or product cards, with cart actions handled entirely client-side.
5. Swap the underlying LLM vendor later by adding one new provider class, not by rewriting orchestration logic.

---

# Milestone

`Sprint 05 — Conversational AI Assistant`

---

# Sprint Scope

## Included

- Provider-agnostic LLM abstraction (no vendor SDK leaking into orchestration logic)
- Gemini provider implementation (`@google/genai`)
- Tool-calling loop with a bounded round limit
- `search_products` tool, backed by the existing Product/ProductVariant catalog
- Redis-backed short-lived conversation session (no long-term memory)
- Dynamic system prompt per store (dialect, refusal rules, escalation line)
- Widget Settings extended with a support-contact field for escalation
- Public, unauthenticated chat endpoint for storefront widget use

---

# Architecture

Customer (storefront widget)
↓
┌─────────────────────────────┐
│ POST /chat/message (public) │
└──────────┬──────────────────┘
↓
┌─────────────────────────────┐
│ ChatService (orchestrator) │
│ - load session history │
│ - load widget settings │
│ - build system prompt │
└──────────┬──────────────────┘
↓
┌─────────────────────────────┐
│ LLM_PROVIDER (interface) │
│ → GeminiProvider │
│ (@google/genai) │
└──────────┬──────────────────┘
↓ tool call requested
┌─────────────────────────────┐
│ ToolExecutorService │
│ → search_products │
│ → ProductsService │
│ .searchForChat() │
└──────────┬──────────────────┘
↓
┌─────────────────────────────┐
│ MongoDB │
│ Products / ProductVariants │
│ (already synced from Salla) │
└─────────────────────────────┘

Response: { replyText, cards[] } → storefront widget
(cart additions happen client-side via salla.cart.addItem(), never through this backend)

---

# Issue List

## Issue 01 — Implement Conversational Chat Module (MVP)

### Issue (Feature Template)

**Title:** `[Feature]: Implement conversational AI chat module with tool-calling product search`
**Labels:** `type:feature`, `priority:critical`, `area:chat`

**Description:**
Implement the first end-to-end version of the AI shopping assistant. A customer's message is sent to an LLM (Gemini, via a vendor-agnostic provider interface) alongside a store-specific system prompt and a `search_products` tool definition. The model decides whether to call the tool; if it does, the backend executes the search against the store's own synced catalog and returns the result to the model for a natural-language reply. The final response combines the model's text with any matched products as display-ready cards. Conversation memory is short-lived (Redis, TTL-based) and scoped to a single browsing session — no cross-session personalization.

**Acceptance Criteria:**

- [ ] `LlmProvider` interface defined (`LlmMessage`, `LlmTool`, `LlmToolCallRequest`, `LlmResponse`) with zero vendor-specific types leaking into `ChatService`.
- [ ] `GeminiProvider` implements `LlmProvider` using `@google/genai` (not the deprecated `@google/generative-ai`), registered behind an `LLM_PROVIDER` injection token so swapping vendors means adding one class and changing one binding.
- [ ] `search_products` tool defined with a JSON-Schema-shaped parameter set (`query`, `color`, `size`, `maxPrice`), with a description precise enough to distinguish direct requests from indirect ones (e.g. gift requests) without over-triggering on unrelated messages.
- [ ] `ProductCard` interface lives in `modules/products/`, not `modules/chat/` — chat depends on products, never the reverse.
- [ ] `ProductsService.searchForChat()` added: case-insensitive substring match on product name (regex-escaped against injection), scoped to non-hidden products, resolves the best-matching variant by color/size with a fallback to the first variant rather than dropping a product entirely.
- [ ] `ToolExecutorService` separates the tool's plain-text summary (fed back to the model) from its raw `ProductCard[]` (fed straight into the final response, untouched by the model).
- [ ] `ConversationSessionService` stores per-conversation message history in Redis via the existing `CacheService`, keyed by the frontend-issued `conversationId`, expiring after a configurable idle TTL. Only the user message and final assistant reply are persisted per turn — intermediate tool round-trips are not replayed as future context.
- [ ] `SystemPromptBuilder` generates a per-store prompt covering: Gulf Arabic dialect tone, refusal of out-of-scope requests, no fabricating product data, de-escalation of abusive language, and an escalation line sourced from `WidgetSettings.supportContactInfo`.
- [ ] `ChatService.handleMessage()` implements the tool-calling loop with a hard cap (`MAX_TOOL_ROUNDS`) to guard against a model that never stops requesting tools.
- [ ] `POST /chat/message` (public, no auth) accepts `{ conversationId, storeId, message }`, validated via `SendMessageDto`.
- [ ] Response shape is `{ replyText: string, cards: ProductCard[] }` — no `suggestedActions`; any `card` with `isAvailable: true` is treated by the frontend as addable to cart via `salla.cart.addItem()`, with no backend involvement in the cart action itself.

**Branch Name:**
`feature/conversational-chat-module`

**Milestone:**
`Sprint 05 — Conversational AI Assistant`

**Dependencies:**

- Sprint 04 — Product Synchronization (`Product`/`ProductVariant` schemas and data)
- Widget Settings module (`WidgetSettings`, `StoresService.assertOwnership`)
- Existing `CacheService` (Redis-backed get/set)

**Notes:**
The exact shape Gemini expects for a tool's result being fed back into the conversation (the `functionResponse` part nesting) was not fully confirmed against a live call at design time — verify against the installed `@google/genai` version and adjust `GeminiProvider.toGeminiContents()`/`parseGeminiResponse()` if the SDK rejects the assumed shape. `parseGeminiResponse()` intentionally types the raw SDK response as `any` pending that verification, to avoid asserting an unconfirmed shape as fact.

**Plan Commit:**

- Commit 1: `feat(chat): add chat module config and provider-agnostic interfaces`
- Commit 2: `feat(chat): add GeminiProvider implementing the generic LlmProvider contract`
- Commit 3: `feat(chat,products): add search_products tool execution path`
- Commit 4: `feat(widget-settings,chat): add support contact field + system prompt + session storage`
- Commit 5: `fix(chat): use existing CacheService instead of a guessed RedisService shape`
- Commit 6: `feat(chat): add ChatService orchestration loop + controller`

---

### Pull Request 01

**Title:** `feat: implement conversational AI chat module (MVP)`

**Summary:**
Adds the first working AI shopping assistant: a vendor-agnostic tool-calling chat loop backed by Gemini, searching the store's already-synced product catalog, and returning a response shape the storefront widget renders as text and product cards.

**Related Issue:**
Closes #23

**Changes:**

- Add `src/modules/chat/config/chat.config.ts`.
- Add `src/modules/chat/interfaces/llm-provider.interface.ts`.
- Add `src/modules/chat/interfaces/chat-response.interface.ts`.
- Add `src/modules/chat/providers/gemini.provider.ts`.
- Add `src/modules/chat/tools/tool-definitions.ts`.
- Add `src/modules/chat/tools/tool-executor.service.ts`.
- Add `src/modules/chat/tools/tool-call-context.interface.ts`.
- Add `src/modules/chat/prompts/system-prompt.builder.ts`.
- Add `src/modules/chat/session/conversation-session.service.ts`.
- Add `src/modules/chat/dtos/send-message.dto.ts`.
- Add `src/modules/chat/chat.service.ts`.
- Add `src/modules/chat/chat.controller.ts`.
- Add `src/modules/chat/chat.module.ts`.
- Add `src/modules/products/interfaces/product-card.interface.ts`.
- Add `ProductsRepository.searchForChat()` / `ProductsService.searchForChat()`.
- Add `WidgetSettings.supportContactInfo` field + `WidgetSettingsService.getForSystemPrompt()`.

**Acceptance Criteria:**

- [ ] All requirements from the related Issue are satisfied.
- [ ] No unrelated changes are included.
- [ ] Relevant tests/checks have been completed.

**Validation:**
Sent a live message through `POST /chat/message` against a real Gemini API key and verified: a direct product request triggers `search_products` and returns matching cards; an unrelated request (e.g. asking for code) is politely refused without a tool call; a search with no matches returns a plain "not found" reply with an empty `cards` array; conversation context (e.g. a follow-up "make it black") correctly resolves against the prior turn within the same `conversationId`; session expires after the configured idle TTL.

**Checklist:**

- [ ] Code follows project conventions.
- [ ] No secrets or sensitive information are committed.
- [ ] Tests were added/updated where applicable.
- [ ] Documentation was updated if needed.
- [ ] The PR is focused on the related Issue.

---

## Issue 02 — Chat Experience Hardening & Improvements (Backlog)

### Issue (Feature Template)

**Title:** `[Improvement]: Harden and extend the conversational chat module post-MVP`
**Labels:** `type:improvement`, `priority:medium`, `area:chat`

**Description:**
The MVP chat module (Issue 01) intentionally deferred several concerns to keep the first working version small and testable. This issue tracks the follow-up work once the MVP is validated with real traffic: a dedicated safety/moderation layer independent of prompt instructions, response streaming, richer tool coverage, persistent conversation history for analytics, and protecting the public chat endpoint from abuse.

**Acceptance Criteria:**

- [ ] A moderation/safety check runs independently of the model's own prompt-level instructions, to catch genuinely harmful input (not just impoliteness) before or alongside sending it to the LLM, with flagged conversations logged for review.
- [ ] `POST /chat/message` has an appropriate rate limit (endpoint-scoped `@Throttle`, following the same pattern as the Salla embedded-session endpoint) since it is fully public and unauthenticated.
- [ ] Evaluate whether `search_products` alone is sufficient or whether dedicated tools (e.g. `get_product_variants`, `check_variant_availability`) improve accuracy, based on real usage rather than upfront assumption.
- [ ] Escalation to human support becomes an interactive action (e.g. a WhatsApp link/button) rather than plain text, once a decision is made on supported channels — likely extending `WidgetSettings` with a structured `escalationChannel`/`escalationUrl` pair instead of a single free-text field.
- [ ] Persistent conversation history (MongoDB) is added alongside the existing Redis session store, for post-hoc review and future analytics — not a replacement for the Redis TTL-based session memory, which remains the source of in-conversation context.
- [ ] Failed/empty `search_products` results are recorded against the existing `ProductDemand` concept once the analytics module exists, so merchants can see what customers searched for and didn't find.
- [ ] `GeminiProvider.parseGeminiResponse()`'s `any`-typed response is replaced with a proper type once the real `@google/genai` response shape is confirmed against production traffic.
- [ ] Evaluate response streaming (token-by-token) for perceived responsiveness, weighed against the added complexity of streaming through a tool-calling loop (a response isn't a simple continuous stream when a tool call interrupts it mid-turn).
- [ ] Arabic search quality is revisited beyond plain substring matching (e.g. embeddings/vector search) if the regex-based approach proves insufficient for dialect variation, typos, or synonyms in real usage.

**Branch Name:**
`improvement/chat-hardening`

**Milestone:**
`Sprint 06 — Chat Hardening & Analytics` _(tentative — to be scheduled after MVP validation)_

**Dependencies:**

- Issue 01 — Implement Conversational Chat Module (MVP)
- Analytics module (`DailyAnalytics`/`ProductAnalytics`/`ProductDemand`) — not yet started, referenced here as a future dependency for demand tracking

**Notes:**
None of these items block the MVP going live — they are explicitly deferred, not forgotten, per the design discussion in Sprint 05. Prioritization within this backlog should be driven by what real customer conversations actually surface as gaps, rather than built upfront on assumption.

**Plan Commit:**
_(to be broken down once prioritized — this issue is a backlog container, not a single implementable unit of work)_

---

### Pull Request 02

_(Not applicable yet — this issue tracks backlog items to be split into individual, separately-scoped PRs once scheduled.)_

---

# Release

## `v0.5.0` — Conversational AI Assistant (MVP)

The platform can now hold a real, tool-calling conversation with customers in Gulf Arabic dialect, searching the store's own synced product catalog and returning results as ready-to-render product cards — without any hard dependency on a single AI vendor.

### Highlights

- **Vendor-agnostic LLM layer** — swapping providers later means adding one class, not rewriting the assistant.
- **Tool-calling product search** — the model never touches the database directly; it requests, the backend executes, against data already kept fresh by the Sprint 04 sync pipeline.
- **Session-scoped memory only** — short-lived Redis history per conversation, with no cross-visit personalization, matching the product's privacy stance.
- **Cart actions stay client-side** — `salla.cart.addItem()` is called directly by the storefront widget; this backend never touches a customer's real cart.
- **Per-store customization** — bot name and escalation contact are read from the same `WidgetSettings` a merchant already configures for the widget's appearance.
