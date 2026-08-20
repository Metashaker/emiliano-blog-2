# Blog Platform — Agent Implementation Guide

> Working codename: **Aether** (space-Greek theme; placeholder, rename freely).
> This document is the source of truth for an implementing agent. Follow phases in order. Do not start a phase until the previous phase's **Acceptance Criteria** all pass.

---

## 0. System context & principles

A design-forward, bilingual (es/en) personal blog with a "publish once, syndicate everywhere" model, growing into a paid membership whose subscription also unlocks separate AI products.

### The four systems and their single responsibilities

| System | Role | Source of truth for | Never does |
|---|---|---|---|
| **Ghost** (self-hosted) | Headless CMS + authoring | Post content, tags, authors, `visibility` flag | Render the public site; own billing/auth |
| **Astro** | Frontend (i18n, hybrid SSR) | Presentation, routing, the paywall gate | Store business data; hold Stripe secrets in client |
| **Rails** | Backend hub (API + admin + jobs) | Identity, entitlements, syndication state | Render the blog; duplicate CMS content |
| **Stripe** | Billing | Subscriptions & payment, entitlement *truth* | — |

### Non-negotiable invariants (apply to every phase)

1. **Gate on the server.** Premium HTML must never reach a non-entitled client. No CSS-hiding of paid content.
2. **Canonical everywhere.** Every syndicated copy sets `canonical_url` back to the Aether post. The blog is always canonical.
3. **Rails is the identity provider.** Auth issues verifiable tokens (JWT / OAuth2), never cookies-only — so phase 3 products can trust it without a rewrite.
4. **Ghost stays vanilla.** Custom billing/auth/syndication logic lives in Rails, never as Ghost forks or plugins.
5. **One entitlement contract.** Astro and every future AI product ask the *same* Rails endpoint "is this user entitled?". Business logic is never reimplemented on the JS side.
6. **Modular monolith.** Rails starts as one app with clean domain namespaces (`Identity`, `Billing`, `Syndication`) so services extract cleanly later.

### Target stack (pinned)

- **Ghost** headless, accessed via `@tryghost/content-api` (Content API, read-only).
- **Astro** (TypeScript) with `@astrojs/node` (or Cloudflare/Vercel adapter) for hybrid SSR, Tailwind, MDX, and Astro native i18n routing. React only as islands.
- **Ruby on Rails 8** — Solid Queue (jobs), built-in auth generator or Devise, `stripe` gem. API + minimal admin.
- **Postgres** (Rails DB).
- Deploy: Astro on Cloudflare Pages/Netlify/Vercel; Ghost + Rails + Postgres on your existing self-host (Docker Compose recommended).

---

## Phase 1 — Free bilingual blog + syndication adapters

**Goal:** A fast, beautiful, statically-generated bilingual blog reading from Ghost, that automatically syndicates new posts outward with canonical URLs. No auth, no payments.

### Scope
- Astro site pulling all published posts from Ghost via Content API at build time.
- **i18n (es/en):** locale-prefixed routes (`/en/…`, `/es/…`), a language switcher, localized UI strings, and a per-post translation strategy (see below). Default locale + fallback defined.
- The **space-Greek aesthetic** design system (tokens, type scale, WebGL/Canvas starfield as a single hydrated island, motion that respects `prefers-reduced-motion`).
- **Rails app introduced here, syndication only.** No `Identity`/`Billing` yet.
- **Ghost publish webhook → Rails** triggers (a) a frontend rebuild/deploy and (b) syndication jobs.
- **Syndication adapters** behind a common interface (dev.to, Hashnode as automated; Medium/Substack as assisted/RSS per earlier decision).
- RSS feeds per locale, sitemap, SEO/OpenGraph, newsletter signup (Ghost Members API subscribe-only, free tier — email capture without paywall).

### i18n content strategy
- UI strings: Astro i18n dictionaries (`src/i18n/en.json`, `src/i18n/es.json`).
- Post translations: tag convention in Ghost. A post carries a locale tag (`#lang-en` / `#lang-es`) and a shared `#slug-group:<id>` tag (or internal tag) linking translations. Astro groups them so the switcher links a post to its counterpart; if no translation exists, switcher falls back to the locale's index.

### Syndication adapter interface (Ruby, in Rails)
```ruby
# app/services/syndication/adapter.rb
module Syndication
  class Adapter
    # Returns a Symbol identifying the platform, e.g. :dev_to
    def platform = raise NotImplementedError

    # Declares what the platform supports so the dispatcher can decide flow.
    # e.g. { api: true, canonical_url: true, update: true }  (dev.to / Hashnode)
    #      { api: false, canonical_url: true, update: false } (medium/substack -> assisted/RSS)
    def capabilities = raise NotImplementedError

    # Publish a canonical post. Must set canonical_url to the Aether URL.
    # Returns a SyndicationResult (external_id, url, status).
    def publish(post) = raise NotImplementedError

    # Update an already-syndicated post if the platform supports it.
    def update(post, external_ref) = raise NotImplementedError
  end
end
```
- A `SyndicationDispatcher` fans a published post out to enabled adapters as Solid Queue jobs.
- Persist a `Syndication::Record` (post_id, platform, external_id, external_url, status, synced_at) so updates target the right remote post and the admin can show status. Idempotent: re-running a publish updates instead of duplicating.
- API-less platforms (Medium/Substack): the "adapter" produces a ready-to-paste payload + marks the record `assisted_pending`; RSS feed is the automated fallback.

### Deliverables
- [ ] Monorepo scaffolded (see Appendix layout).
- [ ] Astro reads Ghost Content API; post list + post detail render for both locales.
- [ ] i18n routing, language switcher, translation grouping, localized RSS + sitemap.
- [ ] Design system implemented; starfield island; reduced-motion honored; Lighthouse a11y ≥ 95.
- [ ] Rails app with `Syndication` domain, adapter interface, dev.to + Hashnode adapters, dispatcher, jobs, records, admin list view.
- [ ] Ghost webhook → Rails endpoint → deploy hook + syndication fan-out.
- [ ] Free newsletter signup wired to Ghost Members API.

### Acceptance criteria
- Publishing a post in Ghost results, with no manual step, in: the post live on the static site (both locales if translated) after an automatic rebuild, and syndicated to dev.to + Hashnode with `canonical_url` pointing to Aether.
- Editing a post re-syndicates as an update (no duplicate remote posts).
- Site scores green on Lighthouse performance/SEO/a11y; no horizontal scroll; works with JS disabled for reading.
- No auth or payment code exists yet.

### Out of scope
Stripe, login, gated content, OAuth. Do not scaffold them.

---

## Phase 2 — Paid tier: Stripe + server-side gated posts

**Goal:** Introduce membership. Some posts are premium; only paying members receive their content. Billing truth lives in Stripe; Astro gates via a Rails entitlement check.

### Scope
- **Rails `Identity` domain:** user accounts, token-based auth (JWT or OAuth2/Doorkeeper), magic-link or password login. Rails is the IdP.
- **Rails `Billing` domain:** Stripe integration. Use **Stripe Entitlements** — define a `premium` feature on the price; treat a customer's *active entitlements* as truth. Handle Stripe webhooks (`customer.subscription.*`, entitlement updates) to keep local mirror fresh.
- **Entitlement API** consumed by Astro SSR (contract below).
- **Astro hybrid SSR gating:** premium routes render on-demand. Server fetches the member's entitlement from Rails; entitled → fetch + render full Ghost content; not entitled → render teaser + paywall/CTA. Public posts stay static.
- Premium marker: use Ghost's `visibility: paid` flag as the content marker; Rails/Stripe enforce it.
- Account UI: sign in, manage subscription (Stripe Customer Portal), see membership status. Bilingual.

### Entitlement API contract (Rails → Astro)
```
GET /api/v1/entitlements
Authorization: Bearer <access_token>        # token minted by Rails at login

200 OK
{
  "user_id": "usr_123",
  "entitlements": ["premium"],              # active feature keys from Stripe
  "expires_at": "2026-09-01T00:00:00Z"      # for caching; re-check after
}
```
- Astro caches the result for the request lifecycle only; never trusts a client-supplied entitlement.
- A signed short-lived JWT MAY carry `entitlements` as claims to save a round-trip; Rails remains the signer and source of truth.

### Deliverables
- [ ] Rails `Identity` (accounts + token auth as IdP) and `Billing` (Stripe + Entitlements + webhooks).
- [ ] `GET /api/v1/entitlements` implemented, authenticated, tested.
- [ ] Astro auth flow (login/logout/session) + hybrid SSR gating on premium routes.
- [ ] Teaser + paywall UI; Stripe Checkout + Customer Portal wired; bilingual.
- [ ] Webhook-driven entitlement mirror; subscription lifecycle handled (upgrade/cancel/expire).

### Acceptance criteria
- A non-member requesting a premium post receives only the teaser HTML over the wire (verify via raw response — no premium body present).
- Completing Checkout grants access on next request without redeploy.
- Cancelling revokes access after the period end per Stripe entitlement state.
- Public/free posts remain statically served and unaffected.

### Out of scope
Multi-product SSO consumption (that's phase 3). Build auth *as if* other products will consume it, but don't integrate any yet.

---

## Phase 3 — Shared identity & entitlements across AI products

**Goal:** Other (AI) products authenticate against Rails and honor the *same* subscription entitlement — no new billing, no new login.

### Scope
- Promote Rails auth to a proper **OAuth2 / OIDC provider** (Doorkeeper) so external products do the standard authorization-code/PKCE flow.
- Publish the **entitlement contract** as a stable, versioned public API (same shape as phase 2) that products call server-side.
- Optional: introduce feature keys per product (e.g. `product:spiral`, `product:cora`) alongside `premium`, mapped from Stripe features, so tiers can bundle specific products.
- Extract `Identity` / `Billing` into a service if scale demands (the namespaces from phase 0 make this mechanical). Not required if the monolith suffices.
- SSO session sharing / central login page usable by blog + products.

### Deliverables
- [ ] OAuth2/OIDC provider live; at least one AI product integrated end-to-end.
- [ ] Versioned entitlements API with per-product feature keys.
- [ ] Central login; token refresh; revocation.
- [ ] Docs for onboarding a new product (client registration, scopes, entitlement checks).

### Acceptance criteria
- A user logs in once and is recognized across the blog and the product.
- A single Stripe subscription unlocks premium posts *and* the product's gated features.
- Adding a new product requires only client registration + entitlement checks — no changes to billing or the blog.

---

## Cross-cutting conventions

- **Secrets:** never in the Astro client bundle. Stripe secret + Ghost Admin keys live only in Rails; Ghost *Content* API key (read-only) may be used at build time by Astro.
- **Environments:** each system gets staging + prod; Stripe test mode until phase 2 sign-off.
- **Testing:** Rails request specs for entitlement/webhook logic; Astro integration test asserting premium body is absent for anonymous requests (the security invariant).
- **Observability:** log every syndication result and every webhook; admin surfaces both.

## Appendix — suggested repo layout
```
aether/
  apps/
    web/            # Astro frontend (i18n, hybrid SSR, design system)
    api/            # Rails 8 backend (Identity, Billing, Syndication)
  packages/
    contracts/      # shared types/JSON schemas for the entitlement API
  infra/
    docker-compose.yml   # Ghost, Rails, Postgres for self-host
  docs/
    IMPLEMENTATION_GUIDE.md
    architecture.html
```
```
apps/api/app/domains/     # Identity/  Billing/  Syndication/  (modular monolith)
apps/web/src/
  i18n/            # en.json, es.json
  pages/[lang]/    # locale-prefixed routes
  islands/         # Starfield.tsx and other hydrated bits
  lib/ghost.ts     # Content API client
  lib/entitlements.ts  # server-only Rails entitlement client (phase 2)
```
