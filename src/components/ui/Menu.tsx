"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

export interface MenuItem {
  label: string;
  onSelect?: () => void;
  href?: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  divider?: boolean;
}

/** Accessible overflow menu: arrow-key navigation, Escape to close, outside click to dismiss. */
export function Menu({ items, label = "Actions", trigger, align = "right" }: { items: MenuItem[]; label?: string; trigger?: React.ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), wrap.current?.querySelector("button")?.focus());
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>("[role=menuitem]:not([aria-disabled=true])")?.focus());
    return () => {
      document.removeEventListener("mousedown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const move = (dir: 1 | -1) => {
    const els = [...(list.current?.querySelectorAll<HTMLElement>("[role=menuitem]:not([aria-disabled=true])") ?? [])];
    const i = els.indexOf(document.activeElement as HTMLElement);
    els[(i + dir + els.length) % els.length]?.focus();
  };

  return (
    <div ref={wrap} className="relative inline-block text-left">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={id} aria-label={label} onClick={() => setOpen((o) => !o)} className={trigger ? undefined : "btn btn-ghost btn-sm !px-2"}>
        {trigger ?? <MoreHorizontal className="size-[18px]" />}
      </button>
      {open && (
        <ul
          ref={list}
          id={id}
          role="menu"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
            if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
            if (e.key === "Tab") setOpen(false);
          }}
          className={cn("absolute z-40 mt-1 min-w-52 rounded-md border border-rule-strong bg-surface p-1 shadow-[var(--shadow-2)] [animation:sheet-in_.15s_var(--ease)]", align === "right" ? "right-0" : "left-0")}
        >
          {items.map((it, i) => {
            const cls = cn("flex w-full items-center rounded px-3 py-2 text-left text-[14px] outline-none focus-visible:bg-paper-2", it.disabled ? "cursor-not-allowed opacity-45" : "hover:bg-paper-2", it.tone === "danger" && "text-bad");
            return (
              <li key={i} role="none" className={cn(it.divider && "mt-1 border-t border-rule pt-1")}>
                {it.href && !it.disabled ? (
                  <Link role="menuitem" href={it.href} className={cls} onClick={() => setOpen(false)}>
                    {it.label}
                  </Link>
                ) : (
                  <button
                    role="menuitem"
                    type="button"
                    aria-disabled={it.disabled}
                    className={cls}
                    onClick={() => {
                      if (it.disabled) return;
                      setOpen(false);
                      it.onSelect?.();
                    }}
                  >
                    {it.label}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
