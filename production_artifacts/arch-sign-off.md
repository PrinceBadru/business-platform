# Architectural Decisions Sign-off

This document records the final decisions made by the project architect regarding the 6 open design questions from the replacement plan. These decisions clear the way for Phase 1 through Phase 5 implementation.

## Recorded Decisions

| ID | Topic | Decision Made | Impacted Phase |
|---|---|---|---|
| **D1** | Session Expiry | **Rolling window** (e.g., expires after 7 days of inactivity, refreshed upon usage). | Phase 2 (Session schema, middleware) |
| **D2** | Named Permissions | **Granular claims**: `locations:read`, `locations:write`, `staff:manage`, `inventory:manage`, `transactions:manage`. | Phase 3 (RBAC data models) |
| **D3** | Deployment Mode | **Both `shared` and `dedicated` modes** are in scope for Phase 1 MVP. | Phase 1 & 5 |
| **D4** | Argon2 Profile | **OWASP 2025 defaults**: `Argon2id`, `memoryCost: 65536`, `timeCost: 3`, `parallelism: 4`. | Phase 2 (Auth integration) |
| **D5** | Passwordless | **Password fallback required**: passkeys act as an optional step-up or convenience login. Pure-passwordless accounts are deferred. | Phase 2 (WebAuthn flows) |
| **D6** | Stripe Billing | **Fully deferred** to post-MVP (Phase 6+). | Phase 4 (Stripe adapter) |

**Status:** APPROVED
**Date:** 2026-09-24
