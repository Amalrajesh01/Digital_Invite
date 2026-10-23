"use client";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Field, Item, LetterSpec, Values } from "@/domain/letters/types";
import type { ResolvedMedia } from "@/domain/media/service";

const input = "field-input w-full !min-h-12 !text-[16px]";
const area = "field-input w-full !text-[16px] leading-relaxed";

const effective = (f: Field, v: Values) => v[f.key] ?? (f.kind === "list" ? f.defaults ?? [] : f.default ?? "");
const blank = (sub: Field[]): Item => Object.fromEntries(sub.map((s) => [s.key, s.kind === "list" ? "" : s.kind === "choice" ? s.options[0]?.value ?? "" : ""]));

function Label({ f, id, children }: { f: Field; id: string; children?: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-[15px] font-semibold text-ink">{f.label}{f.required && <span className="ml-1 text-bad" aria-label="required">*</span>}</label>
      {f.hint && <p className="mt-0.5 text-[13.5px] text-muted">{f.hint}</p>}
      {children}
    </div>
  );
}

function Photos({ value, photos, onPick, label }: { value: string; photos: ResolvedMedia[]; onPick: (id: string) => void; label: string }) {
  if (!photos.length) return <p className="text-[13.5px] text-muted">Add photographs in the Photos step, then choose one here.</p>;
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <button type="button" onClick={() => onPick("")} aria-pressed={!value} className={cn("rounded-md border px-2.5 py-1.5 text-[13px]", !value ? "border-ink" : "border-rule-strong")}>None</button>
      {photos.map((p) => (
        <button key={p.id} type="button" aria-label="Use this photograph" aria-pressed={value === p.id} onClick={() => onPick(p.id)} className={cn("size-12 overflow-hidden rounded-md border-2", value === p.id ? "border-ink" : "border-transparent")}>
          <img src={p.url} alt="" className="size-full object-cover" />
        </button>
      ))}
    </div>
  );
}

function One({ f, value, onChange, photos, id }: { f: Field; value: string; onChange: (v: string) => void; photos: ResolvedMedia[]; id: string }) {
  switch (f.kind) {
    case "text": return <input id={id} className={cn(input, "mt-2")} maxLength={f.max ?? 160} value={value} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case "long": return <textarea id={id} className={cn(area, "mt-2")} rows={f.rows ?? 4} value={value} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case "date": return <input id={id} type="date" className={cn(input, "mt-2")} value={value} onChange={(e) => onChange(e.target.value)} />;
    case "choice": return <select id={id} className={cn(input, "mt-2")} value={value} onChange={(e) => onChange(e.target.value)}><option value="">{f.placeholder ?? "Choose…"}</option>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
    case "toggle": return null;
    case "photo": return <div className="mt-2"><Photos value={value} photos={photos} onPick={onChange} label={f.label} /></div>;
    case "list": return null;
  }
}

function Row({ f, v, set, photos, uid }: { f: Field; v: Values; set: (k: string, x: string | Item[]) => void; photos: ResolvedMedia[]; uid: string }) {
  const id = `${uid}-${f.key}`;
  if (f.kind === "toggle") {
    const on = effective(f, v) === "1";
    return (
      <div className="rounded-xl border border-rule-strong bg-white p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1 size-5 accent-[var(--accent)]" checked={on} onChange={(e) => set(f.key, e.target.checked ? "1" : "")} />
          <span><span className="block text-[15.5px] font-semibold text-ink">{f.label}</span>{f.hint && <span className="block text-[13.5px] text-muted">{f.hint}</span>}</span>
        </label>
      </div>
    );
  }
  if (f.kind === "list") {
    const items = effective(f, v) as Item[];
    const rows = items.length ? items : Array.from({ length: f.min ?? 0 }, () => blank(f.item));
    const write = (next: Item[]) => set(f.key, next);
    return (
      <div>
        <p className="text-[15px] font-semibold text-ink">{f.label}{f.required && <span className="ml-1 text-bad" aria-label="required">*</span>}</p>
        {f.hint && <p className="mt-0.5 text-[13.5px] text-muted">{f.hint}</p>}
        <div className="mt-3 grid gap-4">
          {rows.map((it, i) => (
            <div key={i} className="rounded-xl border border-rule-strong bg-white p-4">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted">{f.itemLabel} {i + 1}</p>
              <div className="mt-2 grid gap-3">
                {f.item.map((sub) => {
                  const sid = `${id}-${i}-${sub.key}`;
                  const set1 = (x: string) => write(rows.map((r, k) => (k === i ? { ...r, [sub.key]: x } : r)));
                  if (sub.kind === "toggle") return (<label key={sub.key} className="flex cursor-pointer items-center gap-2.5 text-[14.5px]"><input type="checkbox" className="size-5 accent-[var(--accent)]" checked={it[sub.key] === "1"} onChange={(e) => write(rows.map((r, k) => (k === i ? { ...r, [sub.key]: e.target.checked ? "1" : "" } : (e.target.checked ? { ...r, [sub.key]: "" } : r))))} />{sub.label}</label>);
                  return (<div key={sub.key}><label htmlFor={sid} className="text-[13.5px] font-medium text-ink-2">{sub.label}</label><One f={sub} id={sid} value={it[sub.key] ?? ""} onChange={set1} photos={photos} /></div>);
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1">
                <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => { const a = [...rows]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; write(a); }} className="grid size-10 place-items-center rounded-md hover:bg-paper-2 disabled:opacity-30"><ArrowUp className="size-4" /></button>
                <button type="button" aria-label="Move later" disabled={i === rows.length - 1} onClick={() => { const a = [...rows]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; write(a); }} className="grid size-10 place-items-center rounded-md hover:bg-paper-2 disabled:opacity-30"><ArrowDown className="size-4" /></button>
                <button type="button" onClick={() => write(rows.filter((_, k) => k !== i))} className="ml-auto inline-flex min-h-10 items-center gap-1.5 text-[13.5px] text-bad"><Trash2 className="size-4" aria-hidden /> Remove</button>
              </div>
            </div>
          ))}
          {rows.length < f.max && <button type="button" onClick={() => write([...rows, blank(f.item)])} className="btn btn-quiet w-fit"><Plus className="size-4" aria-hidden /> Add {f.itemLabel === "item" ? "another" : `a ${f.itemLabel}`}</button>}
        </div>
      </div>
    );
  }
  const val = effective(f, v) as string;
  return <Label f={f} id={id}><One f={f} id={id} value={val} onChange={(x) => set(f.key, x)} photos={photos} /></Label>;
}

/**
 * The form a Forever Letter asks of its sender, drawn from the experience's own field list. Every line starts with the words we
 * suggest (or an empty box with a prompt for anything personal), so a letter works the moment it is made and is entirely theirs by
 * the time they are done.
 */
export function ScenarioForm({ spec, values, onChange, photos }: { spec: LetterSpec; values: Values; onChange: (v: Values) => void; photos: ResolvedMedia[] }) {
  const set = (k: string, x: string | Item[]) => onChange({ ...values, [k]: x });
  return (
    <div className="grid gap-7">
      {spec.care.length > 0 && (
        <div className="rounded-xl border border-rule bg-paper p-4 text-[14.5px] leading-relaxed text-ink-2/90">
          <p className="font-semibold text-ink">Before you write</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{spec.care.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
      {spec.fields.filter((f) => f.key !== "cover").map((f) => <Row key={f.key} f={f} v={values} set={set} photos={photos} uid={spec.slug} />)}
      {spec.fields.some((f) => f.key === "cover") && (
        <div>
          <p className="text-[15px] font-semibold text-ink">A photograph for the opening (optional)</p>
          <p className="mt-0.5 text-[13.5px] text-muted">If you leave this empty, a quiet backdrop of ours is used.</p>
          <div className="mt-2"><Photos value={(values.cover as string) ?? ""} photos={photos} onPick={(id) => set("cover", id)} label="Photograph for the opening" /></div>
        </div>
      )}
    </div>
  );
}
