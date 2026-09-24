# Replacement Implementation Plan

**Document status:** AWAITING HUMAN APPROVAL — no implementation work begins until this plan is approved.  
**Companion document:** `production_artifacts/starter-provenance.md`  
**Recorded by:** Antigravity  
**Recorded at:** 2026-09-24T11:10:00+03:00

> [!IMPORTANT]
> This plan describes what will be built to **replace** every item in the "Excluded Paths" and "Inherited Assumptions" sections of `starter-provenance.md`. It does **not** describe business features. Business feature development is gated on approval of both this document and the provenance record.

---

## Phase 0 — Copy & Baseline (Gate: provenance.md approved)

**Goal:** Bring the approved shell into the workspace, verify no excluded file was imported, and ensure CI green.

### P0.1 — Shell copy

1. Clone `nextjs/saas-starter` at commit `6e33e58b1e553a41fe22e6b941a7229a002de361` into a temp directory.
2. `rsync` / `xcopy` only the "Copied Paths" listed in §4 of `starter-provenance.md` into the workspace root.
3. For the three "Conditionally copied" paths, copy the file then immediately strip the excluded logic (JWT guards, `teamId` references) before the first commit.
4. Run the post-copy verification checklist (§7 of provenance.md).
5. Commit with message: `chore: import approved shell from nextjs/saas-starter@6e33e58 (see production_artifacts/starter-provenance.md)`.

### P0.2 — Dependency baseline

1. Update `package.json`:
   - `next` → `>=15.6.0-canary.59` (first stable 15.x that patches CVE-2025-55182)
   - Add `drizzle-orm ^0.39.x`, `postgres` (postgres.js)
   - Add `argon2` (Argon2id hashing — replaces bcryptjs)
   - Add `@simplewebauthn/server` (WebAuthn server library)
   - Add `@simplewebauthn/browser` (WebAuthn browser library)
   - Remove `jose`, `stripe`, `bcryptjs` from dependencies
   - Keep `zod`, `clsx`, `tailwind-merge`
2. Install with `npm install`; commit lockfile.
3. CI lint + TypeScript build must be green before Phase 1 begins.

**Deliverables:** Green CI build; no excluded files in working tree.

---

## Phase 1 — Database Foundation (Replaces A3, A4, A9)

**Goal:** Establish the canonical schema, RLS policy infrastructure, and a transaction helper that auto-sets tenant context.

### P1.1 — Schema design (`db/`)

Create the following tables via Drizzle migration files in `db/migrations/`:

```
accounts              — tenant root (replaces `teams`)
  id uuid PK
  slug text UNIQUE
  display_name text
  deployment_mode  enum('shared','dedicated')
  created_at, updated_at, deleted_at

locations             — sub-unit of an account
  id uuid PK
  account_id uuid FK → accounts.id
  name text
  timezone text
  created_at, updated_at

users                 — identity only, no auth secrets
  id uuid PK
  email text UNIQUE NOT NULL
  display_name text
  created_at, updated_at, deleted_at

account_members       — membership bridge (replaces `teamMembers`)
  id uuid PK
  account_id uuid FK → accounts.id
  user_id    uuid FK → users.id
  role_id    uuid FK → roles.id
  joined_at  timestamptz

roles                 — RBAC role catalogue
permissions           — RBAC permission catalogue
role_permissions      — M:N role ↔ permission

activity_logs         — audit log (account_id replaces team_id)
  id uuid PK
  account_id uuid FK → accounts.id
  location_id uuid FK → locations.id (nullable)
  user_id uuid FK → users.id (nullable)
  action text NOT NULL
  metadata jsonb
  ip_address inet
  created_at timestamptz
```

All tables that belong to a tenant must have an `account_id` column eligible for RLS.

### P1.2 — RLS policy layer (`db/rls/`)

For every tenant-scoped table:

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <table> FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON <table>
  USING (account_id = current_setting('app.current_account_id')::uuid);
```

A `BYPASSRLS` role (`platform_admin`) is created for migrations and background jobs; application connection role never has `BYPASSRLS`.

Provide a test file `tests/rls/tenant-isolation.test.ts` that:
- Sets `app.current_account_id` to account A
- Asserts rows from account B are invisible
- Asserts a missing `SET LOCAL` causes the query to return 0 rows (policy defaults to deny)

### P1.3 — Transaction helper (`lib/db/tx.ts`)

```typescript
// lib/db/tx.ts
export async function withTenantTx<T>(
  accountId: string,
  fn: (tx: DrizzleTx) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_account_id', ${accountId}, true)`
    );
    return fn(tx);
  });
}
```

Every server action and API route that touches tenant data must call `withTenantTx`. Direct `db.*` calls are forbidden outside of migrations and platform admin operations (enforced by ESLint custom rule in Phase 5).

### P1.4 — Deployment mode support

- `shared` mode (default): all tenants in one schema, RLS enforced.
- `dedicated` mode: Drizzle config reads `ACCOUNT_DATABASE_URL_{id}` per account; `SET LOCAL` still issued for defence-in-depth.
- A `DeploymentModeResolver` utility (`lib/db/deployment.ts`) selects the correct connection based on account's `deployment_mode` column.

**Deliverables:** Migration files, RLS SQL scripts, `withTenantTx`, deployment resolver, RLS policy tests.

---

## Phase 2 — Authentication (Replaces A1, A7, A8)

**Goal:** Replace the JWT-in-cookie session and password-only auth with database-backed sessions, Argon2id passwords, and WebAuthn passkeys.

### P2.1 — Identity & credential schema (`db/migrations/`)

```
user_credentials      — password credentials
  id uuid PK
  user_id uuid FK → users.id
  credential_type  enum('password')
  argon2_hash text NOT NULL
  created_at, updated_at

passkey_credentials   — WebAuthn credentials (RFC 8809)
  id uuid PK
  user_id uuid FK → users.id
  credential_id text UNIQUE  (base64url)
  public_key bytea
  sign_count bigint
  aaguid text
  transports text[]
  created_at, last_used_at

sessions              — server-side sessions
  id uuid PK (token = random 32-byte hex)
  user_id uuid FK → users.id
  account_id uuid FK → accounts.id (nullable — set after account selection)
  expires_at timestamptz NOT NULL
  revoked_at timestamptz
  ip_address inet
  user_agent text
  created_at timestamptz
```

### P2.2 — Password authentication (`modules/auth/`)

- `hashPassword(plain: string): Promise<string>` — Argon2id with `timeCost=3`, `memoryCost=65536`, `parallelism=4`.
- `verifyPassword(plain, hash)` — constant-time comparison via argon2 library.
- `signIn(email, password)` — looks up `user_credentials`, verifies hash, creates a `sessions` row, sets opaque session cookie (`HttpOnly`, `Secure`, `SameSite=Lax`).
- `signOut(sessionId)` — sets `sessions.revoked_at`; clears cookie.

### P2.3 — Passkey authentication (`modules/auth/passkey/`)

Uses `@simplewebauthn/server`:

- **Registration flow:**
  - `GET /auth/passkey/register/options` — returns `generateRegistrationOptions()` result; stores challenge in session.
  - `POST /auth/passkey/register/verify` — calls `verifyRegistrationResponse()`; inserts `passkey_credentials` row.
- **Authentication flow:**
  - `GET /auth/passkey/authenticate/options` — returns `generateAuthenticationOptions()` result.
  - `POST /auth/passkey/authenticate/verify` — calls `verifyAuthenticationResponse()`; updates `sign_count`; creates `sessions` row.

### P2.4 — Session middleware (`middleware.ts` replacement)

Replace the starter's JWT cookie middleware entirely:

```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get('session_token')?.value;
  const session = sessionToken ? await validateSession(sessionToken) : null;

  if (!session && isProtectedRoute(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
  // Attach session to request headers for server components
  const res = NextResponse.next();
  if (session) {
    res.headers.set('x-session-user-id', session.userId);
    res.headers.set('x-session-account-id', session.accountId ?? '');
  }
  return res;
}
```

`validateSession` hits the DB, checks `revoked_at IS NULL AND expires_at > now()`.

### P2.5 — Auth UI (`app/(auth)/`)

- `sign-in/page.tsx` — email + password form + "Sign in with passkey" button (no JWT, no Stripe reference).
- `sign-up/page.tsx` — registration form; optionally prompts passkey creation post-registration.
- `passkey/page.tsx` — passkey management (list, add, remove).

### P2.6 — Fixture factory (replaces seed.ts)

`tests/fixtures/user-factory.ts`:
- Generates random email + strong random password per test run.
- Creates user, credentials, and session rows.
- No committed credentials; factory is test-only.

**Deliverables:** Auth schema migrations, `modules/auth/` module, passkey flows, session middleware, auth UI pages, fixture factory.

---

## Phase 3 — RBAC (Replaces A2)

**Goal:** Replace the two-role string with a flexible permission system evaluated at account/location/resource scope.

### P3.1 — RBAC schema

Already covered in Phase 1 (`roles`, `permissions`, `role_permissions`, `role_assignments`). Seed system roles in a non-secret migration:

| Role | Typical permissions |
|---|---|
| `account_owner` | `*` on all resources within the account |
| `account_admin` | all except billing and account deletion |
| `location_manager` | CRUD on own location's resources |
| `staff` | read + limited write on assigned location |

### P3.2 — Permission evaluation (`modules/rbac/`)

```typescript
// modules/rbac/can.ts
export async function can(
  userId: string,
  accountId: string,
  permission: Permission,
  resourceId?: string
): Promise<boolean>
```

- Loads role assignments for `(userId, accountId)`.
- Checks if any assigned role grants the requested permission (or wildcard).
- Optionally scoped to a `locationId` for location-level permissions.
- Results cached in-request via `AsyncLocalStorage` context; never cached across requests.

### P3.3 — Server action guard (`lib/rbac/guard.ts`)

```typescript
export function requirePermission(permission: Permission) {
  return async function <T>(action: () => Promise<T>): Promise<T> {
    const session = await getSession();
    if (!session) throw new UnauthorizedError();
    const allowed = await can(session.userId, session.accountId, permission);
    if (!allowed) throw new ForbiddenError();
    return action();
  };
}
```

Applied as a wrapper around every Server Action that mutates data.

**Deliverables:** RBAC tables, `modules/rbac/`, permission guard, unit tests for each permission boundary.

---

## Phase 4 — Billing Abstraction (Replaces A6)

**Goal:** Remove Stripe as a hard dependency; model billing as a bounded context with an adapter interface.

### P4.1 — Billing adapter interface (`modules/billing/`)

```typescript
// modules/billing/adapter.ts
export interface BillingAdapter {
  createCheckoutSession(params: CheckoutParams): Promise<{ url: string }>;
  getSubscription(accountId: string): Promise<Subscription | null>;
  cancelSubscription(accountId: string): Promise<void>;
  handleWebhook(payload: Buffer, signature: string): Promise<BillingEvent>;
}
```

### P4.2 — Billing schema (adapter-neutral)

```
subscriptions
  id uuid PK
  account_id uuid FK → accounts.id
  provider enum('stripe','manual','none')
  provider_subscription_id text
  plan_name text
  status enum('active','past_due','cancelled','trialing')
  current_period_end timestamptz
  created_at, updated_at
```

No Stripe-specific columns on `accounts`.

### P4.3 — Stripe adapter (optional, not activated by default)

`modules/billing/adapters/stripe.ts` — implements `BillingAdapter` using the Stripe SDK. Activated only when `BILLING_PROVIDER=stripe` is set in env. Not imported at build time otherwise (dynamic `import()` in factory).

**Deliverables:** Billing adapter interface, neutral schema, Stripe adapter stub, unit test for adapter contract.

---

## Phase 5 — Shared Infrastructure & Guardrails

### P5.1 — Environment configuration

`.env.example` updated to:

```dotenv
# Database
DATABASE_URL=postgres://...

# Session
SESSION_SECRET=<random 32 bytes hex>
SESSION_DURATION_HOURS=24

# WebAuthn
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME="Business Platform"

# Deployment
DEPLOYMENT_MODE=shared   # or: dedicated

# Billing (optional)
# BILLING_PROVIDER=stripe
# STRIPE_SECRET_KEY=...
# STRIPE_WEBHOOK_SECRET=...
```

### P5.2 — ESLint custom rules

| Rule | Enforcement |
|---|---|
| `no-direct-db-outside-tx` | Forbid `db.select()` / `db.insert()` on tenant tables without `withTenantTx` wrapper |
| `no-stripe-import` | Forbid direct `import stripe` outside `modules/billing/adapters/stripe.ts` |
| `no-jwt-import` | Forbid `import jose` or `import jsonwebtoken` in any non-auth file |

### P5.3 — Test scaffolding

| Location | Contents |
|---|---|
| `tests/unit/auth/` | Password hash/verify, session creation/revocation, passkey verify |
| `tests/unit/rbac/` | Permission evaluation, guard wrapper |
| `tests/rls/` | Tenant isolation, cross-account denial, missing context denial |
| `tests/integration/` | Full sign-in flow, passkey registration flow |
| `e2e/` | Playwright: sign-in → dashboard → sign-out |

**Deliverables:** Updated `.env.example`, ESLint plugin, test directory scaffold with placeholder test files.

---

## Delivery Sequence Summary

```
Phase 0  ──►  Phase 1  ──►  Phase 2  ──►  Phase 3  ──►  Phase 4  ──►  Phase 5
 Copy &         DB             Auth          RBAC          Billing       Guards &
 Baseline    Foundation       Layer          Layer        Abstraction     Tests
              (RLS, tx)    (passkey,       (roles,       (adapter,       (ESLint,
                             sessions)    permissions)   neutral DB)    e2e, rls)
```

Each phase produces a green CI build before the next phase begins. No phase modifies another phase's bounded context without an explicit integration step.

**Business features may begin after Phase 5 delivers a green CI build and architecture sign-off is recorded in `production_artifacts/arch-sign-off.md`.**

---

## Open Decisions Requiring Architect Input

| # | Question | Impact |
|---|---|---|
| D1 | Should `sessions` expire at a rolling window (refresh on activity) or fixed absolute expiry? | Session schema, middleware |
| D2 | What is the initial set of named permissions? (e.g. `locations:read`, `locations:write`, `staff:manage`) | Phase 3 seed migration |
| D3 | Is the `dedicated` deployment mode in scope for the MVP, or is `shared` only? | Phase 1.4 complexity |
| D4 | Which Argon2 parameter profile should be enforced? (`timeCost`, `memoryCost`) — recommend OWASP 2025 defaults | Phase 2.2 |
| D5 | Should passkey-only (passwordless) accounts be supported from day 1, or is password always required as a fallback? | Phase 2.3 |
| D6 | Is the Stripe billing adapter in scope for any phase, or fully deferred? | Phase 4 timeline |
