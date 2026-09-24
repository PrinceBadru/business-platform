# Business Platform

This repository is organized to support a disciplined product and engineering workflow with explicit boundaries for application, data, module logic, testing, infrastructure, and operations.

## Recommended structure

- `app/`: Next.js application entrypoints and UI shell.
- `db/`: database schema, migrations, and seed assets.
- `modules/`: domain modules with clear ownership boundaries.
- `tests/`: unit and integration tests.
- `e2e/`: browser-based end-to-end tests.
- `infra/`: deployment and runtime infrastructure assets.
- `docs/`: system and operational documentation.
- `production_artifacts/`: release and handoff evidence.

## Delivery expectations

- Keep domain logic separate from UI presentation and transport concerns.
- Verify the behavior with tests relevant to the slice.
- Guard against security or authorization regressions before release.
- Produce operational artifacts for production handoff.
