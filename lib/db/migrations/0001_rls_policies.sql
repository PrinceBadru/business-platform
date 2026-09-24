-- accounts
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "accounts" AS PERMISSIVE FOR ALL TO public
USING (id = nullif(current_setting('app.current_account', true), '')::uuid);

-- locations
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "locations" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);

-- user_account_roles
ALTER TABLE "user_account_roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "user_account_roles" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);

-- user_location_access
ALTER TABLE "user_location_access" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "user_location_access" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);

-- customers
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "customers" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);

-- suppliers
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "suppliers" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);

-- offerings
ALTER TABLE "offerings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "offerings" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);

-- transactions
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "transactions" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);

-- transaction_lines
ALTER TABLE "transaction_lines" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "transaction_lines" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);

-- debts
ALTER TABLE "debts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "debts" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);

-- debt_payments
ALTER TABLE "debt_payments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "debt_payments" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);

-- jobs
ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "jobs" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);

-- daily_summaries
ALTER TABLE "daily_summaries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "daily_summaries" AS PERMISSIVE FOR ALL TO public
USING (account_id = nullif(current_setting('app.current_account', true), '')::uuid);