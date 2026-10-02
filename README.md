# Nexus Finance

A robust, multi-tenant Business Management Platform built to handle Point of Sale (POS), Inventory, CRM, Supplier Management, Debts, and Analytics for both Retail and Service-based businesses.

## Key Features

- **Multi-Tenant Architecture**: Strict data isolation at the database level and application-level tenant contexts to securely separate businesses.
- **Dynamic Business Types**: Configuration-driven UI and logic that adapts based on the business type (Retail vs. Services).
- **Flexible Authentication**: Users sign in with **email or username** and password. Passkeys (WebAuthn) can be registered as an alternative on any account. Usernames allow multiple users sharing the same email domain (e.g. a shared company inbox) to maintain distinct identities.
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
- **Testing**: Vitest (Unit) & Playwright (E2E)

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

   > If you prefer a local Postgres install, skip this step and update `POSTGRES_URL` in `.env.local` accordingly.

4. **Environment Setup**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   The default `POSTGRES_URL` in `.env.example` already points to the Docker container — no changes needed if you used `docker compose up`.

5. **Database Setup**
   Apply database migrations and seed demo data:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
   *(If you modify `lib/db/schema.ts` in the future, run `npm run db:generate` first to generate new SQL migrations).*

6. **Run the Application**
   Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`. Unauthenticated users are redirected to `/sign-in`.

## Authentication

### Sign In
Navigate to `/sign-in`. The **Email or Username** field accepts either:
- A full email address (`you@example.com`)
- A username (`your_username`)

The server detects which type was entered (by the presence of `@`) and looks up the account accordingly. Both password and passkey (WebAuthn) sign-in are supported.

### Sign Up
Navigate to `/sign-up`. New users must provide:
- **Full Name** (optional display name)
- **Username** — globally unique, 3–50 characters, letters/numbers/underscores only. This is the primary fallback identifier for businesses where multiple staff share an email domain.
- **Email** — globally unique
- **Password**

After account creation, users are redirected to **`/onboarding`** to set up their first business before accessing the dashboard.

### Onboarding (New Users)
Users who sign up but have no tenant yet land on `/onboarding`. Here they define:
- **Business name**
- **Business type** (Retail / Services / Hybrid)
- **First location name**

This creates the account, assigns the user as Owner, grants location access, and binds the tenant to their session — then redirects to `/dashboard`.

## Demo Accounts

Running `npm run db:seed` creates two isolated demo tenants with real, functional credentials. Both accounts support **password sign-in** (by email or username) and optionally **passkey (WebAuthn)** registration.

| Tenant | Business Type | Email | Username | Password |
|---|---|---|---|---|
| Acme Retail | Retail | `admin@acmeretail.com` | `acme_admin` | `password123` |
| Globex Services | Services | `admin@globex.com` | `globex_admin` | `password123` |
| Insights Demo | Hybrid | `admin@insights.com` | `insights_admin` | `password123` |

> [!NOTE]
> Each tenant is fully isolated — signing in as `admin@acmeretail.com` will only show Acme Retail data, and vice versa.

## Running Tests

### 1. Unit & Integration Tests (Vitest)
```bash
npm run test
```

### 2. End-to-End Tests (Playwright)
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
- `lib/db/`: Database schema definitions (`schema.ts`), Drizzle client, migrations (`migrations/`), and seed assets (`seed.ts`).
- `modules/`: Domain modules (Analytics, CRM, Inventory, Transactions, etc.) with clear boundaries, keeping domain logic strictly separated from UI presentation.
- `e2e/`: Browser-based end-to-end tests.
- `production_artifacts/`: Release and handoff evidence generated during development.
