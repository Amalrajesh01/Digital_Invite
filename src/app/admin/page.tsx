import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireAdminPage } from "@/lib/session";
import { adminDashboard } from "@/domain/platform/admin";
import { EmptyState, Ledger, PageHeader, Section } from "@/components/ui/Bits";
import { LinkButton } from "@/components/ui/Button";
import { PackageChip, StatusChip } from "@/components/ui/Chip";
import { daysBetween, todayInZone, formatDateLong } from "@/lib/time";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const TONE = { warn: "bg-warn", bad: "bg-bad", info: "bg-info" } as const;

function greet(name: string) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const w = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${w}${name ? `, ${name.split(" ")[0]}` : ""}`;
}

export default async function AdminHome() {
  const admin = await requireAdminPage();
  const d = await adminDashboard(admin);
  const today = todayInZone("Asia/Kolkata");
  return (
    <>
      <PageHeader eyebrow={formatDateLong(today)} title={greet(admin.name)} lede="Here is what needs you, what is coming up, and how your invitations are doing." actions={<LinkButton href="/admin/weddings/new" variant="accent">New wedding</LinkButton>} />

      {d.weddings.length === 0 ? (
        <EmptyState title="Your first wedding starts here" body="The 16-step wizard takes you from package to published invitation. Everything autosaves." action={<LinkButton href="/admin/weddings/new" variant="accent">Create a wedding</LinkButton>} />
      ) : (
        <>
          <Ledger
            items={[
              { label: "Live invitations", value: d.stats.weddings.live, note: `${d.stats.weddings.drafts} in draft`, href: "/admin/weddings" },
              { label: "Guests invited", value: d.stats.guests, note: `${d.stats.rsvpReplies} replies`, href: "/admin/guests" },
              { label: "Views · 30 days", value: d.stats.views30.toLocaleString("en-IN"), note: `${d.stats.visitors30.toLocaleString("en-IN")} visitors`, href: "/admin/analytics" },
              { label: "Guest photos", value: d.stats.guestUploads, note: d.stats.pendingUploads ? `${d.stats.pendingUploads} waiting` : "all reviewed" },
              { label: "Check-ins", value: d.stats.checkins, note: `${d.stats.guestbook} wishes` },
            ]}
          />

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
            <div>
              <Section title="Needs your attention" aside={d.attention.length ? `${d.attention.length} item${d.attention.length === 1 ? "" : "s"}` : undefined} className="!mt-0">
                {d.attention.length === 0 ? (
                  <p className="py-8 text-muted">Nothing is waiting on you. Enjoy the quiet.</p>
                ) : (
                  <ul className="divide-y divide-rule">
                    {d.attention.map((a) => (
                      <li key={a.id}>
                        <Link href={a.href} className="group flex items-center gap-4 py-3.5 transition-colors hover:bg-paper-2/60 sm:-mx-3 sm:px-3">
                          <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", TONE[a.tone])} />
                          <span className="min-w-0 flex-1"><span className="block text-[15px] font-medium">{a.title}</span><span className="block truncate text-[13.5px] text-muted">{a.detail}</span></span>
                          <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Recent activity">
                <ul className="divide-y divide-rule text-[14px]">
                  {d.activity.map((l) => (
                    <li key={l.id} className="flex items-baseline justify-between gap-4 py-2.5">
                      <span className="min-w-0 truncate"><span className="text-ink-2">{l.actorLabel}</span> <span className="text-muted">·</span> {l.action.replace(/[._]/g, " ")}</span>
                      <time className="shrink-0 text-[12.5px] text-muted tnum" dateTime={l.createdAt.toISOString()}>{l.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</time>
                    </li>
                  ))}
                  {d.activity.length === 0 && <li className="py-6 text-muted">No activity yet.</li>}
                </ul>
              </Section>
            </div>

            <div>
              <Section title="Coming up" className="!mt-0">
                <ol className="divide-y divide-rule">
                  {d.upcoming.map((w) => {
                    const days = daysBetween(today, w.weddingDate!);
                    return (
                      <li key={w.id}>
                        <Link href={`/admin/weddings/${w.id}`} className="flex items-center gap-4 py-3.5 transition-colors hover:bg-paper-2/60 sm:-mx-3 sm:px-3">
                          <div className="w-14 shrink-0 text-center"><div className="display tnum text-[30px] leading-none">{days < 0 ? "•" : days}</div><div className="eyebrow !text-[9.5px]">{days === 0 ? "today" : days < 0 ? "was" : days === 1 ? "day" : "days"}</div></div>
                          <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-medium">{w.title || w.slug}</p><p className="text-[13px] text-muted">{formatDateLong(w.weddingDate!)}</p></div>
                          <div className="flex flex-col items-end gap-1"><StatusChip status={w.effective} /><PackageChip pkg={w.packageKey} /></div>
                        </Link>
                      </li>
                    );
                  })}
                  {d.upcoming.length === 0 && <li className="py-6 text-muted">No dated weddings yet.</li>}
                </ol>
              </Section>

              {d.recentErrors.length > 0 && (
                <Section title="System notes" aside={<Link className="underline underline-offset-4" href="/admin/audit?tab=errors">View all</Link>}>
                  <ul className="space-y-3 text-[13.5px]">
                    {d.recentErrors.map((e) => (
                      <li key={e.id} className="flex gap-3"><span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", e.level === "ERROR" ? "bg-bad" : "bg-warn")} /><div className="min-w-0"><p className="truncate"><span className="font-medium">{e.area}</span> — {e.message}</p><p className="text-muted">{e.weddingTitle ?? "Platform"}</p></div></li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
