import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { requireAdminPage } from "@/lib/session";
import { listAuditLogs, listSystemEvents } from "@/domain/platform/admin";
import { EmptyState, PageHeader } from "@/components/ui/Bits";
import { Chip, type Tone } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Audit logs" };
export const dynamic = "force-dynamic";

const LEVEL: Record<string, Tone> = { ERROR: "bad", WARN: "warn", INFO: "neutral" };
const when = (d: Date) => d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" });

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; level?: string }> }) {
  const admin = await requireAdminPage("/admin/audit");
  const { tab, q = "", level } = await searchParams;
  const errors = tab === "errors";
  const lvl = level === "ERROR" || level === "WARN" || level === "INFO" ? level : undefined;
  const [logs, events] = await Promise.all([errors ? Promise.resolve([]) : listAuditLogs(admin, { q }), errors ? listSystemEvents(admin, { level: lvl }) : Promise.resolve([])]);
  const tabCls = (on: boolean) => cn("min-h-11 border-b-2 px-4 text-[14.5px]", on ? "border-accent font-medium" : "border-transparent text-muted hover:text-ink");
  return (
    <>
      <PageHeader eyebrow="System" title="Audit & errors" lede="Who changed what, and anything that went wrong behind the scenes. Nothing here can be edited." />
      <nav aria-label="Log type" className="mb-6 flex border-b border-rule">
        <Link className={tabCls(!errors)} href="/admin/audit" aria-current={!errors ? "page" : undefined}>Activity</Link>
        <Link className={tabCls(errors)} href="/admin/audit?tab=errors" aria-current={errors ? "page" : undefined}>System events</Link>
      </nav>

      {errors ? (
        <>
          <div className="mb-4 flex gap-2" role="group" aria-label="Filter by level">
            {[["", "All"], ["ERROR", "Errors"], ["WARN", "Warnings"], ["INFO", "Info"]].map(([v, l]) => (
              <Link key={v} href={`/admin/audit?tab=errors${v ? `&level=${v}` : ""}`} className={cn("chip", (lvl ?? "") === v ? "chip-accent" : "chip-neutral")}>{l}</Link>
            ))}
          </div>
          {events.length === 0 ? <EmptyState title="All quiet" body="No system events match." /> : (
            <ul className="divide-y divide-rule">
              {events.map(({ e, wedding }) => (
                <li key={e.id} className="py-3.5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><Chip tone={LEVEL[e.level]}>{e.level.toLowerCase()}</Chip><span className="font-medium">{e.area}</span><time className="ml-auto text-[12.5px] text-muted tnum" dateTime={e.createdAt.toISOString()}>{when(e.createdAt)}</time></div>
                  <p className="mt-1.5 text-[14.5px]">{e.message}</p>
                  <p className="text-[12.5px] text-muted">{wedding ?? "Platform"}</p>
                  {Object.keys(e.metadata).length > 0 && <details className="mt-1.5"><summary className="cursor-pointer text-[12.5px] text-muted">Details</summary><pre className="mt-2 overflow-x-auto rounded bg-paper-2 p-3 text-[12px]">{JSON.stringify(e.metadata, null, 2)}</pre></details>}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <form role="search" className="relative mb-5 max-w-md">
            <label className="sr-only" htmlFor="aq">Search activity</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="aq" name="q" defaultValue={q} placeholder="Search an action or a person…" className="field-input !pl-9" />
          </form>
          {logs.length === 0 ? <EmptyState title="Nothing recorded" body="Changes to weddings, guests, packages and access are logged here." /> : (
            <div className="overflow-x-auto">
              <table className="ledger">
                <thead><tr><th>When</th><th>Who</th><th>What</th><th>Wedding</th></tr></thead>
                <tbody>
                  {logs.map(({ log, wedding }) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap text-[13.5px] tnum">{when(log.createdAt)}</td>
                      <td className="text-[13.5px]">{log.actorLabel || "System"}</td>
                      <td>{log.action.replace(/[._]/g, " ")}</td>
                      <td className="text-[13.5px] text-muted">{wedding ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
