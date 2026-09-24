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
- PostgreSQL (v14 or higher) running locally or remotely.

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

3. **Environment Setup**
   Copy `.env.example` to `.env.local` (and `.env` for production):
   ```bash
   cp .env.example .env.local
   ```
   *Ensure you update the `DATABASE_URL` in your `.env.local` to point to your Postgres instance.*

4. **Database Setup**
   Push the schema to the database and run the seed script to populate initial data and the default tenant:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Run the Application**
   Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`. By default, unauthenticated users will be securely redirected to the `/sign-in` page. *(Note: Check the seed script or local DB for test user credentials).*

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
