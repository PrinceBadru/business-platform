# Nexus Finance - v0.1.0 MVP Release

## Overview
This release marks the completion of the Nexus Finance MVP (Sprints A, B, and C). The application is fully equipped to handle Point of Sale (POS), Inventory Management, Debt tracking, and Analytics, with complete multi-tenant isolation.

## Features Delivered
- **Core Multi-Tenancy**: Strict RLS isolation and workspace context management.
- **Transactions & Checkout**: POS interface with barcode scanner support, cart calculation, and refunds.
- **Inventory & Suppliers**: Stock movement audit trailing and low-stock alerts.
- **Debt Management**: UI for recording partial and full payments against customer balances.
- **Background Jobs System**: Scheduled aggregation of daily summaries without external Redis dependencies.
- **Activity Log**: Interactive audit trail for tracking all actions by users within an account.
- **Authentication**: Email/username + Password, Passkeys (WebAuthn), and Google OAuth.
- **DevOps & Production Readiness**: Caddy reverse proxy, Docker compose DB, Health endpoint, structured JSON logging, and daily DB backup script.
- **Error Handling**: Global React Error Boundaries and Suspense fallbacks across the Next.js routing tree.

## Setup Instructions
Please refer to the `README.md` for full local setup instructions, including the Docker compose configuration and test credentials.

## Testing & QA
- **Unit Tests**: Executed via Vitest (covering pricing logic, RBAC checks, and jobs).
- **E2E Tests**: Playwright scripts verifying core user journeys (Checkout, Auth, isolation).
- **A11y/Performance**: UI components use `shadcn/ui` with accessible ARIA attributes. Database indexes (`GIN` on search fields, `btree` on foreign keys) ensure query performance at scale.

*Release signed off and ready for deployment.*
