"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: "dialog" | "drawer";
  wide?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Native <dialog>: focus-trapped, Esc-closable, screen-reader friendly — without extra dependencies. */
export function Sheet({ open, onClose, title, description, variant = "dialog", wide, children, footer }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={cn("sheet", variant === "drawer" && "drawer", wide && variant === "dialog" && "!max-w-[min(94vw,56rem)]")}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby={titleId}
    >
      <div className={cn("flex flex-col", variant === "drawer" ? "h-full" : "max-h-[88dvh]")}>
        <header className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
          <div>
            <h2 id={titleId} className="display text-[26px]">
              {title}
            </h2>
            {description && <p className="mt-1 text-[14px] text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost btn-sm -mr-2 -mt-1 !px-2">
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{open ? children : null}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 rounded-b-[inherit] border-t border-rule bg-paper px-5 py-3.5">{footer}</footer>}
      </div>
    </dialog>
  );
}
