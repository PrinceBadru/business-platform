# Agent Operating Model

This repository is structured for a safe, modular product delivery workflow. The agent system and workflow files in this folder are intended to help maintain architectural quality, security, and operational reliability across the application lifecycle.

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

## Core principles

- Prefer explicit module boundaries over shared global state.
- Treat authentication, authorization, and database safety as first-class requirements.
- Verify behavior with tests before calling a slice complete.
- Capture release-ready artifacts for handoff and production operations.

## Workspace expectations

- `app/` contains the Next.js application shell and UI entrypoints.
- `db/` contains schema, migrations, and seed logic for the application data model.
- `modules/` contains domain-specific business capabilities with clear boundaries.
- `tests/` contains unit and integration verification for business rules.
- `e2e/` contains browser-based end-to-end coverage.
- `infra/` stores deployment and runtime infrastructure configuration.
- `docs/` contains system runbooks and architecture guidance.
- `production_artifacts/` stores release artifacts and operational handoff packs.

## Standard operating rhythm

1. Review architecture and constraints.
2. Plan the slice and maintain explicit acceptance criteria.
3. Implement the smallest viable solution inside domain boundaries.
4. Run tests and browser verification for the slice.
5. Hand off artifacts for deployment and operations review.

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
