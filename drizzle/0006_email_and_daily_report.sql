CREATE TABLE "email_settings" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"host" text NOT NULL,
	"port" integer DEFAULT 465 NOT NULL,
	"secure" boolean DEFAULT true NOT NULL,
	"username" text NOT NULL,
	"password_enc" text NOT NULL,
	"from_name" text DEFAULT '' NOT NULL,
	"from_email" text NOT NULL,
	"last_test_at" timestamp with time zone,
	"last_test_status" text,
	"last_test_message" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_reports" (
	"wedding_id" uuid PRIMARY KEY NOT NULL,
	"recipients" text DEFAULT '' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_sent_at" timestamp with time zone,
	"last_status" text,
	"last_message" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wedding_reports" ADD CONSTRAINT "wedding_reports_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE cascade ON UPDATE no action;