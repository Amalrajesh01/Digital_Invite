"use client";
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useFL } from "./runtime";

/** One screen of a letter. */
export function Beat({ children, className, kind }: { children: ReactNode; className?: string; kind?: string }) {
  return <section className={cn("fl-beat", className)} data-kind={kind}>{children}</section>;
}

export function Eyebrow({ children }: { children?: ReactNode }) {
  return children ? <p className="fl-eyebrow">{children}</p> : null;
}

/** The heading of a screen; keyboard focus lands here when the screen appears. */
export function Head({ children, as: Tag = "h2", className }: { children?: ReactNode; as?: "h1" | "h2"; className?: string }) {
  const { focusRef } = useFL();
  if (!children) return null;
  return <Tag ref={focusRef} tabIndex={-1} className={cn("fl-h", className)}>{children}</Tag>;
}

export const Para = ({ children, className }: { children?: ReactNode; className?: string }) => (children ? <p className={cn("fl-p", className)}>{children}</p> : null);

export function Btn({ ghost, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { ghost?: boolean }) {
  return <button type="button" {...p} className={cn("fl-btn", ghost && "fl-btn-ghost", className)} />;
}
export const Quiet = ({ className, ...p }: ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" {...p} className={cn("fl-quiet", className)} />;

/** A photograph from the sender's own uploads (or the bundled demonstration set); nothing at all when it cannot be shown. */
export function Pic({ id, className, ratio, eager, alt }: { id?: string; className?: string; ratio?: string; eager?: boolean; alt?: string }) {
  const { photo } = useFL();
  const [bad, setBad] = useState(false);
  const p = photo(id);
  if (!p || bad) return null;
  return (
    <img src={p.src} srcSet={p.srcSet} sizes="(max-width: 640px) 92vw, 520px" alt={alt ?? p.alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setBad(true)} className={cn("fl-img", className)} style={{ objectPosition: p.focal ? `${p.focal.x}% ${p.focal.y}%` : undefined, aspectRatio: ratio }} />
  );
}

/** A row of small round progress marks. */
export const Dots = ({ n, at }: { n: number; at: number }) => (
  <ol className="fl-dots" aria-hidden>{Array.from({ length: n }, (_, i) => <li key={i} data-on={i <= at} data-now={i === at} />)}</ol>
);

/** The little heart used in place of a symbol character: it is drawn, so it looks the same everywhere. */
export const Heart = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("fl-heart", className)} aria-hidden fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
);

export const Spark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("fl-spark", className)} aria-hidden fill="currentColor"><path d="M12 0c.6 5.700 3.300 9.400 12 12-8.700 2.600-11.400 6.300-12 12-.6-5.700-3.300-9.400-12-12C8.700 9.400 11.400 5.700 12 0Z" /></svg>
);
