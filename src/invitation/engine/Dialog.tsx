"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useInvitation } from "./context";

/** Full-screen-on-phone modal for games and pickers, styled with the wedding's theme. */
export function InvDialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const { t, locale } = useInvitation();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={title}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto h-dvh max-h-dvh w-full max-w-none border-0 bg-[var(--c-bg)] p-0 text-[var(--c-text)] backdrop:bg-black/60 md:h-auto md:max-h-[90dvh] md:max-w-2xl md:overflow-hidden"
      style={{ borderRadius: "var(--r)" }}
    >
      <div className="inv !min-h-0 flex h-full max-h-[inherit] flex-col" data-locale={locale}>
        <header className="flex items-center justify-between gap-4 border-b border-[var(--c-border)] px-5 py-4">
          <h3 className="inv-h4">{title}</h3>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="grid size-11 place-items-center rounded-full hover:bg-black/5"><X className="size-5" /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-6">{open ? children : null}</div>
      </div>
    </dialog>
  );
}
