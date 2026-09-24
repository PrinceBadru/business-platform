ALTER TABLE "accounts" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;