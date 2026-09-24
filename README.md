# Business Platform

This project scaffold is intended to support a modular business application with secure architecture, test coverage, and production-ready delivery rituals.

## Included structure

- `.agents/`: operating guidance, skill definitions, and workflows
- `app/`: Next.js application
- `db/`: database schema, migrations, and seed data
- `modules/`: domain-specific modules
- `tests/`: automated validation
- `e2e/`: browser verification scenarios
- `infra/`: infrastructure assets
- `docs/`: internal documentation and runbooks
- `production_artifacts/`: release handoff materials

## Getting started

1. Install dependencies via `npm install` or the package manager you choose.
2. Copy `.env.example` to a local environment file and configure secrets.
3. Run the application and database setup commands defined in your package scripts.
4. Use the workflow guides in `.agents/workflows/` to keep delivery disciplined.
