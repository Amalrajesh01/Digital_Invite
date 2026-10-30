ALTER TABLE "guests" ADD COLUMN "name_local" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "city" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "table_label" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "room_label" text DEFAULT '' NOT NULL;
--> statement-breakpoint
-- The Luxury package gains "Personal touches throughout". ensurePackages never overwrites a stored package, so the new key is added
-- here, once, and only where Luxury does not already list it: a feature set edited in Studio -> Packages is otherwise left alone.
UPDATE "wedding_packages" SET "features" = "features" || '["personal_touch"]'::jsonb WHERE "key" = 'LUXURY' AND NOT ("features" @> '["personal_touch"]'::jsonb);
