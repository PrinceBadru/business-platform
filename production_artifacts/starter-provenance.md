# Starter Provenance Record

**Document status:** AWAITING HUMAN APPROVAL — no code has been copied yet.  
**Recorded by:** Antigravity (automated inspection)  
**Recorded at:** 2026-09-24T11:10:00+03:00

---

## 1. Source Repository

| Field | Value |
|---|---|
| Repository | `github.com/nextjs/saas-starter` |
| Owner | Vercel / Next.js org (`nextjs`) |
| Repository ID | `854894542` |
| Commit SHA (HEAD `main`) | `6e33e58b1e553a41fe22e6b941a7229a002de361` |
| Tree SHA | `48e64cfd436b24c6273e63f566ad693505dc2ca2` |
| Commit message | `fix: upgrade Next.js to 15.6.0-canary.59 (CVE-2025-55182) (#235)` |
| Commit author | Chris Tate `<chris@ctate.dev>` |
| Commit date | 2025-12-11T22:35:36Z |
| Commit URL | https://github.com/nextjs/saas-starter/commit/6e33e58b1e553a41fe22e6b941a7229a002de361 |

## 2. License

**SPDX identifier:** MIT  
**Copyright holder:** Vercel (Copyright © 2025 Vercel)  
**License file path in source:** `LICENSE`  
**License file SHA in tree:** `b3ddd8d1dc451ce51bf5ea1464e7ba9b4465ad2a`

The MIT license permits unrestricted use, modification, and redistribution provided the copyright notice and permission notice are retained.  
**Obligation:** Copy the `LICENSE` file verbatim into `production_artifacts/UPSTREAM_LICENSE_nextjs-saas-starter.txt` before any code is merged.

## 3. Dependency Versions (source `package.json` as of recorded commit)

### Runtime dependencies

| Package | Version in starter |
|---|---|
| `next` | `15.6.0-canary.59` (CVE-2025-55182 patch) |
| `react` | `19.x` |
| `react-dom` | `19.x` |
| `drizzle-orm` | `^0.39.x` |
| `postgres` | postgres.js driver (used in `lib/db/drizzle.ts`) |
| `bcryptjs` | password hashing in `lib/auth/session.ts` |
| `jose` | JWT sign/verify in `lib/auth/session.ts` |
| `stripe` | Stripe SDK in `lib/payments/stripe.ts` |
| `@tailwindcss/postcss` | `4.1.7` |
| `zod` | server action form validation |

### Dev / tooling dependencies

| Package | Version in starter |
|---|---|
| `typescript` | `~5.x` |
| `drizzle-kit` | `^0.30.x` |
| `@types/node` | `^22.x` |
| `@types/react` | `19.x` |
| `@types/react-dom` | `19.x` |

> **Note:** The workspace `package.json` currently pins `next@14.2.15`. All copied shell files must be upgraded to the patched Next.js 15 line and the lockfile regenerated after the copy step.

## 4. Copied Paths (approved for import)

These paths contain only generic Next.js/TypeScript structure, shadcn/ui primitives, Drizzle tooling wiring, and shared navigation/layout conventions. They carry no authentication, billing, or tenancy logic and are approved for direct copy.

| Source path | Rationale |
|---|---|
| `next.config.ts` | Minimal Next.js config, no auth/Stripe |
| `tsconfig.json` | Standard TypeScript strict config |
| `postcss.config.mjs` | Tailwind v4 PostCSS config |
| `components.json` | shadcn/ui CLI registry config |
| `drizzle.config.ts` | Drizzle-kit config (connection string variable only) |
| `app/layout.tsx` | Root HTML shell (font, body, metadata) |
| `app/globals.css` | Tailwind base and CSS custom properties |
| `app/favicon.ico` | Generic favicon |
| `app/not-found.tsx` | Generic 404 page |
| `components/ui/avatar.tsx` | shadcn/ui Avatar primitive |
| `components/ui/button.tsx` | shadcn/ui Button primitive |
| `components/ui/card.tsx` | shadcn/ui Card primitive |
| `components/ui/dropdown-menu.tsx` | shadcn/ui DropdownMenu primitive |
| `components/ui/input.tsx` | shadcn/ui Input primitive |
| `components/ui/label.tsx` | shadcn/ui Label primitive |
| `components/ui/radio-group.tsx` | shadcn/ui RadioGroup primitive |
| `lib/utils.ts` | `cn()` utility (clsx + tailwind-merge), no domain logic |
| `lib/db/drizzle.ts` | Drizzle ORM client wiring — adapter shell only |
| `lib/db/migrations/meta/_journal.json` | Migration journal schema convention (entries cleared) |

### Conditionally copied (structural use only — contents replaced before commit)

| Source path | Condition |
|---|---|
| `app/(dashboard)/dashboard/layout.tsx` | Sidebar/nav shell retained; any JWT/team session guard removed |
| `app/(dashboard)/dashboard/activity/page.tsx` | Table/loading skeleton retained; `teamId` reference replaced |
| `middleware.ts` | Path-matching structure retained; JWT cookie logic fully replaced |

## 5. Excluded Paths (must NOT be copied)

These paths carry starter authentication, tenancy, billing, or seed-credential assumptions that conflict with the target architecture and are excluded.

| Source path | Reason for exclusion |
|---|---|
| `lib/auth/session.ts` | JWT-in-cookie (`jose`, HS256, 1-day); no passkey; no revocation |
| `lib/auth/middleware.ts` | JWT-based route guard; no RBAC; no RLS tenant context |
| `app/(login)/actions.ts` | Password-only sign-in/sign-up server actions; no passkey flow |
| `app/(login)/login.tsx` | Login form wired to JWT actions |
| `app/(login)/sign-in/page.tsx` | Sign-in page |
| `app/(login)/sign-up/page.tsx` | Sign-up page |
| `lib/db/schema.ts` | `teams`, `teamMembers`, `invitations` tables; Stripe columns on `teams`; role on `users` row |
| `lib/db/seed.ts` | Hard-coded seed credentials (`owner@example.com`, `member@example.com`) |
| `lib/db/setup.ts` | Interactive setup that embeds Stripe env-var assumptions |
| `lib/db/queries.ts` | Team-scoped queries (`getTeamByStripeCustomerId`, etc.) |
| `lib/db/migrations/0000_soft_the_anarchist.sql` | Creates starter schema tables; replaced by platform migrations |
| `lib/db/migrations/meta/0000_snapshot.json` | Drizzle snapshot for excluded migration |
| `lib/payments/stripe.ts` | Full Stripe checkout + webhook + portal logic |
| `lib/payments/actions.ts` | Stripe redirect actions |
| `app/api/stripe/` (entire subtree) | Stripe checkout and webhook API routes |
| `app/api/team/route.ts` | Team API relying on starter auth session |
| `app/api/user/route.ts` | User API relying on starter auth session |
| `app/(dashboard)/pricing/` (entire subtree) | Stripe pricing page and submit button |
| `app/(dashboard)/dashboard/general/page.tsx` | Team account settings (Stripe + team tenancy) |
| `app/(dashboard)/dashboard/security/page.tsx` | Password-only security settings (no passkey) |
| `app/(dashboard)/page.tsx` | Marketing landing page with Stripe pricing CTA |
| `app/(dashboard)/terminal.tsx` | Marketing terminal animation component |

## 6. Inherited Assumptions (explicitly replacing each one)

| # | Starter assumption | Required replacement |
|---|---|---|
| A1 | **JWT in HTTP-only cookie** (`jose`, HS256, 1-day expiry, stateless) — `lib/auth/session.ts` | **Database-backed session** with opaque token, server-side revocation table, and configurable expiry; passkey credential record stored alongside password credential |
| A2 | **Single `role` column on `users`** (`'owner' \| 'member'`) | **RBAC tables**: `roles`, `permissions`, `role_assignments`; permissions evaluated per account/location/resource boundary |
| A3 | **`teams` / `teamMembers` tenancy model** | **`accounts` / `locations`** hierarchy; RLS policies on all tenant-scoped tables; no cross-account data leakage at DB layer |
| A4 | **Application-layer tenant filter** (every query manually includes `WHERE team_id = ?`) | **PostgreSQL Row-Level Security** enforced by `SET LOCAL app.current_account_id = $1` inside every transaction; application never adds tenant predicate |
| A5 | **Single-mode deployment** (all tenants share one schema) | **Shared / dedicated deployment modes**: shared-schema + RLS (default for SMB), dedicated schema per account (enterprise); toggled at account provisioning time |
| A6 | **Stripe assumed as sole billing provider** | Billing is a **bounded-context module** with an adapter interface; Stripe is one pluggable implementation; billing module not activated by default |
| A7 | **`passwordHash` column on `users`, bcryptjs** | **Separate credential tables**: `password_credentials` (Argon2id hash), `passkey_credentials` (WebAuthn CBOR); identity row carries no auth secret |
| A8 | **`seed.ts` with hard-coded credentials** | **Fixture factory** with randomized credentials; no committed secrets; secrets injected via vault/env only |
| A9 | **`drizzle.ts` assumes `postgres.js`, single connection string** | **Connection pool** supporting read/write split; transaction helper that runs `SET LOCAL` before any tenant query; injectable for test harness |
| A10 | **No test setup in starter** | **Vitest** unit tests (already in workspace `package.json`); **Playwright** e2e in `e2e/`; dedicated **pg-harness** tests for RLS policies |

## 7. Post-Copy Verification Checklist

To be signed off by the engineer performing the copy step:

- [ ] `LICENSE` from source committed verbatim to `production_artifacts/UPSTREAM_LICENSE_nextjs-saas-starter.txt`
- [ ] No file from "Excluded Paths" appears in working tree (`git grep -rn "stripe\|jose\|teamMembers\|seed.ts"`)
- [ ] `drizzle.config.ts` references `DATABASE_URL` not `POSTGRES_URL`
- [ ] `db:seed` removed from `package.json`; replaced by fixture script
- [ ] `middleware.ts` fully rewritten (only structurally derived from starter)
- [ ] `.env.example` updated: `AUTH_SECRET` removed; `SESSION_SECRET`, `WEBAUTHN_RP_ID`, `WEBAUTHN_RP_NAME` added
- [ ] `next` version in `package.json` is `>=15.6.0-canary.59`
- [ ] `CI lint` passes on all copied files (`npm run lint`)
- [ ] Architecture team sign-off recorded in `production_artifacts/arch-sign-off.md`
