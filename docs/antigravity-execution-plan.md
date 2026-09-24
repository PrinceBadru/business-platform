# Antigravity Execution Plan for the Multi-Tenant Business Management Platform

**Prepared for:** Consultancy project team  
**Based on:** Multi-Tenant Business Management Platform — Technical Architecture Document v3.0  
**Planning horizon:** 10 weeks / 50 working days for the starter-accelerated Phase 1 pilot, with a 12-week fallback if the starter requires extensive replacement  
**Recommended delivery target:** Production-ready Phase 1 MVP at the end of Week 10 for two or three engineers, or Week 12 for a single engineer  
**Primary build method:** Google Antigravity agentic development workflow with a selectively reused open-source application shell, plus human approval at architecture, security, product, and release gates

## Executive recommendation

Build the platform as a **modular monolith first**. Do not attempt to deliver every long-term capability in the architecture document before validating the core workflow. The first release should prove four things:

1. A business can create an account, locations, users, roles, and location access safely.
2. Retail, service, and hybrid offerings can be configured without code forks.
3. A user can complete a sale or service transaction, including a credit sale and debt payment.
4. The system can produce trustworthy L1 insights while preventing cross-tenant data access.

The architecture document is ambitious for a team of one to three engineers. The schedule below therefore separates **Phase 1 MVP** from later enhancements. It also incorporates a controlled shortcut: start from a new product repository and selectively reuse the MIT-licensed Next.js/TypeScript/Drizzle/PostgreSQL shell from the official Next.js SaaS Starter. Do not inherit its authentication, team-isolation, Stripe, or authorization assumptions. Phase 1 includes the security model, core business operations, L1 insights, shared and dedicated deployment modes, and a production hardening pass. Price elasticity, forecasting, sophisticated benchmark cohorts, mobile packaging, and large-scale infrastructure extraction remain Phase 2 or Phase 3 capabilities unless the team finishes early.

Antigravity should be used as an **agentic engineering environment**, not as a single prompt that attempts to generate the whole product. Its documented workflow supports agents that plan and execute across the editor, terminal, and browser, while producing artifacts such as plans, diffs, diagrams, and browser recordings.[1] The recommended operating model is therefore:

> **Plan a bounded slice → implement it → test it adversarially → inspect the artifact → run the application → review the evidence → merge only when the acceptance gate passes.**

The plan below assumes five focused working days per week. If the project is being built part-time, treat each “day” as one focused engineering session and expect the calendar duration to expand proportionally.

---

## 1. Scope, assumptions, and release boundaries

### 1.1 Architecture baseline

The implementation follows the supplied v3.0 architecture:

- Next.js App Router with TypeScript.
- PostgreSQL 15 or newer.
- Drizzle ORM.
- PostgreSQL row-level security (RLS) with transaction-scoped tenant context.
- Three-path authentication: Google/Microsoft OAuth, enterprise SSO via OIDC/SAML, and email/password with optional passkeys.
- Argon2id password hashing.
- Signed session cookies.
- `pg-boss` or an equivalent PostgreSQL-backed job queue.
- PostgreSQL full-text search with `tsvector` and GIN indexes.
- Local filesystem storage behind a storage interface.
- React, Tailwind CSS, and shadcn/ui.
- Caddy for TLS and edge routing.
- Docker Compose or systemd for deployment.
- One codebase with a `DEPLOYMENT_MODE` switch for shared and dedicated operation.

The architecture’s most important invariant is that the same tenant-isolation rules apply in both deployment modes. Dedicated mode is not allowed to bypass RLS merely because it contains one business.

### 1.2 Phase 1 MVP scope

The Phase 1 MVP includes:

- Account and location management.
- Global user identity with account roles.
- Separate identity records for local passwords, OAuth provider accounts, enterprise SSO connections, and optional WebAuthn credentials.
- Organization-level authentication policy indicating which methods are enabled, whether SSO is mandatory, and whether passkeys are encouraged or required for step-up actions.
- Owner, Admin, Manager, and Employee roles.
- Location-scoped access for Managers and Employees.
- Account switching for a user who belongs to multiple accounts.
- Email/password authentication with Argon2id, secure recovery, and optional passkey enrollment.
- Google and Microsoft OAuth login with verified provider identity and account-linking controls.
- Enterprise SSO through OIDC and SAML, with organization-level connection configuration.
- Recovery flows that do not silently convert an email address into an unverified login factor.
- Config-driven retail, service, and hybrid business modes.
- Supplier management.
- Unified goods and services offerings.
- Stock tracking and low-stock thresholds for goods.
- Transaction headers and transaction lines.
- Product sales and service-delivery transactions.
- Credit sales, debts, and debt payments.
- L1 dashboards: daily, weekly, and monthly totals; rankings; low-stock alerts.
- Background jobs using PostgreSQL-backed queueing.
- Search using PostgreSQL full-text search.
- Shared-mode and dedicated-mode configuration.
- Opt-in controls and safe placeholder interfaces for dedicated benchmark synchronization.
- Adversarial tenant and location-isolation tests.
- Automated authentication tests for OAuth, OIDC/SAML SSO, email/password, and optional WebAuthn using at least two configured relying-party domains.
- Docker Compose deployment, Caddy configuration, backup, restore, health checks, and rollback documentation.

### 1.3 Explicitly deferred capabilities

The following should not block the Phase 1 release:

- Price elasticity calculations.
- Demand forecasting and seasonality models.
- Advanced reorder prediction.
- A mature cross-vendor benchmarking marketplace.
- Native mobile applications. A responsive PWA shell may be included, but a Capacitor package is optional.
- Redis, Kafka, Elasticsearch, a separate worker fleet, or microservices.
- Employee behavior monitoring, fraud scoring, cashier profiling, or any individual behavioral analysis.
- Full white-label customization unless a paying dedicated customer requires it.
- Source-code concealment or licensing enforcement for dedicated deployments. Treat this as a commercial and packaging decision, not as an accidental technical feature.

### 1.4 Starter-template acceleration policy

The project may reuse open-source starter code only under a **selective-reuse policy**. The preferred source is the [official Next.js SaaS Starter](https://github.com/nextjs/saas-starter), used for application scaffolding, dashboard UI, generic forms, Drizzle tooling, migration conventions, and testing structure. Create a new product repository rather than treating the starter repository as the product itself.

The following starter components must be removed or rebuilt before production:

- Email/password, OAuth, and SSO authentication assumptions, because the platform uses a provider-neutral three-path authentication policy with optional passkeys.
- JWT/session assumptions that do not implement the approved session threat model.
- Generic `teams`, `team_members`, and Owner/Member authorization.
- Application-only tenant filtering. The platform must use PostgreSQL RLS with transaction-scoped `SET LOCAL app.current_account`.
- Stripe billing code and starter-specific subscription assumptions.
- Seed credentials, demo accounts, and any development-only bypass.

A second acceptable source is `itsnyein/shadcn-admin` for selected Better Auth, Drizzle, PostgreSQL, and shadcn UI wiring, subject to a pinned commit and independent license review. `ixartz/SaaS-Boilerplate` may be used selectively for MIT-licensed UI patterns, but Clerk must not become a dependency of the dedicated deployment. Supabase, Vendure, Medusa, and ERPNext should be used as references only, not as the platform core.

The shortcut is expected to save approximately **2–3 weeks of scaffolding and interface work**, not the security and domain work. No feature is complete merely because the starter already displays a screen; it must satisfy this plan's authorization, RLS, migration, browser, and handover gates.

### 1.5 Authentication policy for business users

The platform should not force every business or employee into the same login experience. Phase 1 supports three primary authentication paths:

1. **Google and Microsoft OAuth:** convenient login for small businesses and teams already using Google Workspace or Microsoft accounts. The implementation must verify the provider token server-side, store the provider subject rather than trusting an email address alone, and require explicit account-linking confirmation when a user already has a local account.
2. **Enterprise SSO through OIDC and SAML:** organization administrators can configure a corporate identity provider. OIDC is the preferred integration for simpler deployments; SAML is supported for enterprises whose provider requires it. SSO connections are scoped to an account, domain, or organization policy and must not allow an unapproved identity to join an account merely because the email domain matches.
3. **Email/password with optional passkeys:** a universal fallback for businesses without Google Workspace, Microsoft 365, or an enterprise identity provider. Passwords use Argon2id. Passkeys use WebAuthn as an optional passwordless convenience or step-up factor; they are not mandatory for every user. A business may later require passkeys for selected roles or sensitive operations through policy configuration.

Email remains useful for verification, invitations, notifications, and recovery. It is not by itself proof that an OAuth or SSO identity may be linked to an existing account. Authentication method, identity provider, account membership, role, and location access are separate records and separate authorization decisions.

The implementation should use a provider-neutral authentication service or a mature authentication library with adapters for OAuth, OIDC, SAML, password credentials, and WebAuthn. Do not bind the core account model to one hosted provider. Dedicated deployments must be able to run with local email/password and optional passkeys even when no external identity provider is configured.

### 1.6 Open decisions to resolve before implementation

Resolve these during Day 1 rather than allowing agents to invent policy:

| Decision | Recommended Phase 1 choice |
|---|---|
| Suppliers | Keep them because they support inventory operations and the architecture already models them. |
| Credit/debt tracking | Keep it, but constrain the first release to customer, debt, payment, status, and audit history. |
| Dedicated branding | Support a small configuration object for name, logo path, and primary color; defer a full theme builder. |
| Dedicated IP protection | Ship compiled or containerized deployment artifacts and define a support/license agreement separately. Do not promise that deployed code is undiscoverable. |
| Benchmarking | Ship the data boundary, opt-in setting, anonymization contract, and test fixtures. Ship only conservative L4 comparisons that satisfy the cohort threshold. |
| Payments | Do not add online payment processing to Phase 1 unless a separate product decision and provider integration are approved. |
| Email delivery | Use a local development adapter and a production SMTP/provider adapter behind an interface. |
| Authentication methods | Support three primary paths: Google/Microsoft OAuth; enterprise SSO through OIDC/SAML; and email/password with optional passkeys. Require verified identity, account-linking protection, and organization-controlled SSO policies. |

---

## 2. How to operate Antigravity on this project

Antigravity projects define the folders and repositories an agent can access. Its documented setup allows a project to be opened from one or more folders, and an agent can run in the active workspace or an isolated Git worktree.[2] Use one repository for the application and a dedicated project folder containing the application, agent instructions, artifacts, and operational notes.

The project should use four Antigravity mechanisms:

1. **`agents.md`** defines stable roles and responsibilities.
2. **`skills/`** contains reusable technical instruction files.
3. **`workflows/`** contains bounded slash commands for repeatable work.
4. **`production_artifacts/`** stores plans, test reports, diagrams, screenshots, and release evidence.

The official Antigravity codelab demonstrates this pattern with an `.agents` directory, specialized roles, modular skills, shared production artifacts, and workflow commands that chain planning, engineering, QA, and deployment.[3]

### 2.1 Recommended repository layout

Create this structure before asking Antigravity to implement product code:

```text
business-platform/
├── .agents/
│   ├── agents.md
│   ├── skills/
│   │   ├── architecture-review.md
│   │   ├── database-and-rls.md
│   │   ├── secure-auth.md
│   │   ├── ui-product-patterns.md
│   │   ├── feature-implementation.md
│   │   ├── adversarial-qa.md
│   │   ├── browser-verification.md
│   │   ├── deployment-and-operations.md
│   │   └── artifact-handover.md
│   └── workflows/
│       ├── plan-slice.md
│       ├── implement-slice.md
│       ├── verify-slice.md
│       ├── security-gate.md
│       ├── release-candidate.md
│       └── start-day.md
├── app/                         # Next.js application
├── db/                          # Drizzle schema, migrations, seed data
├── modules/                     # Domain modules with explicit boundaries
├── tests/                       # Unit, integration, adversarial, and E2E tests
├── e2e/                         # Browser tests
├── infra/                       # Docker, Caddy, systemd, backup scripts
├── docs/                        # Human-readable architecture and runbooks
├── production_artifacts/        # Antigravity handover artifacts
├── .env.example
├── AGENTS.md                    # Optional project-level summary for humans
├── README.md
└── package.json
```

Use `app/` for routing and presentation, but keep business logic in domain modules. A suggested module layout is:

```text
modules/
├── accounts/
├── access/
├── auth/
├── locations/
├── offerings/
├── suppliers/
├── transactions/
├── customers/
├── debts/
├── insights/
├── search/
├── jobs/
├── benchmarking/
├── storage/
└── deployment/
```

Each module should expose a small service interface and should not import another module’s database internals. Cross-module interactions should use typed service functions, domain events, or explicit application-layer orchestration.

### 2.2 Agent roles

Put the following role definitions in `.agents/agents.md`. They are intentionally narrower than “build the whole app” roles.

```md
# Business Platform Agent Team

## @architect
Owns technical decisions, module boundaries, threat modeling, data contracts, and architecture artifacts.
Does not implement large features unless needed for a minimal proof.
Must identify assumptions and unresolved decisions before implementation.

## @product
Owns user journeys, acceptance criteria, terminology, configuration behavior, and release scope.
Does not make security or infrastructure decisions without consulting the architecture requirements.

## @engineer
Implements one bounded slice at a time in the approved architecture.
Must add or update tests with every behavior change.
Must not weaken RLS, authentication, authorization, auditability, or product exclusions to make a test pass.

## @security
Audits tenant isolation, authorization, secrets, sessions, WebAuthn, input validation, logging, and data export boundaries.
Must write adversarial tests rather than only describing risks.

## @qa
Runs unit, integration, browser, accessibility, migration, and regression tests.
Must report reproduction steps, expected behavior, actual behavior, and evidence paths.

## @devops
Owns local runtime, Docker Compose, Caddy, health checks, backups, restore drills, migrations, deployment modes, and rollback.
Must verify the application from a clean environment.

## @reviewer
Performs the final change review against the task acceptance criteria and architecture invariants.
May reject a slice that works functionally but creates security, maintainability, or deployment debt.
```

### 2.3 Global prompt contract

Prefix substantial prompts with this contract or place it in the relevant skill file:

```text
You are working inside the Business Management Platform repository.

Before changing files:
1. Inspect the existing repository and current production_artifacts.
2. Restate the bounded objective, assumptions, affected modules, and risks.
3. Propose a short implementation plan and list the verification commands.
4. Do not broaden scope without recording the reason.

While changing files:
5. Follow the architecture document and the module boundaries.
6. Treat tenant isolation, location authorization, authentication, and auditability as non-negotiable.
7. Add tests for new behavior and adversarial tests for access-control behavior.
8. Never use a client-supplied account_id or location_id as proof of authorization.
9. Never replace a failing security test with a weaker assertion.
10. Keep secrets out of source control and update .env.example when configuration changes.

After changing files:
11. Run the smallest relevant test set, then the full regression suite when practical.
12. Run formatting, type checking, linting, migration checks, and build checks.
13. Start the application and verify the affected flow in the browser when it is user-facing.
14. Write a handover artifact to production_artifacts/ containing changes, tests, evidence, known issues, and next action.
15. Stop and ask for a decision when a missing choice would materially change product behavior, data ownership, security, or deployment.
```

### 2.4 Daily Antigravity operating loop

Use the same loop every day. Antigravity supports a `/goal` style of running an instruction to completion and a `/grill-me` style of asking questions before implementation.[2] Use `/grill-me` only on decision days; use bounded goals for implementation days.

**Start of day:** ask `@architect` or `@product` to inspect the current state and produce a plan for one bounded slice. Do not ask for an entire week of code in one prompt.

**Implementation:** run the engineer in the active workspace for small changes or a new worktree for an isolated feature. Keep the change small enough to review as one diff.

**Verification:** run `@qa`, `@security`, and `@devops` as separate passes. Do not let the implementing agent be the only reviewer of its own work.

**Evidence:** require a Markdown handover, test output, screenshots or browser recordings for UI work, and a list of commands that reproduce the result.

**End of day:** merge only if the acceptance gate passes. Otherwise record the blocker and start the next day with a repair prompt.

### 2.5 Prompt anatomy

Every feature prompt should include:

- **Context:** architecture section, module, current state, and related artifacts.
- **Outcome:** one user-visible or system-visible result.
- **Constraints:** security, scope, data model, and deployment rules.
- **Acceptance criteria:** observable pass/fail conditions.
- **Verification:** exact commands, tests, and browser journey.
- **Artifact:** exact report or screenshot directory.

A good prompt asks the agent to produce a verifiable change. A weak prompt asks the agent to “build the whole dashboard.”

---

## 3. Phase and schedule overview

| Phase | Weeks | Main outcome | Release gate |
|---|---:|---|---|
| 0. Alignment, starter audit, and Antigravity setup | 1 | New repository, approved starter components, license inventory, roles, skills, workflows, and baseline decision record | Architecture Gate |
| 1. Foundation and data isolation | 2 | Running app, PostgreSQL, migrations, RLS, module boundaries, seed data | Isolation Gate |
| 2. Identity and access | 3–4 | Email/password, Google/Microsoft OAuth, enterprise OIDC/SAML SSO, optional passkeys, sessions, RBAC, locations, account switching | Authentication Gate |
| 3. Core operations | 5–6 | Offerings, suppliers, stock, transactions, customers, debts | Operations Gate |
| 4. Insights and search | 7 | L1 summaries, jobs, dashboard, full-text search | Insights Gate |
| 5. Deployment modes and operations | 8 | Shared/dedicated configuration, backups, Caddy, health checks, migration/rollback | Deployment Gate |
| 6. Integration, hardening, and release | 9–10 | Security audit, accessibility, performance, E2E, documentation, release candidate | Production Gate |

### 3.1 Effort assumption

With one engineer, expect roughly 12–15 calendar weeks even with the starter shortcut. With two or three engineers, the accelerated schedule can fit into 10 weeks, provided the starter is used only for scaffolding and the team does not postpone security work. If the starter audit reveals hidden coupling, revert to the 12-week schedule rather than weakening the architecture. Antigravity and starter reuse reduce typing and UI setup time, but they do not remove the need for product decisions, review, test design, deployment testing, or human accountability.

---

# 4. Detailed day-by-day execution plan

Each day below contains a copy-ready Antigravity prompt. Replace bracketed values only when necessary. The prompts are deliberately explicit because the goal is repeatable execution rather than inspirational prompting.

## Starter-accelerated execution rules

The detailed daily prompts below remain the governing implementation plan. Apply these additional rules whenever a starter is used:

1. **Day 2 must include a provenance audit.** Record the exact repository URL, commit or tag, license, copied paths, removed paths, and known security assumptions in `production_artifacts/starter-provenance.md`.
2. **Day 3 must create a clean target repository.** Do not build production features in an unreviewed template fork. Import only approved shell code.
3. **Days 6–10 must replace starter tenancy and authentication.** The starter's team tables, JWT/session code, seed users, and route filters cannot remain as the platform security model.
4. **Every copied feature requires a test owner.** The agent must identify whether the copied code is presentation, infrastructure, authorization, or domain logic. Authorization and domain code require a fresh review and tests.
5. **Run a shortcut-retirement check at the end of Week 2.** Any starter code that is still part of authentication, tenant context, authorization, payments, or data persistence must be explicitly approved or removed.
6. **Use the 10-week schedule only when the gates pass.** If the starter causes dependency conflicts, hidden provider coupling, or missing test coverage, use the original 12-week path and record the reason.

### Updated first prompt

```text
/goal @product @architect @engineer
Create a new target repository for the Business Management Platform using only the approved non-security-critical shell from the official MIT-licensed Next.js SaaS Starter.
Before copying code, inspect and record the exact source commit, license, copied paths, excluded paths, dependency versions, and inherited assumptions in production_artifacts/starter-provenance.md.
Reuse only Next.js/TypeScript structure, Drizzle tooling, generic UI, forms, tables, navigation, testing setup, and migration conventions.
Do not retain starter authentication, JWT/session assumptions, teams/team_members tenancy, Owner/Member authorization, Stripe billing, seed credentials, or application-only tenant filtering.
Create an implementation plan for replacing those areas with the architecture's accounts, locations, RBAC, PostgreSQL RLS, transaction-scoped SET LOCAL tenant context, password-plus-passkey authentication, shared/dedicated deployment modes, and domain modules.
Do not implement business features until the provenance report and replacement plan are ready for human approval.
```

## Week 1 — Align scope and configure the agentic workspace

### Day 1 — Convert architecture into a build contract

**Objective:** create the implementation brief, decisions register, MVP boundary, and risk register.

```text
/goal @product @architect
Read Multi-TenantBusinessManagementPlatform—Architecturev3.0.html and all files currently in production_artifacts/.
Create production_artifacts/01-product-and-architecture-baseline.md containing:
- the Phase 1 MVP scope;
- deferred Phase 2 and Phase 3 capabilities;
- actor and permission matrix;
- primary user journeys for owner, admin, manager, and employee;
- the shared versus dedicated deployment behavior matrix;
- the data-isolation invariants;
- the open decisions with recommended answers;
- measurable acceptance criteria for the end of Week 12.
Do not write application code.
Highlight every place where the architecture document leaves a decision open. Do not silently invent behavior.
```

**Human gate:** approve suppliers, debt tracking, dedicated branding, benchmarking scope, email behavior, and the Phase 1 cut line.

### Day 2 — Create the Antigravity operating system

**Objective:** configure roles, skills, workflows, artifact conventions, and repository rules.

```text
/goal @architect
Create the Antigravity project operating system in .agents/.
Create agents.md with the roles @architect, @product, @engineer, @security, @qa, @devops, and @reviewer.
Create skills/architecture-review.md, database-and-rls.md, secure-auth.md, ui-product-patterns.md, feature-implementation.md, adversarial-qa.md, browser-verification.md, deployment-and-operations.md, and artifact-handover.md.
Create workflows/plan-slice.md, implement-slice.md, verify-slice.md, security-gate.md, release-candidate.md, and start-day.md.
Each skill must define inputs, rules, forbidden shortcuts, required tests, and handover artifacts.
Each workflow must be bounded, inspect current state first, and finish by writing evidence to production_artifacts/.
Do not create product features yet. Validate that all paths are correct and document how each workflow is invoked.
```

### Day 3 — Scaffold repository and local runtime

**Objective:** create the application skeleton and reproducible local environment.

```text
/goal @engineer @devops
Scaffold the approved Next.js App Router TypeScript application in the repository.
Add Drizzle, PostgreSQL connectivity, Tailwind, shadcn/ui foundations, Vitest or Jest, Playwright, ESLint, Prettier, and strict TypeScript settings.
Add Docker Compose for the application and PostgreSQL. Add .env.example with safe placeholders only.
Add a health endpoint that reports application, database, and migration status without leaking secrets.
Add README.md with exact setup, test, lint, typecheck, migration, seed, and run commands.
Do not implement business modules yet.
Acceptance criteria:
- a clean checkout can install dependencies;
- the app starts locally;
- the health endpoint works;
- the database connection is verified;
- lint, typecheck, unit test, and production build commands exist and pass.
Write production_artifacts/day-03-foundation-report.md.
```

### Day 4 — Define module boundaries and shared contracts

**Objective:** prevent monolith boundary erosion before feature work begins.

```text
/goal @architect @engineer
Create the module boundary map for accounts, access, auth, locations, offerings, suppliers, transactions, customers, debts, insights, search, jobs, benchmarking, storage, and deployment.
Create shared result types, error types, validation conventions, money and date utilities, pagination conventions, audit event conventions, and request context types.
Create a dependency rule or automated check that prevents domain modules from importing another module's database internals.
Document which code belongs in app/, modules/, db/, tests/, and e2e/.
Add one example module service and one example route using the conventions, but do not add business behavior.
Run the boundary check and write production_artifacts/day-04-module-boundaries.md.
```

### Day 5 — Architecture gate and vertical-slice rehearsal

**Objective:** test the workflow on a small, non-sensitive vertical slice.

```text
/goal @reviewer @qa
Review the repository and production_artifacts/ against the approved baseline.
Choose one trivial vertical slice, such as a public health page or authenticated placeholder page, and verify the full plan-implement-test-browser-artifact workflow.
Check that agents inspect existing work before changing files, use the correct workspace, produce a diff, run tests, and write evidence.
Do not add new product scope.
Produce production_artifacts/architecture-gate-report.md with:
- passed checks;
- failed checks;
- required corrections;
- the exact scope approved for Week 2;
- a go/no-go recommendation.
```

**Gate:** do not proceed if the repository cannot be rebuilt from a clean checkout or if the agent workflow does not produce traceable evidence.

---

## Week 2 — Data model and tenant context

### Day 6 — Implement the core schema

```text
/goal @engineer
Implement Drizzle schema and the first migration for accounts, locations, users, user_account_roles, user_location_access, webauthn_credentials, suppliers, offerings, transactions, transaction_lines, customers, debts, debt_payments, jobs, and daily_summaries.
Use UUIDs, created_at and updated_at timestamps where appropriate, explicit enums or constrained values, integer cents for money, and foreign keys with deliberate delete behavior.
Apply the architecture indexing rule: account_id or location_id must lead every composite index.
Add database-level constraints for non-negative monetary amounts, valid quantities, and unique relationships.
Do not implement RLS policies in this task; leave clear migration boundaries for Day 7.
Add schema tests and write production_artifacts/day-06-schema-report.md.
```

### Day 7 — Implement transaction-scoped RLS

```text
/goal @security @engineer
Implement PostgreSQL RLS for every tenant-owned table using transaction-scoped SET LOCAL app.current_account.
Create a withTenantContext(accountId, callback) helper that opens a transaction, sets the tenant context locally, and executes all tenant queries inside that transaction.
Ensure pooled connections cannot retain tenant context after the transaction ends.
Use account_id directly where present and derive account ownership safely for location-scoped rows.
Add explicit policies for authenticated application access and tightly scoped policies for trusted maintenance or aggregation jobs.
Do not use connection-scoped SET, a global mutable tenant variable, or a client-supplied account_id as authorization.
Write migrations, integration tests, and production_artifacts/day-07-rls-report.md.
```

### Day 8 — Seed realistic multi-tenant fixtures

```text
/goal @engineer @qa
Create deterministic development and test fixtures for:
- two accounts;
- at least two locations per account;
- one owner, admin, manager, and employee;
- users who belong to more than one account;
- goods and services;
- stock thresholds;
- customers, a credit sale, an unpaid debt, and a partial payment.
Make fixture creation idempotent and safe for local development only.
Ensure test fixtures include cross-account and cross-location cases that should be denied.
Document how to reset and reseed the database.
Write production_artifacts/day-08-fixture-report.md.
```

### Day 9 — Adversarial isolation tests

```text
/goal @security @qa
Build the first dedicated adversarial tenant-isolation suite.
Attempt to read, insert, update, and delete Account A data while the request context is Account B.
Attempt to access Location A1 data from a user assigned only to Location A2.
Attempt to bypass isolation through direct IDs, pagination, sorting, search, joins, nested relations, server actions, route handlers, and background jobs.
Attempt to reuse a pooled connection after switching tenants.
Every unauthorized operation must fail safely or return no data according to the documented contract.
Do not weaken the RLS policy to satisfy the test.
Run the suite against a real PostgreSQL service, not only mocks.
Write production_artifacts/day-09-adversarial-isolation-report.md with query traces and failure evidence.
```

### Day 10 — Isolation gate

```text
/goal @reviewer @security @devops
Run the complete database migration, seed, unit, integration, and adversarial isolation suites from a clean environment.
Inspect all SQL policies, transaction helpers, indexes, and database roles.
Check that shared and dedicated deployment modes use the same schema and RLS migrations.
Review logs for tenant identifiers and ensure secrets are not logged.
Produce production_artifacts/isolation-gate-report.md.
Recommend GO only if cross-account and cross-location access is denied through application routes and direct database-backed tests.
```

**Gate:** no product feature work may proceed with a known isolation failure.

---

## Week 3 — Access model and application shell

### Day 11 — Build account and location administration

```text
/goal @engineer @product
Implement account and location administration for the Owner and Admin roles.
Build create, read, update, and archive flows for locations.
Implement account configuration for business_type (retail, services, hybrid), enabled module flags, labels, and small dedicated-branding fields.
All mutations must validate input on the server and enforce role and tenant context from the session.
Create responsive pages with loading, empty, error, and success states.
Add unit, integration, and Playwright tests for the primary owner journey.
Write production_artifacts/day-11-account-location-report.md.
```

### Day 12 — Build roles and location assignments

```text
/goal @engineer @security
Implement the effective-permission service combining account role and location assignment.
Owner and Admin have account-wide access. Manager and Employee are limited to assigned locations unless a permission explicitly says otherwise.
Build administration screens for assigning account roles and locations.
Prevent a user from granting a role or location access they are not authorized to grant.
Add tests for every role and for users who belong to multiple accounts.
Do not infer permissions from UI visibility; enforce them in server-side services and routes.
Write production_artifacts/day-12-rbac-report.md.
```

### Day 13 — Application shell and navigation

```text
/goal @engineer @product
Build the authenticated application shell: account switcher, location selector, responsive sidebar, top bar, breadcrumbs, notifications area, and user menu.
Navigation must be generated from effective permissions and enabled modules, but route protection must remain server-side.
Use accessible shadcn/ui components, keyboard navigation, focus states, responsive behavior, and clear empty/error/loading states.
Add browser tests for account switching and location switching.
Create screenshots for desktop and mobile widths and save them under production_artifacts/day-13-ui/.
Write production_artifacts/day-13-application-shell-report.md.
```

### Day 14 — Session foundation

```text
/goal @engineer @security
Implement signed session cookies with secure defaults, expiration, rotation behavior, logout, CSRF protection where needed, and server-side session lookup.
Create request context containing authenticated user, selected account, selected location, and effective permissions.
Do not trust account or location identifiers from cookies without server validation.
Add tests for expired sessions, tampered cookies, logout, account switching, and unauthorized route access.
Document cookie flags, secret configuration, session invalidation, and development-only behavior.
Write production_artifacts/day-14-session-report.md.
```

### Day 15 — Access-model gate

```text
/goal @reviewer @qa @security
Exercise the account, location, role, permission, session, account-switching, and navigation journeys in the browser.
Attempt direct URL access to pages hidden from each role.
Attempt to mutate another account's location and user assignments.
Check responsive behavior, accessibility basics, and error handling.
Produce production_artifacts/access-gate-report.md with screenshots, test results, and any accepted limitations.
```

---

## Week 4 — Authentication, OAuth, SSO, and optional passkeys

### Day 16 — Authentication abstraction and email/password fallback

```text
/goal @architect @engineer @security
Design and implement a provider-neutral authentication service with adapters for:
- local email/password credentials;
- Google and Microsoft OAuth;
- enterprise OIDC and SAML SSO;
- optional WebAuthn passkeys.
Separate User, IdentityProviderAccount, SSOConnection, PasswordCredential, WebAuthnCredential, AccountMembership, and Session records.
Use a canonical internal user ID. Never use an email address as the durable identity key.
Implement email/password using Argon2id, secure cookies, session rotation, rate limiting, generic authentication errors, logout, and audit events.
Do not make passkeys mandatory for every user. Allow a user to enroll a passkey after authenticating through any approved method, and allow an account policy to require passkeys for selected roles or sensitive operations.
Write production_artifacts/day-16-authentication-abstraction-report.md.
```

### Day 17 — Google and Microsoft OAuth

```text
/goal @engineer @security @product
Implement Google and Microsoft OAuth using authorization-code flow with PKCE where supported.
Keep client secrets server-side and read client IDs, secrets, redirect URIs, and allowed providers from deployment configuration.
Verify issuer, audience, state, nonce, redirect URI, and provider subject server-side.
Create a provider identity record linked to the canonical internal user only after verified authentication.
If the provider email matches an existing local account, require explicit account-linking confirmation rather than silently merging identities.
Define behavior for a user whose provider email changes, a revoked provider account, duplicate provider subject, and a provider outage.
Add browser and integration tests using mocked provider responses plus a staging configuration test.
Write production_artifacts/day-17-oauth-report.md.
```

### Day 18 — Enterprise OIDC and SAML SSO

```text
/goal @engineer @security @product
Implement organization-scoped enterprise SSO connections.
Support OIDC first and SAML as the enterprise adapter or Phase 1 pilot capability, using a stable interface so either protocol can be configured per account.
Store issuer, client metadata, certificates, entity IDs, redirect URLs, and activation status securely; never store private keys or client secrets in source control.
Require an account Owner/Admin to create or activate an SSO connection.
Support domain or organization routing only as a discovery aid; never grant account membership based solely on an email domain.
Define just-in-time provisioning, invite-only membership, deprovisioning, role mapping, and behavior when an SSO connection is disabled.
Add tests for valid login, invalid issuer, signature failure, replay, wrong account, disabled connection, and unauthorized role mapping.
Write production_artifacts/day-18-enterprise-sso-report.md.
```

### Day 19 — Optional passkeys and authentication recovery

```text
/goal @engineer @security
Implement optional WebAuthn passkey enrollment and authentication with @simplewebauthn/server and @simplewebauthn/browser, or the approved provider-neutral library.
Read the relying-party ID, origin, and display name from deployment configuration; never hardcode the RP ID.
Allow passkey enrollment after any approved authenticated method. Allow passkey login when the user has enrolled one, and allow an account policy to require passkeys for selected roles or step-up actions.
Handle challenge expiration, replay prevention, user cancellation, duplicate credentials, revoked credentials, sign-count updates, and invalid origins.
Implement recovery that uses verified email and/or an already-approved identity provider according to account policy. Recovery must not silently link an unknown OAuth identity or convert email into unconditional login access.
Add browser and integration tests for enrollment, login, cancellation, wrong domain, recovery, and policy-required step-up.
Write production_artifacts/day-19-passkeys-recovery-report.md.
```

### Day 20 — Authentication gate

```text
/goal @reviewer @security @qa
Perform a security and usability review of all three authentication paths:
1. Google/Microsoft OAuth;
2. enterprise OIDC/SAML SSO;
3. email/password with optional passkeys.
Verify account linking, identity-provider subject handling, session rotation, recovery, rate limiting, logout, SSO deprovisioning, role mapping, and audit events.
Run browser evidence for a first-time user, an invited user, an existing local account linking Google or Microsoft, an enterprise SSO user, an email/password user, and an optional passkey user.
Run the WebAuthn ceremony against at least two configured domains when passkeys are enabled, while keeping OAuth and SSO configuration provider-driven.
Produce production_artifacts/authentication-gate-report.md.
Recommend GO only if every enabled method has server-side verification, no method silently merges identities, and a dedicated deployment can operate with local credentials even when external providers are absent.
```

---

## Week 5 — Offerings, suppliers, and inventory

### Day 21 — Offerings domain

```text
/goal @engineer @product
Implement the unified offerings domain for goods and services.
Support name, category, item_type, tracks_stock, unit, supplier, cost_cents, price_cents, current_stock, reorder_threshold, attributes, and active state.
Validate money as integer cents and reject invalid quantities or negative values.
Respect account and location scope in every read and mutation.
Build list, search, create, edit, archive, and detail views with clear goods versus services behavior.
Add tests for retail, services, and hybrid account configurations.
Write production_artifacts/day-21-offerings-report.md.
```

### Day 22 — Suppliers

```text
/goal @engineer
Implement supplier CRUD scoped to location and account authorization.
Prevent deletion when an offering or historical transaction depends on a supplier; use archive behavior where appropriate.
Add contact fields, notes, validation, search, pagination, and empty states.
Test Manager and Employee restrictions separately.
Include audit events for create, edit, archive, and restore operations.
Write production_artifacts/day-22-suppliers-report.md.
```

### Day 23 — Stock movements

```text
/goal @engineer @security
Implement stock movement recording for tracked goods.
Use an append-only movement model or equivalent auditable mechanism rather than allowing silent stock overwrites.
Support receipt, adjustment, sale deduction, and reversal paths needed by Phase 1.
Prevent stock changes for services and prevent negative stock unless the approved product decision explicitly allows it.
Add concurrency tests for two simultaneous deductions and tenant-isolation tests for stock queries.
Write production_artifacts/day-23-stock-report.md.
```

### Day 24 — Offering UI and search

```text
/goal @engineer @product
Complete the offerings and supplier UI with table, filters, category, type, stock status, low-stock status, and full-text search.
Use PostgreSQL tsvector and GIN indexes for the initial search implementation.
Provide accessible keyboard interactions and responsive layouts.
Verify that search results cannot reveal another account's offerings.
Add browser tests for goods, services, hybrid behavior, filters, and no-result states.
Write production_artifacts/day-24-offering-ui-report.md.
```

### Day 25 — Inventory gate

```text
/goal @reviewer @qa @security
Review offerings, suppliers, stock movement logic, search, authorization, audit events, and responsive UI.
Run migration, unit, integration, adversarial, and browser tests.
Check money and quantity calculations with boundary values.
Produce production_artifacts/inventory-gate-report.md.
```

---

## Week 6 — Transactions and checkout

### Day 26 — Transaction domain

```text
/goal @engineer
Implement transaction and transaction_lines as a header-and-lines model.
Support sale and service_delivery transaction types.
Calculate totals server-side from line quantities and prices; never trust a client-supplied total.
Persist the exact unit price used at the time of sale.
Use a database transaction for header, lines, stock deduction, and audit event creation.
Add idempotency protection for retried submissions.
Write production_artifacts/day-26-transaction-domain-report.md.
```

### Day 27 — Checkout UI

```text
/goal @engineer @product
Build the responsive checkout flow for goods, services, and hybrid businesses.
Support offering search, quantity changes, line removal, subtotal, total, optional customer selection, and payment method placeholder behavior.
Show stock availability and prevent invalid quantities.
Make the primary flow usable with keyboard and on a narrow screen.
Add Playwright tests for a one-line and multi-line transaction.
Write production_artifacts/day-27-checkout-report.md.
```

### Day 28 — Stock and transaction consistency

```text
/goal @security @engineer
Harden transaction consistency under retries, concurrent checkout, insufficient stock, archived offerings, price changes, and partial failures.
Use database constraints and transactional logic so a failed checkout does not leave partial lines or stock deductions.
Add tests for duplicate requests, simultaneous requests, rollback, and cross-location access.
Document the transaction state machine and reversal behavior.
Write production_artifacts/day-28-transaction-consistency-report.md.
```

### Day 29 — Transaction history and audit

```text
/goal @engineer @product
Build transaction history, detail, filtering, date ranges, offering/customer filters, and a read-only audit view.
Managers and Employees may see only permitted locations.
Owners and Admins may see account-wide data.
Add export only if it is within the approved MVP scope; otherwise document the deferred export contract.
Add browser tests for filtering and direct-ID authorization failures.
Write production_artifacts/day-29-transaction-history-report.md.
```

### Day 30 — Operations gate

```text
/goal @reviewer @qa @security
Run the complete purchase and service-delivery journeys from clean data.
Verify totals, line calculations, stock deductions, idempotency, authorization, audit events, error recovery, and responsive behavior.
Test retail-only, services-only, and hybrid configurations.
Produce production_artifacts/operations-gate-report.md with release blockers clearly separated from non-blocking improvements.
```

---

## Week 7 — Customers, credit, debt, and business configuration

### Day 31 — Customer management

```text
/goal @engineer
Implement customer CRUD scoped to location and account.
Support name, optional phone, notes, active/archive behavior, search, and selection during checkout.
Avoid treating phone or email as a universal identity unless separately approved.
Add authorization and audit tests.
Write production_artifacts/day-31-customers-report.md.
```

### Day 32 — Credit sales and debt creation

```text
/goal @engineer @security
Implement the approved credit-sale flow.
A transaction may create a debt only when a customer is selected and the request is authorized.
Calculate debt amount from the persisted transaction total and record date_incurred and status.
Prevent duplicate debt records on retry.
Expose outstanding, partially paid, paid, and cancelled states only if each state has a documented transition.
Add integration tests for transaction, debt, stock, audit, and rollback consistency.
Write production_artifacts/day-32-credit-sales-report.md.
```

### Day 33 — Debt payments

```text
/goal @engineer @product
Implement debt payment recording with amount validation, payment history, remaining balance, and status transitions.
Reject overpayment unless the approved product decision defines credit balances.
Make the operation idempotent and auditable.
Add customer debt summary and location-filtered debt views.
Write production_artifacts/day-33-debt-payments-report.md.
```

### Day 34 — Configuration-driven behavior

```text
/goal @engineer @product
Implement configuration-driven labels and module toggles for retail, services, and hybrid accounts.
Verify that disabled modules disappear from navigation and cannot be reached by direct URL.
Keep authorization independent from UI module visibility.
Add tests for configuration changes, cache invalidation, and existing records when a module is disabled.
Document which configuration changes are safe at runtime and which require migration or restart.
Write production_artifacts/day-34-config-driven-behavior-report.md.
```

### Day 35 — Credit and configuration gate

```text
/goal @reviewer @qa @security
Review customer, credit sale, debt payment, configuration, authorization, auditability, and error handling.
Run adversarial tests for cross-account customer IDs, debt IDs, payment IDs, and location IDs.
Verify that disabled modules cannot leak data through APIs, background jobs, search, or direct URLs.
Produce production_artifacts/credit-configuration-gate-report.md.
```

---

## Week 8 — Jobs, L1 insights, search, and benchmark boundary

### Day 36 — Job infrastructure

```text
/goal @engineer @devops
Implement the PostgreSQL-backed job queue using pg-boss or the approved equivalent.
Define job payload validation, retry policy, backoff, idempotency, dead-letter behavior, observability, and graceful shutdown.
Ensure job execution carries an explicit account context and cannot use a stale pooled connection.
Add a local job runner and tests for success, retry, failure, and duplicate delivery.
Write production_artifacts/day-36-job-infrastructure-report.md.
```

### Day 37 — Daily summaries

```text
/goal @engineer
Implement daily_summaries computation for revenue, transaction count, sales by type, service-delivery count, low-stock count, and other approved L1 measures.
Use integer cents and deterministic date/time-zone rules.
Make recomputation safe and idempotent.
Add tests comparing summary results to raw transaction fixtures.
Write production_artifacts/day-37-daily-summaries-report.md.
```

### Day 38 — L1 insights dashboard

```text
/goal @engineer @product
Build the L1 insights dashboard with daily, weekly, and monthly totals; top offerings; low-stock alerts; recent transactions; and plain-language explanations.
Use clear language rather than unexplained economic jargon.
Show data freshness and empty states when an account has insufficient history.
Respect account and location scope in both queries and rendered results.
Add browser tests and screenshots at desktop and mobile widths.
Write production_artifacts/day-38-l1-dashboard-report.md.
```

### Day 39 — Benchmarking boundary and opt-in connector

```text
/goal @architect @security @engineer
Implement the benchmarking boundary without exposing raw cross-account transactions.
For shared mode, define a tightly scoped aggregation service that produces only approved aggregate metrics.
For dedicated mode, define an opt-in setting, anonymized aggregate payload schema, minimum cohort-size check, irreversible aggregation check, connector retry behavior, and local result cache.
Reject any payload that could identify a business or contains raw transactions, employee-level data, timestamps that enable reconstruction, or small cohorts.
Add tests proving the exclusion of employee profiling and raw-data export.
Write production_artifacts/day-39-benchmark-boundary-report.md.
```

### Day 40 — Insights gate

```text
/goal @reviewer @qa @security
Verify job reliability, summary correctness, dashboard authorization, search isolation, benchmark cohort rules, opt-in behavior, and product exclusions.
Run jobs from a clean database and simulate retries and partial failures.
Review all benchmark payloads and generated explanations for unsupported claims.
Produce production_artifacts/insights-gate-report.md.
```

---

## Week 9 — Shared and dedicated deployment modes

### Day 41 — Deployment configuration

```text
/goal @devops @engineer
Implement typed deployment configuration with DEPLOYMENT_MODE=shared|dedicated.
Define configuration for database URL, session secret, OAuth client IDs/secrets and redirect URIs, OIDC/SAML connection metadata, WebAuthn RP ID and allowed origin, storage root, product branding, benchmark opt-in, and job execution. Secrets must be injected at runtime.
Fail fast on missing or invalid production configuration.
Use safe development defaults only in development.
Document every environment variable in .env.example and docs/configuration.md.
Add tests that shared and dedicated configurations parse correctly and invalid combinations fail.
Write production_artifacts/day-41-deployment-config-report.md.
```

### Day 42 — Dedicated provisioning

```text
/goal @devops
Implement a dedicated deployment provisioning path for one pre-created account.
The dedicated instance must close public signup, seed exactly one account, use the same schema and RLS migrations, configure its own authentication policy and WebAuthn RP ID/origin, and keep local L1-L3 data local. It must work with local credentials even if Google, Microsoft, or enterprise SSO is not configured.
Add a provisioning script that is idempotent and safe to rerun.
Document how an operator supplies domain, account, branding, database, storage, and admin bootstrap values without committing secrets.
Write production_artifacts/day-42-dedicated-provisioning-report.md.
```

### Day 43 — Caddy, Docker, health, and backup

```text
/goal @devops
Create production-oriented Docker Compose and Caddy configuration for the Phase 1 single-instance deployment.
Add automatic TLS configuration guidance, health checks, startup ordering, migration behavior, persistent database storage, local file storage, log handling, and nightly pg_dump backup scripts.
Add backup retention and restore instructions.
Do not claim that a backup is valid until a restore test succeeds.
Write production_artifacts/day-43-runtime-operations-report.md.
```

### Day 44 — Migration and rollback

```text
/goal @devops @security
Implement and document forward migrations, pre-deploy checks, rollback strategy, application health checks, and blue-green or fast-replacement deployment guidance appropriate to a single-process Phase 1 system.
Create a migration rehearsal from an empty database and from a seeded database.
Create a restore rehearsal from a backup.
Document what cannot be rolled back automatically, especially destructive schema changes.
Write production_artifacts/day-44-migration-rollback-report.md.
```

### Day 45 — Deployment gate

```text
/goal @reviewer @devops @qa
Build the application from a clean checkout in both shared and dedicated configuration modes.
Verify email/password login, Google/Microsoft OAuth configuration, enterprise SSO configuration, optional WebAuthn configuration, account provisioning, RLS, jobs, local storage, health checks, Caddy routing, backup, restore, migration, and rollback documentation.
Use a disposable environment for the dedicated test.
Produce production_artifacts/deployment-gate-report.md.
```

---

## Week 10 — Full product integration and observability

### Day 46 — End-to-end business journeys

```text
/goal @qa @product
Create end-to-end browser journeys for:
1. Shared account signup and owner setup.
2. Add a location and invite or create a user.
3. Configure a retail account and create a good.
4. Configure a services account and create a service.
5. Configure a hybrid account and complete a mixed transaction.
6. Record a credit sale and collect a partial debt payment.
7. Review L1 insights and low-stock alerts.
8. Switch accounts and verify data boundaries.
9. Run a dedicated instance with public signup disabled.
Use stable test fixtures and capture screenshots or browser recordings for each journey.
Write production_artifacts/day-46-e2e-journeys-report.md.
```

### Day 47 — Error handling and resilience

```text
/goal @engineer @qa
Audit all user-facing flows for loading, empty, validation, authorization, database, network, job, and unexpected-error states.
Add safe error messages that help users recover without exposing internal details.
Simulate database unavailability, duplicate submissions, expired sessions, job retries, and stale browser state.
Ensure no operation silently succeeds when its dependent side effect fails.
Write production_artifacts/day-47-resilience-report.md.
```

### Day 48 — Observability and audit

```text
/goal @devops @security
Implement structured logs, request correlation IDs, audit events for sensitive mutations, health metrics, job failure reporting, and an operator-safe diagnostics page or command.
Never log passwords, session secrets, raw WebAuthn challenges, or raw benchmark payloads.
Define the minimum alert conditions for Phase 1: database unavailable, migration failure, job backlog, repeated authentication failures, disk capacity, and backup failure.
Write production_artifacts/day-48-observability-report.md.
```

### Day 49 — Performance baseline

```text
/goal @qa @devops
Create a representative fixture set and measure p50 and p95 latency for account dashboard, offering search, transaction history, checkout calculation, debt summary, and L1 dashboard.
Check query plans and confirm account_id or location_id leads relevant composite indexes.
Record database size, job duration, and search latency.
Do not add Redis, Elasticsearch, or services unless a measured threshold justifies it.
Write production_artifacts/day-49-performance-baseline.md.
```

### Day 50 — Integration gate

```text
/goal @reviewer
Review all production artifacts and run the full application from a clean environment.
Confirm that the product supports the approved user journeys and that no deferred capability has accidentally become a release dependency.
Produce production_artifacts/integration-gate-report.md with release blockers, accepted risks, and remaining work for Weeks 11–12.
```

---

## Week 11 — Security, accessibility, and quality hardening

### Day 51 — Threat model review

```text
/goal @security @architect
Perform a threat model covering tenant isolation, direct-object references, OAuth token theft, OIDC/SAML assertion replay and signature validation, account linking, session theft, password attacks, WebAuthn configuration, CSRF, XSS, SQL injection, file storage, job payloads, benchmark aggregation, backups, dedicated deployment, and operator access.
Map each threat to a prevention, detection, and test.
Add missing tests and code fixes for high and critical risks.
Do not add speculative infrastructure; prioritize controls that protect the current architecture.
Write production_artifacts/day-51-threat-model-report.md.
```

### Day 52 — Authorization audit

```text
/goal @security
Audit every server action, route handler, loader, mutation, background job, search query, export path, and file path.
For each operation, verify authentication, account authorization, location authorization, input validation, RLS context, audit behavior, and error behavior.
Create an authorization matrix and test every high-risk operation with permitted and denied identities.
Write production_artifacts/day-52-authorization-audit.md.
```

### Day 53 — Accessibility and UX audit

```text
/goal @qa @product
Audit the application against practical WCAG 2.2 AA expectations for keyboard navigation, focus management, labels, contrast, validation messages, semantic structure, responsive layouts, tables, dialogs, and error recovery.
Fix high-impact issues and add automated accessibility checks where reliable.
Review the language of insights so it is plain, actionable, and not misleading.
Write production_artifacts/day-53-accessibility-ux-report.md.
```

### Day 54 — Dependency and supply-chain review

```text
/goal @security @devops
Review dependency versions, lockfiles, scripts, container base images, environment handling, secret scanning, and production build output.
Run the approved vulnerability and license checks.
Remove unused packages and document any accepted vulnerabilities with owner and remediation date.
Verify that source maps, debug endpoints, test credentials, and development fixtures are not exposed in production.
Write production_artifacts/day-54-supply-chain-report.md.
```

### Day 55 — Hardening gate

```text
/goal @reviewer @security @qa
Run the complete security, authorization, accessibility, dependency, migration, browser, and regression suites.
Review all critical and high findings.
Recommend GO only when every critical issue is fixed and every accepted risk is explicitly documented with a mitigation or owner.
Write production_artifacts/hardening-gate-report.md.
```

---

## Week 12 — Release candidate and handover

### Day 56 — Documentation and operator handover

```text
/goal @devops @architect @product
Complete the human documentation:
- product scope and deferred roadmap;
- local development;
- configuration;
- database migrations;
- authentication and WebAuthn domain setup;
- shared deployment;
- dedicated provisioning;
- backups and restore;
- monitoring and alerts;
- incident response;
- tenant migration considerations;
- known limitations;
- support and licensing assumptions.
Cross-check every command against a clean environment.
Write production_artifacts/day-56-handover-checklist.md.
```

### Day 57 — Release-candidate build

```text
/goal @devops @qa
Create a release-candidate tag or branch from a clean checkout.
Build the production image or deployment artifact.
Run migrations, seed only the approved bootstrap data, start the application, execute health checks, run the complete automated suite, and execute the main browser journeys.
Capture build identifiers, test output, screenshots, and environment notes without exposing secrets.
Write production_artifacts/day-57-release-candidate-report.md.
```

### Day 58 — Final product review

```text
/goal @product @reviewer
Review the release candidate as a business owner rather than as an implementer.
Walk through retail, service, hybrid, account switching, role restrictions, stock, transaction, debt, insight, shared deployment, and dedicated deployment journeys.
Compare the observed behavior with production_artifacts/01-product-and-architecture-baseline.md.
List any behavior that is technically correct but confusing, misleading, or outside approved scope.
Fix only release-critical issues and write production_artifacts/day-58-product-review-report.md.
```

### Day 59 — Final security and recovery drill

```text
/goal @security @devops
Run the final adversarial tenant-isolation suite, multi-domain WebAuthn suite, authorization matrix, backup restore drill, migration rehearsal, rollback rehearsal, and secret/configuration scan.
Attempt to access another account through every high-risk object type and interface.
Confirm the product exclusions: no employee profiling, no raw benchmark export, and no individual behavioral scoring.
Write production_artifacts/day-59-final-security-recovery-report.md.
```

### Day 60 — Production gate and launch decision

```text
/goal @reviewer @product @architect @security @devops
Assemble the final release dossier from all production_artifacts/.
Check that the release candidate is reproducible, the acceptance criteria pass, the security gates pass, the deployment runbook works, and known limitations are documented.
Create production_artifacts/final-release-gate.md containing:
- release version;
- exact artifact/build identifier;
- passed acceptance criteria;
- test summary;
- security summary;
- backup and restore evidence;
- deployment mode evidence;
- unresolved issues and owners;
- rollback decision;
- GO, CONDITIONAL GO, or NO-GO recommendation.
Do not publish or deploy to a production production environment. Stop at the release decision unless a human explicitly authorizes the external deployment.
```

**Final human gate:** review the exact release dossier and authorize any external production deployment separately.
