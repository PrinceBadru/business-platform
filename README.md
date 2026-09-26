# Business Management Platform

A robust, multi-tenant Business Management Platform built to handle Point of Sale (POS), Inventory, CRM, Supplier Management, Debts, and Analytics for both Retail and Service-based businesses.

## Key Features

- **Multi-Tenant Architecture**: Strict data isolation at the database level and application-level tenant contexts to securely separate businesses.
- **Dynamic Business Types**: Configuration-driven UI and logic that adapts based on the business type (Retail vs. Services).
- **Comprehensive Modules**:
  - **Inventory & Suppliers**: Manage stock, variants, categories, and track supplier orders.
  - **CRM & Customers**: Customer loyalty, purchase history, and contact management.
  - **POS & Checkout**: Process transactions, apply discounts, and manage refunds with automatic stock restoration.
  - **Debts**: Track and manage outstanding customer balances and payments.
  - **Analytics**: Aggregated financial reporting, daily summaries, and performance benchmarking.
- **Background Jobs System**: Native, database-backed background worker for processing async tasks (e.g., daily analytics aggregation) without relying on Redis or external services.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS & shadcn/ui
- **Testing**: Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Docker & Docker Compose (recommended) **or** a local PostgreSQL v14+ instance

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/PrinceBadru/business-platform.git
   cd business-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the Database (Docker)**
   The easiest way to get Postgres running locally is via Docker Compose:
   ```bash
   docker compose up -d
   ```
   This starts a Postgres 15 container on **port 5433** with the following defaults:
   | Setting | Value |
   |---|---|
   | Host | `localhost` |
   | Port | `5433` |
   | Database | `business_platform` |
   | User | `postgres` |
   | Password | `postgres` |

   > If you prefer a local Postgres install, skip this step and update `DATABASE_URL` in `.env.local` accordingly.

4. **Environment Setup**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   The default `DATABASE_URL` in `.env.example` already points to the Docker container — no changes needed if you used `docker compose up`.

5. **Database Setup**
   Push the schema to the database and seed demo data:
   ```bash
   npm run db:push
   npm run db:seed
   ```

6. **Run the Application**
   Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`. Unauthenticated users are redirected to `/sign-in`.

## Demo Accounts

Running `npm run db:seed` creates two isolated demo tenants. Authentication uses **passkeys (WebAuthn)** — register a passkey on first sign-in tied to the email below.

| Tenant | Business Type | Email | Role |
|---|---|---|---|
| Acme Retail | Retail | `admin@acmeretail.com` | Owner |
| Globex Services | Services | `admin@globex.com` | Owner |

**To sign in:**
1. Navigate to `http://localhost:3000/sign-in`
2. Enter one of the emails above
3. Follow the passkey / WebAuthn browser prompt to register or authenticate

> [!NOTE]
> Each tenant is fully isolated — signing in as `admin@acmeretail.com` will only show Acme Retail data, and vice versa.

## Running Tests

End-to-end testing is configured via Playwright to ensure critical workflows (like routing and access control) function correctly in a real browser environment.

1. **Install Playwright Browsers** (First time only)
   ```bash
   npx playwright install --with-deps chromium
   ```

2. **Run E2E Tests**
   ```bash
   npx playwright test
   ```
   *The test runner is configured to automatically spin up a local Next.js server before executing the suites.*

## Project Structure

This project follows a disciplined structure with explicit boundaries:

- `app/`: Next.js application routes and UI shell.
- `db/`: Database schema definitions, configurations, and seed assets.
- `modules/`: Domain modules (Analytics, CRM, Inventory, Transactions, etc.) with clear boundaries, keeping domain logic strictly separated from UI presentation.
- `e2e/`: Browser-based end-to-end tests.
- `production_artifacts/`: Release and handoff evidence generated during development.
