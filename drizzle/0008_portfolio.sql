CREATE TABLE "portfolio_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'wedding' NOT NULL,
	"template_slug" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"cover_asset_id" uuid,
	"wedding_id" uuid,
	"show_live" boolean DEFAULT false NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"consent_note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_cover_asset_id_media_assets_id_fk" FOREIGN KEY ("cover_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_slug_uq" ON "portfolio_items" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "portfolio_status_idx" ON "portfolio_items" USING btree ("status","sort_order");