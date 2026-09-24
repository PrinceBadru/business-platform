# Business Platform Execution Plan & Directives

This rule file contains the extracted directives from the Antigravity Execution Plan to guide development at every stage.

## 1. Architecture & Scope
- **Core Stack**: Next.js App Router, TypeScript, PostgreSQL 15+, Drizzle ORM, Tailwind CSS, shadcn/ui.
- **Tenancy**: PostgreSQL row-level security (RLS) with transaction-scoped `SET LOCAL app.current_account`.
- **Authentication**: 3 paths:
  1. Google/Microsoft OAuth.
  2. Enterprise OIDC/SAML SSO.
  3. Email/Password (Argon2id) with optional WebAuthn Passkeys.
- **Deployment**: Both shared mode and dedicated mode.
- **Starter Policy**: Selectively reuse the official Next.js SaaS Starter (scaffolding, generic UI, Drizzle setup). **Do NOT reuse** its authentication, tenancy (teams), or Stripe billing.
- **Deferred (Phase 2+)**: Price elasticity, forecasting, microservices, native mobile apps, payments/Stripe (unless approved).

## 2. Global Agent Contract
**Before changing files:**
1. Inspect the existing repository and `production_artifacts/`.
2. Restate the bounded objective, assumptions, affected modules, and risks.
3. Propose a short implementation plan and list the verification commands.
4. Do not broaden scope without recording the reason.

**While changing files:**
5. Follow the architecture document and module boundaries.
6. Treat tenant isolation, location authorization, authentication, and auditability as non-negotiable.
7. Add tests for new behavior and adversarial tests for access-control behavior.
8. **Never** use a client-supplied `account_id` or `location_id` as proof of authorization.
9. Never replace a failing security test with a weaker assertion.
10. Keep secrets out of source control and update `.env.example` when config changes.

**After changing files:**
11. Run the smallest relevant test set, then the full regression suite.
12. Run formatting, type checking, linting, migration checks, and build checks.
13. Start the application and verify the affected flow in the browser.
14. Write a handover artifact to `production_artifacts/` containing changes, tests, evidence, known issues, and next action.
15. Stop and ask for a decision when a missing choice materially changes product behavior, security, or deployment.

## 3. Daily Operating Loop
- **Plan**: @architect or @product inspects current state and produces a plan for one bounded slice.
- **Implement**: @engineer implements in active workspace or isolated worktree.
- **Verify**: @qa, @security, and @devops perform separate review passes.
- **Artifact**: Produce a Markdown handover, test output, and browser recordings/screenshots.
- Use `/goal` for bounded implementations. Use `/grill-me` for decision days.

## 4. Definition of Done
A feature is complete ONLY when:
- Approved behavior exists in the correct module.
- Server-side auth, RLS, and validation are enforced.
- Sensitive mutations are audited.
- Unit, integration, adversarial, and browser tests pass.
- Loading, empty, and error states are handled.
- Migrations work from an empty and representative database.
- A handover artifact contains reproducible commands and evidence.
