import Link from "next/link";
import { cn } from "@/lib/cn";

export function EmptyState({ title, body, action, className, mark }: { title: string; body?: React.ReactNode; action?: React.ReactNode; className?: string; mark?: string }) {
  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center px-6 py-14 text-center", className)}>
      {mark ? <div aria-hidden className="display text-[44px] leading-none text-brass">{mark}</div> : (
        <img src="/brand/mark.png" alt="" aria-hidden className="size-11 object-contain" />
      )}
      <h3 className="display mt-4 text-[26px]">{title}</h3>
      {body && <p className="mt-2 text-[14.5px] text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function PageHeader({ eyebrow, title, lede, actions, className }: { eyebrow?: string; title: React.ReactNode; lede?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="display text-[clamp(30px,4vw,44px)]">{title}</h1>
        {lede && <p className="lede mt-2">{lede}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** A ledger row of numbers: big serif figures divided by hairlines — instead of a wall of stat cards. */
export function Ledger({ items, className }: { items: { label: string; value: React.ReactNode; note?: React.ReactNode; href?: string }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 border-y border-rule-strong md:grid-flow-col md:auto-cols-fr", className)}>
      {items.map((it, i) => {
        const inner = (
          <>
            <dt className="eyebrow">{it.label}</dt>
            <dd className="display tnum mt-1.5 text-[38px]">{it.value}</dd>
            {it.note && <div className="mt-0.5 text-[13px] text-muted">{it.note}</div>}
          </>
        );
        const cls = cn("px-4 py-4 md:py-5", i % 2 === 1 && "border-l border-rule", i >= 2 && "border-t border-rule md:border-t-0", i > 0 && "md:border-l md:border-rule");
        return it.href ? (
          <Link key={it.label} href={it.href} className={cn(cls, "transition-colors hover:bg-paper-2")}>
            {inner}
          </Link>
        ) : (
          <div key={it.label} className={cls}>
            {inner}
          </div>
        );
      })}
    </dl>
  );
}

export function Section({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mt-10", className)}>
      <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-rule pb-2">
        <h2 className="display text-[26px]">{title}</h2>
        {aside && <div className="text-[13.5px] text-muted">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

export function Meter({ value, max, tone = "accent", label }: { value: number; max: number; tone?: "accent" | "ok" | "brass"; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = tone === "ok" ? "bg-ok" : tone === "brass" ? "bg-brass" : "bg-accent";
  return (
    <div role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label} className="h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-rule-strong bg-surface px-1.5 py-0.5 text-[11.5px] font-medium text-muted">{children}</kbd>;
}
