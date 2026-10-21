ALTER TABLE "media_assets" ADD COLUMN "provider" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
-- Every invitation that exists today keeps 'legacy' (its files stay where they are until the migration tool moves them). This is a
-- column default, not an UPDATE: no existing row is written. Only invitations created from now on default to 'cloudinary'.
ALTER TABLE "weddings" ADD COLUMN "media_storage" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "media_storage" SET DEFAULT 'cloudinary';
