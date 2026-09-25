# Zeyoo Web — Implementation Plan

**Repo:** `zeyoo-fe`
**Scope:** Responsive web application for the Zeyoo creator-marketing product — **brand**, **creator**, and **admin** surfaces in one Next.js codebase, role-gated.
**Architecture:** **Single Next.js (App Router) application** — one deployable, three role-scoped experiences sharing a design system and a generated API client.
**Status:** Draft for review · Last updated 2026-09-22

> Companion documents: `../Zeyoo_System_Design.md` (whole-system design) and `../zeyoo-be/IMPLEMENTATION_PLAN.md` (backend). This plan follows the backend plan's pragmatic posture: the web app is **contract-first** — it consumes a typed SDK generated from the backend's committed `openapi.json`, never shared source. Admin ships **in this repo**, isolated by RBAC and route groups, not by a separate app (System Design §5.1–5.2).

---

## 1. Guiding decisions

| Concern | Decision | Rationale |
|---|---|---|
| Deployment unit | **Single Next.js 15 app (App Router)** | One thing to build, deploy, and trace. Brand/creator/admin are route groups, not separate apps. |
| Rendering | **Server Components by default; Client Components at the interactive leaves** | Fast first paint, less JS shipped; data-heavy dashboards stream from the server. |
| Admin console | **In-repo, role-gated route group** `(admin)` | Reuses the design system and auth session; separated by RBAC + route guards, not by repository (System Design §5.2). |
| API access | **Generated TypeScript SDK from backend `openapi.json`** (published to private npm) consumed as a semver dependency | No hand-written fetch types, no drift; breaking changes surface as version bumps (System Design §3). |
| Server state | **TanStack Query** over the generated SDK | Caching, revalidation, optimistic updates, request dedup — the right tool for API state. |
| Client state | **Zustand** for local UI state only | Server state lives in Query; Zustand holds ephemeral UI (modals, wizards, filters). |
| Forms | **react-hook-form + Zod**, schemas mirrored from the contract | One validation story, shared resolver, typed to the SDK DTOs. |
| Styling | **Tailwind CSS + shadcn/ui (Radix primitives)** compiled into a Zeyoo design system | Accessible primitives, fast iteration, faithful to any client-supplied UI (contract §1). |
| i18n / RTL | **`next-intl`, English + Arabic with full RTL** | Contract §1.7. Direction-aware layout via logical CSS properties + `dir` on `<html>`. |
| Money display | **Format-only from server truth; integer minor units + ISO currency** | The ledger is authoritative (contract §1.5); the client never computes earnings, only renders them. |
| Realtime | **Socket.IO client → backend gateway** | Submission status, earnings, fraud alerts pushed live (contract §1.6, backend §8). |
| Auth | **In-house JWT** — short-lived access token (memory) + rotating refresh token (httpOnly cookie), silent refresh | Matches backend in-house auth; social login (Google/Apple), enterprise SAML/OIDC later, all via backend redirect flows. |
| Payments | **Stripe.js — hosted Checkout + Connect redirects; embedded Elements only where hosted won't do** | PCI stays with Stripe; the app never touches card data (contract §1.5). |

**What we are explicitly NOT doing now:** a separate admin repo, a hand-maintained API type layer, a bespoke component library from scratch, client-side money math, or a global Redux store. These are noted where relevant as non-goals, not built.

---

## 2. Technology stack

- **Runtime/framework:** Node.js 22 LTS, **Next.js 15 (App Router) + React 19**, TypeScript (strict).
- **UI:** Tailwind CSS 4, **shadcn/ui** (Radix), `lucide-react` icons, `tailwindcss-logical` (or logical properties) for RTL.
- **Server state:** **TanStack Query 5** wrapping the generated SDK; **TanStack Table** for dense admin grids.
- **Client state:** **Zustand** (UI-only slices).
- **Forms/validation:** **react-hook-form** + **Zod** (`@hookform/resolvers`), DTOs from the generated client.
- **API client:** SDK generated from `openapi.json` (e.g. `openapi-typescript` + `openapi-fetch`, or Orval + Query hooks), published to the private registry.
- **i18n:** **next-intl** (EN + AR/RTL), locale-aware `Intl` formatting for currency/dates/numerals.
- **Realtime:** **socket.io-client** with a typed event map mirrored from the backend gateway.
- **Payments:** **@stripe/stripe-js** + **@stripe/react-stripe-js** (Elements where embedded flows are needed).
- **Charts/reports:** Recharts (or visx) for dashboards; client-triggered download of server-generated reports (contract §1.2).
- **Auth glue:** thin token/refresh layer + `middleware.ts` route guards; OAuth/SSO handled by backend redirects.
- **Observability:** Sentry (browser), OpenTelemetry web tracing, PostHog product analytics.
- **Testing:** Vitest + React Testing Library (unit), Playwright (e2e), MSW (mock the SDK in component tests), Storybook + a11y addon for the design system.
- **Tooling:** pnpm, ESLint (+ import/boundary rules), Prettier, Husky + lint-staged.

---

## 3. Runtime topology

```
                 ┌───────────────────────────────────────┐
   Browser  ───▶ │           Next.js app (Vercel)         │
  (brand /       │  Server Components  → render on server │
   creator /     │  Route handlers/BFF → attach auth,     │
   admin)        │                       proxy realtime   │
                 │  Client Components   → TanStack Query   │
                 └───────────────┬───────────────┬────────┘
                                 │ REST /v1       │ WSS
                                 │ (generated SDK)│ (socket.io)
                                 ▼                ▼
                 ┌───────────────────────────────────────┐
                 │        zeyoo-be  API + WS gateway       │
                 └───────────────────────────────────────┘
                                 ▲
                    Stripe.js redirects (Checkout / Connect)
                    handled browser ⇄ Stripe directly
```

- **One codebase, three audiences:** route groups `(brand)`, `(creator)`, `(admin)` share layouts, the design system, and the auth session; access is decided by role + route guard.
- **Thin BFF layer:** Next.js route handlers exist only to keep the access token out of client JS (httpOnly refresh cookie, silent renew) and to proxy anything that needs a server secret — business logic stays in the backend.

---

## 4. Feature map (surfaces → contract sections)

Each surface is a route group; features map to the same contract sections the backend plan implements.

| Surface | Route group | Key features (contract §) |
|---|---|---|
| **Brand** | `(brand)` | Org/team management, campaign CRUD + publish + invite (§1.2), creator discovery/search, application + content review, spend/earnings tracking with audit, downloadable reports, AI brief drafting |
| **Creator** | `(creator)` | Profile + identity verification (Stripe Identity), social connect, discovery/invites, submissions + status workflow, earnings + payout-hold visibility, withdrawals, disputes/appeals, AI content assistant (§1.3) |
| **Admin** | `(admin)` | Manage brands/creators/campaigns, payout review + hold/release, flagged-activity queues with corrective audit, settings (categories, rates) (§1.4) |
| **Shared** | `(auth)`, `(public)` | Login/register, password reset, email verify, social/SSO redirects, legal/help static content (§1.6), locale switch (§1.7) |

**Cross-cutting (not a surface):** design system, generated API/query hooks, auth/session, i18n/RTL, realtime, money/currency formatting, analytics, error boundaries.

---

## 5. Proposed folder structure

```
zeyoo-fe/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                 # root: providers, dir/lang, theme
│  │  ├─ middleware.ts              # auth + role route guards, locale detect
│  │  ├─ (public)/                  # marketing, legal/help (§1.6)
│  │  ├─ (auth)/                    # login, register, reset, verify, SSO callback
│  │  ├─ (brand)/                   # brand app shell + routes (§1.2)
│  │  ├─ (creator)/                 # creator app shell + routes (§1.3)
│  │  ├─ (admin)/                   # admin console, role-gated (§1.4)
│  │  └─ api/                       # BFF route handlers: token refresh, secret proxy
│  │
│  ├─ features/                     # feature-sliced domain UI (the app's substance)
│  │  ├─ campaigns/                 # components, hooks, schemas per feature
│  │  ├─ applications/
│  │  ├─ submissions/
│  │  ├─ payments/                  # funding (Checkout), withdrawals, ledger views
│  │  ├─ earnings/
│  │  ├─ discovery/                 # creator/campaign search + filters
│  │  ├─ reviews/
│  │  ├─ notifications/
│  │  ├─ disputes/
│  │  ├─ analytics/                 # dashboards + report downloads (§1.2)
│  │  ├─ ai/                        # brief/idea/coaching assistant UI (§1.3)
│  │  └─ admin/                     # payout review, flagged queues, settings
│  │
│  ├─ shared/
│  │  ├─ api/                       # generated SDK wrapper + TanStack Query setup
│  │  ├─ auth/                      # session context, useAuth, guards, token store
│  │  ├─ realtime/                  # socket.io client, typed event hooks
│  │  ├─ i18n/                      # next-intl config, message catalogs, dir helper
│  │  ├─ money/                     # currency formatter (minor units + ISO)
│  │  ├─ rbac/                      # role/permission checks, <Can> gate component
│  │  ├─ forms/                     # rhf + zod helpers, shared field components
│  │  └─ lib/                       # fetch client, error mapping, utils
│  │
│  └─ design-system/                # the Zeyoo DS (shadcn-based)
│     ├─ ui/                        # Button, Input, Dialog, Table, … (Radix)
│     ├─ patterns/                  # DataTable, FormLayout, StatCard, EmptyState
│     ├─ tokens/                    # colors, spacing, typography (light/dark)
│     └─ theme/                     # provider, dark mode, RTL-aware styles
│
├─ messages/                        # en.json, ar.json translation catalogs
├─ public/                          # static assets, fonts (incl. Arabic)
├─ test/
│  ├─ e2e/                          # Playwright flows
│  └─ setup/                        # MSW handlers, RTL setup
├─ .storybook/                      # design-system stories + a11y checks
├─ openapi.json                     # snapshot of the contract this build targets
├─ .github/workflows/               # CI: lint, typecheck, test, build, sdk-drift
├─ .env.example
├─ package.json
├─ tsconfig.json
└─ README.md
```

### Structure rules
- **Feature-sliced, not layer-sliced.** A feature owns its components, hooks, and Zod schemas. Cross-feature reuse goes through `shared/` or `design-system/`, never by importing another feature's internals.
- **Server Components by default.** A component becomes `"use client"` only when it needs interactivity, browser APIs, or a hook. Keep the boundary as low in the tree as possible.
- **The design system is the only place raw Tailwind/Radix lives.** Features compose DS components; they don't reinvent buttons or dialogs.
- **The generated SDK is the only way to reach the backend.** No ad-hoc `fetch` in features — everything goes through `shared/api` Query hooks.

---

## 6. State, data & contract discipline

- **Server state = TanStack Query over the generated SDK.** Query keys are derived from SDK operation ids; mutations invalidate the affected keys. Optimistic updates only where the backend guarantees idempotency (money endpoints carry an idempotency key).
- **Client state = Zustand slices** for wizards, filter panels, table selection, and modal orchestration — never for data that the server owns.
- **Contract drift is a CI failure.** `openapi.json` is snapshotted in-repo; CI regenerates the SDK and fails if it differs from the committed client, so a backend contract change can't silently break the web build (System Design §3).
- **Money is display-only.** `shared/money` formats integer minor units + ISO currency with `Intl.NumberFormat`; the client never sums, prorates, or caps earnings — those are the ledger's job (contract §1.5).
- **Multi-currency (§1.7):** every amount carries its currency from the API; formatting is locale- and currency-aware; no implicit conversion in the UI.

---

## 7. Auth, RBAC & security

- **In-house JWT, matched to the backend.** Access token held in memory; **rotating refresh token in an httpOnly, Secure, SameSite cookie** set via a BFF route handler. A silent-refresh interceptor renews the access token before expiry and on 401; logout revokes server-side.
- **Social + enterprise login** (Google/Apple now; SAML/OIDC later, §1.7) are backend-driven redirect flows — the web app initiates and consumes the callback, storing the resulting session identically.
- **RBAC in the UI is defense-in-depth, not the gate.** `middleware.ts` guards route groups by role; a `<Can permission="payout:approve">` component hides controls the user lacks — but the backend `PolicyGuard` remains the real authority (backend §8). The UI never assumes hidden means safe.
- **Tenancy:** the UI only ever requests the current principal's org/creator scope; it renders exactly what the API returns and never cross-references other tenants' data.
- **Security controls:** strict CSP + security headers, no tokens in `localStorage`, no PII in URLs/query strings, Stripe redirects for anything payment-related, dependency and SDK integrity checks in CI.

---

## 8. i18n, RTL & accessibility

- **next-intl** with `en` and `ar`; locale from the path/cookie, `<html lang dir>` set per request. Layout uses **logical CSS properties** (`margin-inline`, `padding-inline`, `inset-inline`) so RTL is automatic, not a fork.
- **Arabic-ready typography:** bundled Arabic web font, mirrored iconography where directional, RTL-correct charts and tables.
- **Accessibility:** WCAG 2.2 AA target — Radix primitives give focus management and ARIA for free; Storybook a11y addon + Playwright axe checks in CI guard regressions (System Design §8).

---

## 9. Realtime, notifications & media

- **Socket.IO client** subscribes to the gateway for submission status, earnings updates, payout-hold changes, and fraud alerts; handlers invalidate the relevant Query keys so the UI re-renders from fresh server truth.
- **In-app notification feed** (§1.6) reads from the API and updates live over the socket; email/push are the backend's job.
- **Media (§1.11):** uploads go directly to the signed URL the backend issues (Mux/S3), with client-side progress; playback uses the Mux player. The web app orchestrates upload and shows moderation/transcode status — it never processes media itself.

---

## 10. Delivery phases (maps to contract milestones M1/M2/M3)

**Phase 0 — Foundation**
Next.js scaffold, design system baseline (shadcn + tokens + dark mode + RTL), generated SDK + TanStack Query wiring, in-house auth (login/register/refresh/guards), i18n skeleton (EN/AR), Storybook, CI (lint/typecheck/test/build/sdk-drift), Vercel preview deploys.

**Phase 1 — Core revenue loop → M2**
Brand: org/team, campaign CRUD + publish + invite, creator discovery, application/content review. Creator: profile + verification, social connect, applications, submissions + review status, baseline earnings view. Payments: Stripe Checkout funding + Connect onboarding redirects. Notifications baseline. This is the ≥50% checkpoint shared with backend + both mobile apps.

**Phase 2 — Full contracted scope → M3**
Dashboards from social metrics + downloadable reports (§1.2); withdrawals + admin payout review/holds (§1.4); AI assistants UI (§1.3); Stripe Billing tier management (§1.7); full EN/AR RTL + multi-currency polish; fraud/risk surfacing (payout-timing states); media clipping UI (§1.11); disputes/appeal center (§1.10); admin console complete; a11y + QA hardening.

**Phase 3 — Data-gated (post-launch)**
Surfaces for predictive AI (§1.9), AI creator matching + budget-reallocation views (§1.7) — built behind the same feature slices once the backend exposes them.

---

## 11. First implementation steps (Phase 0 checklist)

1. `pnpm create next-app` (App Router, TS strict, Tailwind); add ESLint boundary rules, Prettier, Husky.
2. Stand up the design system: install shadcn/ui, define tokens (color/space/type), dark mode, RTL-aware theme provider, first primitives + Storybook.
3. Wire the generated SDK: snapshot `openapi.json`, generate the client, set up TanStack Query provider + error mapping; add the CI sdk-drift check.
4. In-house auth: login/register/reset/verify pages, BFF refresh route (httpOnly cookie), silent-refresh interceptor, `middleware.ts` role guards, `useAuth` + `<Can>`.
5. i18n: next-intl config, `en`/`ar` catalogs, `<html dir>` handling, locale switcher, currency/date formatters.
6. Realtime: typed socket.io client + a proof-of-life subscription (e.g. notification feed) that invalidates a Query key.
7. App shells for `(brand)`, `(creator)`, `(admin)` route groups with role-gated navigation.
8. CI green (lint + typecheck + unit + e2e smoke + build + sdk-drift) and Vercel preview deploys.

---

*This plan mirrors the backend's pragmatic posture: one deployable app, contract-first integration, and clean feature boundaries — trading premature separation for delivery speed while keeping the seams honest enough to split later if real load ever demands it.*
