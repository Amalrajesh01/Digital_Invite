"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Chip, type Tone } from "@/components/ui/Chip";
import { TextArea, TextField } from "@/components/ui/Field";
import { Menu } from "@/components/ui/Menu";
import { Sheet } from "@/components/ui/Sheet";
import { duplicateTemplateAction, duplicateThemeAction, renameTemplateAction, saveThemeTokensAction, setTemplateStatusAction, setThemeStatusAction } from "@/app/actions/admin";
import type { ThemeTokens } from "@/domain/design/tokens";

interface Item { id: string; name: string; description: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; version: number; meta: string; previewHref: string; tokens?: ThemeTokens }

const STATUS: Record<Item["status"], [Tone, string]> = { DRAFT: ["neutral", "Draft"], PUBLISHED: ["ok", "Available"], ARCHIVED: ["warn", "Retired"] };
const COLOR_LABELS: Record<keyof ThemeTokens["colors"], string> = {
  primary: "Main colour", secondary: "Second colour", accent: "Accent", background: "Page background", surface: "Cards", text: "Text", muted: "Soft text", border: "Lines", onPrimary: "Text on main colour", inverse: "Night sections", onInverse: "Text on night",
};

function Swatches({ tokens }: { tokens: ThemeTokens }) {
  const c = tokens.colors;
  return (
    <div className="flex overflow-hidden rounded-md border border-rule" role="img" aria-label="Colour palette" style={{ background: c.background }}>
      {[c.background, c.surface, c.primary, c.secondary, c.accent, c.inverse].map((h, i) => <span key={i} className="h-14 flex-1" style={{ background: h }} />)}
    </div>
  );
}

export function Library({ kind, items }: { kind: "template" | "theme"; items: Item[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [edit, setEdit] = useState<Item | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tokens, setTokens] = useState<ThemeTokens | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, ok: string) =>
    start(async () => { const r = await fn(); if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error?.message ?? "That did not work."); });
  const setStatus = kind === "template" ? setTemplateStatusAction : setThemeStatusAction;
  const duplicate = kind === "template" ? duplicateTemplateAction : duplicateThemeAction;

  const open = (i: Item) => { setEdit(i); setName(i.name); setDesc(i.description); setTokens(i.tokens ? structuredClone(i.tokens) : null); };
  const save = () =>
    edit &&
    run(async () => {
      const r = kind === "template" ? await renameTemplateAction(edit.id, name, desc) : await saveThemeTokensAction(edit.id, { name, description: desc, tokens });
      if (r.ok) setEdit(null);
      return r;
    }, "Saved");

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((i) => (
          <li key={i.id} className="flex flex-col rounded-lg border border-rule-strong bg-surface p-5">
            {i.tokens && <Swatches tokens={i.tokens} />}
            <div className={i.tokens ? "mt-4" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h2 className="display text-[26px] leading-tight">{i.name}</h2><p className="mt-0.5 text-[12.5px] text-muted">{i.meta} · v{i.version}</p></div>
                <Chip tone={STATUS[i.status][0]}>{STATUS[i.status][1]}</Chip>
              </div>
              {i.description && <p className="mt-3 text-[14px] text-ink-2">{i.description}</p>}
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 pt-5">
              <a className="btn btn-quiet btn-sm" href={i.previewHref} target="_blank" rel="noopener noreferrer">Preview</a>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => open(i)}>{kind === "theme" ? "Edit colours" : "Rename"}</Button>
                <Menu label={`Actions for ${i.name}`} items={[
                  { label: "Duplicate", onSelect: () => run(() => duplicate(i.id), "Duplicated as a draft") },
                  ...(i.status !== "PUBLISHED" ? [{ label: "Make available", onSelect: () => run(() => setStatus(i.id, "PUBLISHED"), "Now available") }] : []),
                  ...(i.status === "PUBLISHED" ? [{ label: "Back to draft", onSelect: () => run(() => setStatus(i.id, "DRAFT"), "Moved to draft") }] : []),
                  ...(i.status !== "ARCHIVED" ? [{ label: "Retire", tone: "danger" as const, divider: true, onSelect: () => run(() => setStatus(i.id, "ARCHIVED"), "Retired — existing weddings keep using it") }] : []),
                ]} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={kind === "theme" ? "Edit theme" : "Rename template"} wide={kind === "theme"}
        description={kind === "theme" ? "Weddings already published keep the colours they were published with until you publish them again." : undefined}
        footer={<><Button variant="quiet" onClick={() => setEdit(null)}>Cancel</Button><Button loading={pending} disabled={!name.trim()} onClick={save}>Save</Button></>}>
        <div className="grid gap-4">
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextArea label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
          {tokens && (
            <>
              <Swatches tokens={tokens} />
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(COLOR_LABELS) as (keyof ThemeTokens["colors"])[]).map((k) => (
                  <label key={k} className="flex items-center gap-3 rounded-md border border-rule px-3 py-2">
                    <input type="color" value={tokens.colors[k].length === 4 ? "#" + [...tokens.colors[k].slice(1)].map((c) => c + c).join("") : tokens.colors[k]} onChange={(e) => setTokens({ ...tokens, colors: { ...tokens.colors, [k]: e.target.value } })} className="size-9 cursor-pointer rounded border border-rule bg-transparent p-0" />
                    <span className="min-w-0 flex-1 text-[13.5px]">{COLOR_LABELS[k]}<span className="block text-[11.5px] uppercase text-muted tnum">{tokens.colors[k]}</span></span>
                  </label>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["heading", "body", "script"] as const).map((f) => <TextField key={f} label={`${f[0].toUpperCase() + f.slice(1)} font`} value={tokens.fonts[f]} onChange={(e) => setTokens({ ...tokens, fonts: { ...tokens.fonts, [f]: e.target.value } })} hint={f === "heading" ? "A Google Fonts family name." : undefined} />)}
              </div>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
