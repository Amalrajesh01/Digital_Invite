"use client";
import { useId } from "react";
import { cn } from "@/lib/cn";

interface FieldShellProps {
  label?: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: (a: { id: string; describedBy: string | undefined; invalid: boolean }) => React.ReactNode;
}

export function FieldShell({ label, hint, error, required, className, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-[13.5px] font-medium text-ink-2">
          {label}
          {required && (
            <span aria-hidden className="text-accent">
              {" "}
              *
            </span>
          )}
        </label>
      )}
      {children({ id, describedBy: [hintId, errId].filter(Boolean).join(" ") || undefined, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="text-[13px] leading-snug text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-[13px] leading-snug text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

type Base = { label?: string; hint?: React.ReactNode; error?: string; className?: string };

export function TextField({ label, hint, error, className, required, ...rest }: Base & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => <input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} required={required} className="field-input" {...rest} />}
    </FieldShell>
  );
}

export function TextArea({ label, hint, error, className, required, rows = 3, ...rest }: Base & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => <textarea id={id} rows={rows} aria-describedby={describedBy} aria-invalid={invalid || undefined} required={required} className="field-input resize-y leading-relaxed" {...rest} />}
    </FieldShell>
  );
}

const CARET =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='%236d675c' stroke-width='1.6'><path d='M1 1.5l5 5 5-5'/></svg>\")";

export function SelectField({ label, hint, error, className, required, children, ...rest }: Base & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className="field-input appearance-none bg-no-repeat pr-9"
          style={{ backgroundImage: CARET, backgroundPosition: "right 0.85rem center", backgroundSize: "12px" }}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export function Switch({ checked, onChange, label, hint, disabled, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean; id?: string }) {
  const gen = useId();
  const sid = id ?? gen;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={sid} className="cursor-pointer text-[14.5px] font-medium text-ink">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-[13px] leading-snug text-muted">{hint}</p>}
      </div>
      <button
        id={sid}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-50", checked ? "border-ink bg-ink" : "border-rule-strong bg-paper-2")}
      >
        <span className={cn("absolute left-0.5 top-0.5 size-[18px] rounded-full bg-surface shadow transition-transform", checked && "translate-x-5")} />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

export function Checkbox({ checked, onChange, label, className }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex cursor-pointer select-none items-center gap-2.5 text-[14.5px]", className)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-[18px] rounded-sm accent-[var(--accent)]" />
      <span>{label}</span>
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-rule-strong bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn("rounded-[4px] px-3 py-1.5 text-[13.5px] font-medium transition-colors", value === o.value ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
