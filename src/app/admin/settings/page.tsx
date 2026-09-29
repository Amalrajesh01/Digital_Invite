import type { Metadata } from "next";
import { eq, sql } from "drizzle-orm";
import { requireAdminPage } from "@/lib/session";
import { getDb, schema } from "@/db/client";
import { env } from "@/lib/env";
import { LOCALES } from "@/domain/doc/constants";
import { PageHeader, Section } from "@/components/ui/Bits";
import { Chip } from "@/components/ui/Chip";
import { PasswordForm } from "@/components/workspace/PasswordForm";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await requireAdminPage("/admin/settings");
  const db = await getDb();
  const [{ free }] = await db.select({ free: sql<number>`count(*)::int` }).from(schema.weddings).where(eq(schema.weddings.customerClass, "FREE_PORTFOLIO"));
  const usingLocalDb = !env.databaseUrl;
  const rows: { label: string; value: string; ok: boolean; help?: string }[] = [
    { label: "Public address", value: env.appUrl, ok: env.isProd ? !env.appUrl.includes("localhost") : true, help: "Set APP_URL to your real domain so invitation links and WhatsApp previews are correct." },
    { label: "Database", value: usingLocalDb ? "Built-in local database" : "PostgreSQL (Supabase or similar)", ok: env.isProd ? !usingLocalDb : true, help: "Set DATABASE_URL to a hosted Postgres for production." },
    { label: "Photo & video storage", value: env.storageDriver === "s3" ? `Object storage · ${env.s3.bucket || "bucket not set"}` : "This server’s disk", ok: env.isProd ? env.storageDriver === "s3" : true, help: "Use Cloudflare R2 (STORAGE_DRIVER=s3) on hosts without a permanent disk." },
    { label: "Email", value: env.resendKey ? "Resend connected" : "Not connected — emails are kept in the outbox", ok: !!env.resendKey, help: "Add RESEND_API_KEY to send invitations and client sign-in emails." },
  ];
  return (
    <>
      <PageHeader eyebrow="System" title="Settings" lede="Your account and the health of the platform." />
      <Section title="Platform health" className="!mt-0">
        <ul className="divide-y divide-rule">
          {rows.map((r) => (
            <li key={r.label} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3.5">
              <div className="min-w-0"><p className="font-medium">{r.label}</p><p className="text-[13.5px] text-muted">{r.value}</p></div>
              {r.ok ? <Chip tone="ok">Ready</Chip> : <div className="text-right"><Chip tone="warn">Needs attention</Chip><p className="mt-1 max-w-xs text-[12.5px] text-muted">{r.help}</p></div>}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Local language">
        <p className="max-w-2xl text-[14.5px] text-ink-2">The language guests can switch to is chosen per wedding, when you create it (in the wizard’s language step). Available now: {LOCALES.map((l) => `${l.label} (${l.native})`).join(", ")}. English is always included.</p>
      </Section>
      <Section title="Portfolio weddings"><p className="text-[14.5px] text-ink-2">{free} of your first 5 customers are marked <span className="font-medium">free · portfolio</span>. Change a wedding’s class in its settings.</p></Section>
      <Section title="Your account">
        <p className="mb-5 text-[14.5px] text-ink-2">Signed in as <span className="font-medium">{admin.email}</span>.</p>
        <PasswordForm />
      </Section>
    </>
  );
}
