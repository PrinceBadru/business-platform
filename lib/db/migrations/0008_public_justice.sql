CREATE TABLE "analytics_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"location_id" uuid,
	"offering_id" uuid,
	"metric_key" varchar(100) NOT NULL,
	"comparison_key" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"computed_value" jsonb NOT NULL,
	"baseline_value" jsonb,
	"trigger_type" varchar(50),
	"first_fired_at" timestamp DEFAULT now() NOT NULL,
	"last_fired_at" timestamp DEFAULT now() NOT NULL,
	"consecutive_periods" integer DEFAULT 1 NOT NULL,
	"formula_version" integer DEFAULT 1 NOT NULL,
	"computation_run_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_computation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"job_type" varchar(100) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"status" varchar(50) NOT NULL,
	"rows_read" integer DEFAULT 0,
	"rows_written" integer DEFAULT 0,
	"error_details" text,
	"watermark" timestamp,
	"formula_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_daily_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"business_date" date NOT NULL,
	"revenue_cents" integer DEFAULT 0 NOT NULL,
	"cogs_cents" integer DEFAULT 0 NOT NULL,
	"gross_profit_cents" integer DEFAULT 0 NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"customer_count" integer DEFAULT 0 NOT NULL,
	"credit_sales_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"formula_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_daily_customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"business_date" date NOT NULL,
	"revenue_cents" integer DEFAULT 0 NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"credit_sales_cents" integer DEFAULT 0 NOT NULL,
	"formula_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_daily_location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"business_date" date NOT NULL,
	"revenue_cents" integer DEFAULT 0 NOT NULL,
	"cogs_cents" integer DEFAULT 0 NOT NULL,
	"gross_profit_cents" integer DEFAULT 0 NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"formula_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_daily_offering" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"location_id" uuid,
	"offering_id" uuid NOT NULL,
	"business_date" date NOT NULL,
	"quantity_sold" integer DEFAULT 0 NOT NULL,
	"revenue_cents" integer DEFAULT 0 NOT NULL,
	"cogs_cents" integer DEFAULT 0 NOT NULL,
	"gross_profit_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"price_observation_count" integer DEFAULT 0 NOT NULL,
	"sum_price" integer DEFAULT 0 NOT NULL,
	"formula_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_daily_supplier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"business_date" date NOT NULL,
	"purchase_volume_cents" integer DEFAULT 0 NOT NULL,
	"formula_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_dirty_scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"location_id" uuid,
	"business_date" date NOT NULL,
	"metric_families_dirty" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"offering_ids_changed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"customer_ids_changed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"supplier_ids_changed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_event_watermark" timestamp DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"next_run_at" timestamp DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_inventory_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"location_id" uuid,
	"offering_id" uuid NOT NULL,
	"business_date" date NOT NULL,
	"opening_stock" integer DEFAULT 0 NOT NULL,
	"closing_stock" integer DEFAULT 0 NOT NULL,
	"stock_value_cents" integer DEFAULT 0 NOT NULL,
	"formula_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_metric_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"location_id" uuid,
	"offering_id" uuid,
	"metric_key" varchar(100) NOT NULL,
	"period_key" varchar(50) NOT NULL,
	"value" jsonb NOT NULL,
	"sufficiency_status" varchar(50) DEFAULT 'computed' NOT NULL,
	"formula_version" integer DEFAULT 1 NOT NULL,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"source_watermark" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "timezone" varchar(50) DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction_lines" ADD COLUMN "unit_cost_at_time_of_sale_cents" integer;--> statement-breakpoint
ALTER TABLE "transaction_lines" ADD COLUMN "discount_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "discount_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_alerts" ADD CONSTRAINT "analytics_alerts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_alerts" ADD CONSTRAINT "analytics_alerts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_alerts" ADD CONSTRAINT "analytics_alerts_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_computation_runs" ADD CONSTRAINT "analytics_computation_runs_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_account" ADD CONSTRAINT "analytics_daily_account_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_customer" ADD CONSTRAINT "analytics_daily_customer_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_customer" ADD CONSTRAINT "analytics_daily_customer_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_location" ADD CONSTRAINT "analytics_daily_location_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_location" ADD CONSTRAINT "analytics_daily_location_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_offering" ADD CONSTRAINT "analytics_daily_offering_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_offering" ADD CONSTRAINT "analytics_daily_offering_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_offering" ADD CONSTRAINT "analytics_daily_offering_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_supplier" ADD CONSTRAINT "analytics_daily_supplier_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_supplier" ADD CONSTRAINT "analytics_daily_supplier_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_dirty_scopes" ADD CONSTRAINT "analytics_dirty_scopes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_dirty_scopes" ADD CONSTRAINT "analytics_dirty_scopes_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_inventory_daily" ADD CONSTRAINT "analytics_inventory_daily_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_inventory_daily" ADD CONSTRAINT "analytics_inventory_daily_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_inventory_daily" ADD CONSTRAINT "analytics_inventory_daily_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_metric_snapshots" ADD CONSTRAINT "analytics_metric_snapshots_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_metric_snapshots" ADD CONSTRAINT "analytics_metric_snapshots_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_metric_snapshots" ADD CONSTRAINT "analytics_metric_snapshots_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alerts_unique_idx" ON "analytics_alerts" USING btree ("account_id","location_id","offering_id","metric_key","comparison_key") WHERE "analytics_alerts"."status" IN ('active', 'candidate');--> statement-breakpoint
CREATE UNIQUE INDEX "daily_account_date_idx" ON "analytics_daily_account" USING btree ("account_id","business_date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_customer_date_idx" ON "analytics_daily_customer" USING btree ("customer_id","business_date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_location_date_idx" ON "analytics_daily_location" USING btree ("location_id","business_date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_offering_date_idx" ON "analytics_daily_offering" USING btree ("location_id","offering_id","business_date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_supplier_date_idx" ON "analytics_daily_supplier" USING btree ("supplier_id","business_date");--> statement-breakpoint
CREATE INDEX "dirty_scopes_account_status_idx" ON "analytics_dirty_scopes" USING btree ("account_id","status","next_run_at");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_inventory_date_idx" ON "analytics_inventory_daily" USING btree ("location_id","offering_id","business_date");--> statement-breakpoint
CREATE UNIQUE INDEX "metric_snapshots_unique_idx" ON "analytics_metric_snapshots" USING btree ("account_id","location_id","offering_id","metric_key","period_key");--> statement-breakpoint
ALTER TABLE "transaction_lines" ADD CONSTRAINT "discount_cents_positive" CHECK ("transaction_lines"."discount_cents" >= 0);--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "discount_cents_positive" CHECK ("transactions"."discount_cents" >= 0);