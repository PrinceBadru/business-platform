# Database and RLS

Use this skill for schema changes, query patterns, access control, and database-facing feature implementation.

## Guardrails

- Prefer typed schema and migration-driven changes.
- Keep data access patterns explicit and repository-oriented.
- Validate row-level security rules before shipping user-scoped features.
- Minimize privilege escalation and accidental cross-tenant reads.

## Checklist

- Confirm the table schema matches the domain model.
- Review indexes and query paths for common access patterns.
- Verify RLS policies for read and write access.
- Validate admin paths are isolated from user-facing APIs.

## Review output

Summarize the schema decision, list policy assumptions, and highlight verification steps required before deployment.
