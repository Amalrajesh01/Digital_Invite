"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Copy, Eye, Heart, ImagePlus, Loader2, Lock, Music2, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { LoveDoc } from "@/domain/doc/schema";
import type { LetterCard } from "@/domain/letters";
import type { LetterSpec, Values } from "@/domain/letters/types";
import { ScenarioForm } from "./ScenarioForm";
import { GiftMusicLibrary } from "./GiftMusicLibrary";
import type { ResolvedMedia } from "@/domain/media/service";
import { LOVE_EXPERIENCES, LOVE_EXPERIENCE_INFO, LOVE_MOODS, LOVE_OCCASIONS, LOVE_PROMPTS, MOOD_LABEL, MOOD_THEME, OCCASION_INFO, type LoveExperience, type LoveMood, type LoveOccasion } from "@/domain/love/constants";
import { THEME_SEEDS } from "@/domain/design/themes";
import { newId } from "@/lib/id";
import { LOCALES } from "@/domain/doc/constants";
import { GiftError, clearCreds, credsFromHash, credsHash, giftFetch, readCreds, saveCreds, type GiftCreds, type OwnerGift } from "./api";

type Love = LoveDoc;
type LT = Record<string, string>;
const STEPS = ["Occasion", "Names", "Style", "Your words", "Photos", "Music", "Preview", "Send"] as const;
const FOREVER_STEPS = ["Letter", "Names", "Settings", "Your words", "Photos", "Music", "Preview", "Send"] as const;
const FOREVER_TITLES = ["Your letter", "Who is it between?", "How should it behave?", "Say it your way", "Add your photographs", "Add a song", "See it the way they will", "Send it to us"];
const LANGS = [{ code: "en", label: "English" }, ...LOCALES.map((l) => ({ code: l.code as string, label: l.native }))];

const getT = (t: LT | undefined, lang: string) => t?.[lang] ?? t?.en ?? Object.values(t ?? {}).find(Boolean) ?? "";
const setT = (lang: string, v: string): LT => (v.trim() ? { [lang]: v } : {});
const emptyLove = (): Love => LoveDoc.parse({});

/** Which part of the date question suits the occasion. */
const DATE_Q: Record<LoveOccasion, string> = { birthday: "Their birthday", anniversary: "Your anniversary", sorry: "", just_because: "A date that matters (optional)", proposal: "The date you met, or the day you began (optional)", valentine: "", memory: "The day it happened (optional)", custom: "A date that matters (optional)" };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[15px] font-semibold text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-[13.5px] text-muted">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}
const input = "field-input w-full !min-h-12 !text-[16px]";
const area = "field-input w-full !text-[16px] leading-relaxed";

function Pill({ on, children, onClick, className }: { on: boolean; children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[14.5px] font-medium transition-colors", on ? "border-ink bg-ink text-white" : "border-rule-strong bg-white text-ink-2 hover:border-ink-2", className)}>
      {children}
    </button>
  );
}

// ── the builder ─────────────────────────────────────────────────────────────────────────────────────────
export function GiftBuilder({ priceText, letters = [], tags = [], initialLetter }: { priceText: string | null; letters?: LetterCard[]; tags?: { key: string; label: string }[]; initialLetter?: string }) {
  const [creds, setCreds] = useState<GiftCreds | null>(null);
  const [booting, setBooting] = useState(true);
  const [love, setLove] = useState<Love>(emptyLove);
  const [baseDoc, setBaseDoc] = useState<OwnerGift["doc"] | null>(null);
  const [photos, setPhotos] = useState<ResolvedMedia[]>([]);
  const [music, setMusic] = useState<OwnerGift["music"]>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [drawer, setDrawer] = useState(false);
  const [sent, setSent] = useState<{ ref: string; whatsapp: string } | null>(null);
  const [contact, setContact] = useState({ name: "", phone: "" });
  const lang = love.language;
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [dirty, setDirty] = useState(false);
  const [letter, setLetter] = useState<LetterSpec | null>(null);
  const [filter, setFilter] = useState("");
  const forever = !!letter;

  // resume: from the link the maker saved (#g=…), or from this browser
  useEffect(() => {
    let alive = true;
    (async () => {
      const fromHash = credsFromHash(window.location.hash);
      const known = fromHash ? { ...fromHash, viewToken: "" } : readCreds();
      if (known) {
        try {
          const g = await giftFetch<OwnerGift>(known, `/api/gift/${known.id}`);
          if (!alive) return;
          if (initialLetter && g.letter?.slug !== initialLetter) throw new Error("start a new letter");
          const c = { id: known.id, token: known.token, viewToken: g.viewToken };
          saveCreds(c);
          setCreds(c); setLove(g.love); setBaseDoc(g.doc); setPhotos(g.photos); setMusic(g.music); setLetter(g.letter);
          setStep(g.state === "DRAFT" ? 1 : 7);
          if (g.state !== "DRAFT") setSent({ ref: g.ref, whatsapp: "" });
          if (fromHash) window.history.replaceState(null, "", window.location.pathname);
        } catch {
          if (!initialLetter) clearCreds();
        }
      }
      if (alive) setBooting(false);
    })();
    return () => { alive = false; };
  }, [initialLetter]);

  const fail = (e: unknown) => setError(e instanceof GiftError ? e.message : "Something went wrong. Please try again.");

  const update = useCallback((patch: Partial<Love> | ((l: Love) => Love)) => {
    setDirty(true);
    setLove((l) => (typeof patch === "function" ? patch(l) : { ...l, ...patch }));
  }, []);

  // autosave, a moment after the last change
  useEffect(() => {
    if (!creds || !dirty) return;
    setSaved("saving");
    const id = window.setTimeout(async () => {
      try {
        await giftFetch(creds, `/api/gift/${creds.id}`, { method: "PUT", body: JSON.stringify(love) });
        setDirty(false);
        setSaved("saved");
      } catch (e) { fail(e); setSaved("idle"); }
    }, 900);
    return () => window.clearTimeout(id);
  }, [love, creds, dirty]);

  // live preview: every edit is sent into the frame as it is made
  const tokens = useMemo(() => THEME_SEEDS.find((t) => t.slug === MOOD_THEME[love.mood])?.tokens, [love.mood]);
  const mediaMap = useMemo(() => Object.fromEntries(photos.map((p) => [p.id, p])), [photos]);
  const post = useCallback(() => {
    if (!frame?.contentWindow || !baseDoc || !tokens) return;
    frame.contentWindow.postMessage({ type: "sbl:patch", doc: { ...baseDoc, love }, tokens, flavor: "minimal", media: mediaMap, secondaryLocale: love.language !== "en" ? love.language : null }, window.location.origin);
  }, [love, baseDoc, tokens, mediaMap, frame]);
  useEffect(() => {
    const id = window.setTimeout(post, 200);
    return () => window.clearTimeout(id);
  }, [post]);
  useEffect(() => {
    const on = (e: MessageEvent) => { if (e.origin === window.location.origin && e.data?.type === "sbl:ready") post(); };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [post]);

  const create = async (body: { occasion?: LoveOccasion; scenario?: string }) => {
    setBusy("start");
    try {
      const made = await giftFetch<{ id: string; token: string; viewToken: string }>(null, "/api/gift", { method: "POST", body: JSON.stringify(body) });
      const c = { id: made.id, token: made.token, viewToken: made.viewToken };
      saveCreds(c);
      const g = await giftFetch<OwnerGift>(c, `/api/gift/${c.id}`);
      setCreds(c); setLove(g.love); setBaseDoc(g.doc); setPhotos(g.photos); setLetter(g.letter); setStep(1);
    } catch (e) { fail(e); } finally { setBusy(null); }
  };
  const begin = async (occasion: LoveOccasion) => {
    const info = OCCASION_INFO[occasion];
    setError(null);
    if (creds) { update({ occasion, experience: info.experience, mood: info.mood }); setStep(1); return; }
    await create({ occasion });
  };
  const beginLetter = async (slug: string) => { setError(null); await create({ scenario: slug }); };
  // arriving from a letter's own page ("Make this letter") starts that letter straight away — once
  const started = useRef(false);
  useEffect(() => {
    if (booting || creds || !initialLetter || started.current) return;
    started.current = true;
    void beginLetter(initialLetter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, creds, initialLetter]);

  const upload = async (files: FileList | null) => {
    if (!files || !creds) return;
    setError(null);
    setBusy("photo");
    try {
      for (const f of Array.from(files)) {
        if (photos.length + 1 > 12) { setError("A gift can hold up to 12 photographs."); break; }
        const fd = new FormData();
        fd.append("file", f);
        const r = await giftFetch<{ media: ResolvedMedia }>(creds, `/api/gift/${creds.id}/photo`, { method: "POST", body: fd });
        setPhotos((p) => [...p, r.media]);
        update((l) => ({ ...l, photos: [...l.photos, r.media.id] }));
      }
    } catch (e) { fail(e); } finally { setBusy(null); }
  };
  const removePhoto = async (id: string) => {
    if (!creds) return;
    setBusy("photo");
    try {
      const r = await giftFetch<{ love: Love }>(creds, `/api/gift/${creds.id}/photo?asset=${id}`, { method: "DELETE" });
      setPhotos((p) => p.filter((x) => x.id !== id));
      setLove((l) => ({ ...l, photos: r.love.photos, memories: r.love.memories }));
    } catch (e) { fail(e); } finally { setBusy(null); }
  };
  const move = (id: string, dir: -1 | 1) => update((l) => {
    const a = [...l.photos], i = a.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= a.length) return l;
    [a[i], a[j]] = [a[j], a[i]];
    return { ...l, photos: a };
  });
  const uploadMusic = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f || !creds) return;
    setBusy("music"); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await giftFetch<{ music: OwnerGift["music"] }>(creds, `/api/gift/${creds.id}/music`, { method: "POST", body: fd });
      setMusic(r.music);
    } catch (e) { fail(e); } finally { setBusy(null); }
  };
  const pickLibrary = async (library: string) => {
    if (!creds) return;
    setBusy("music"); setError(null);
    try { const r = await giftFetch<{ music: OwnerGift["music"] }>(creds, `/api/gift/${creds.id}/music`, { method: "POST", body: JSON.stringify({ library }) }); setMusic(r.music); } catch (e) { fail(e); } finally { setBusy(null); }
  };
  const dropMusic = async () => {
    if (!creds) return;
    setBusy("music");
    try { await giftFetch(creds, `/api/gift/${creds.id}/music`, { method: "DELETE" }); setMusic(null); } catch (e) { fail(e); } finally { setBusy(null); }
  };

  const flush = async () => {
    if (!creds || !dirty) return;
    await giftFetch(creds, `/api/gift/${creds.id}`, { method: "PUT", body: JSON.stringify(love) });
    setDirty(false);
  };
  const send = async () => {
    if (!creds) return;
    setBusy("send"); setError(null);
    try {
      await flush();
      setSent(await giftFetch(creds, `/api/gift/${creds.id}/submit`, { method: "POST", body: JSON.stringify(contact) }));
    } catch (e) { fail(e); } finally { setBusy(null); }
  };

  const goto = async (n: number) => {
    setError(null);
    if (n > step && step === 0 && !creds) return;
    try { await flush(); } catch (e) { fail(e); return; }
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (booting) return <div className="grid min-h-[60vh] place-items-center text-muted"><Loader2 className="size-6 animate-spin" aria-label="Loading" /></div>;

  // ── pieces of the form ────────────────────────────────────────────────────────────────────────────────
  const T = (t: LT | undefined) => getT(t, lang);
  const textArea = (value: LT | undefined, onChange: (v: LT) => void, rows: number, placeholder = "") => (
    <textarea className={area} rows={rows} value={T(value)} placeholder={placeholder} onChange={(e) => onChange(setT(lang, e.target.value))} />
  );
  const appendTo = (current: LT | undefined, add: string): LT => setT(lang, [T(current), add.trim()].filter(Boolean).join("\n\n"));
  const exp = love.experience;
  const reasonsText = love.reasons.map((r) => T(r)).join("\n");
  const memLimit = exp === "sorry" ? 1 : 6;
  const previewUrl = creds ? `/for-my-love/preview/${creds.id}?t=${creds.viewToken}` : "";

  const setForever = (patch: Partial<Love["forever"]>) => update((l) => ({ ...l, forever: { ...l.forever, ...patch } }));
  const hasQuestion = !!letter?.beats.some((b) => b.type === "ask");
  const collectsAnswers = !!letter?.beats.some((b) => b.type === "choose" || b.type === "quiz" || b.type === "clues");
  const letterSettings = () => !letter ? null : (
    <div className="grid gap-9">
      <div className="rounded-xl border border-rule-strong bg-white p-5">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">Its look is its own</p>
        <p className="mt-2 text-[16px] text-ink-2/90">{letter.direction}</p>
        <ul className="mt-3 flex items-center gap-2" aria-label="Colours of this letter">{[letter.palette.bg, letter.palette.accent, letter.palette.accent2].map((c) => <li key={c} className="size-6 rounded-full border border-black/15" style={{ background: c }} />)}</ul>
      </div>
      <div>
        <h3 className="text-[19px] font-semibold text-ink">How lively should it be?</h3>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {([["calm", "Calm and slow"], ["standard", "As designed"], ["rich", "A little livelier"]] as const).map(([k, label]) => <Pill key={k} on={love.forever.intensity === k} onClick={() => setForever({ intensity: k })}>{label}</Pill>)}
        </div>
      </div>
      {letter.playfulNo && (
        <div className="rounded-xl border border-rule-strong bg-white p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 size-5 accent-[var(--accent)]" checked={love.forever.playfulNo} onChange={(e) => setForever({ playfulNo: e.target.checked })} />
            <span><span className="block text-[15.5px] font-semibold text-ink">A playful, moving “No” button</span><span className="block text-[13.5px] text-muted">Off by default. When it is on, the “No” hops away from a finger or pointer — three times at most — and an ordinary “No, thank you” always sits beneath it. They can always say no.</span></span>
          </label>
        </div>
      )}
      {letter.reply && hasQuestion && (
        <div>
          <h3 className="text-[19px] font-semibold text-ink">Where should their answer go?</h3>
          <div className="mt-3 grid gap-3">
            {([
              ["collect", "Send it to me, privately", "Their answer is saved for you, and only you can read it on your private page. Nobody is notified and nothing repeats."],
              ["whatsapp", "Let them reply on WhatsApp", "Each answer opens WhatsApp with a message ready for you. They choose whether to send it."],
              ["off", "Don’t collect an answer", "The question is still asked, in words. They answer however they like — in person, or in a message of their own."],
            ] as const).map(([k, t, d]) => (
              <label key={k} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4", love.forever.replies === k ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-rule-strong")}>
                <input type="radio" name="reply-mode" className="mt-1 size-5 accent-[var(--accent)]" checked={love.forever.replies === k} onChange={() => { setForever({ replies: k }); if (k === "whatsapp") update((l) => ({ ...l, reply: { ...l.reply, enabled: true } })); }} />
                <span><span className="block text-[15.5px] font-semibold text-ink">{t}</span><span className="block text-[13.5px] text-muted">{d}</span></span>
              </label>
            ))}
          </div>
          {love.forever.replies === "whatsapp" && (<div className="mt-4"><Field label="Your WhatsApp number" hint="With country code, e.g. 919846000000"><input className={input} inputMode="tel" value={love.reply.whatsapp} onChange={(e) => update((l) => ({ ...l, reply: { enabled: true, whatsapp: e.target.value } }))} /></Field></div>)}
          {love.forever.replies === "collect" && collectsAnswers && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-rule-strong bg-white p-4">
              <input type="checkbox" className="mt-1 size-5 accent-[var(--accent)]" checked={love.forever.shareAnswers} onChange={(e) => setForever({ shareAnswers: e.target.checked })} />
              <span><span className="block text-[15.5px] font-semibold text-ink">Also send me their answers to the games and questions</span><span className="block text-[13.5px] text-muted">Off by default. Only included when they send their reply, and only seen by you. We tell them where their answer goes before they send it.</span></span>
            </label>
          )}
        </div>
      )}
    </div>
  );

  const stepBody = () => {
    switch (step) {
      case 0:
        return (
          <div>
            {!creds && letters.length > 0 && (
              <div className="mb-12">
                <h3 className="text-[22px] font-semibold text-ink">Forever Letters</h3>
                <p className="mt-1 text-[16px] text-ink-2/85">Little experiences with games, reveals and a question at the end. Pick one — you will see exactly how it works before you send anything.</p>
                <div role="group" aria-label="Filter the experiences" className="mt-4 flex flex-wrap gap-2">
                  <Pill on={filter === ""} onClick={() => setFilter("")}>All {letters.length}</Pill>
                  {tags.map((t) => <Pill key={t.key} on={filter === t.key} onClick={() => setFilter(t.key)}>{t.label}</Pill>)}
                </div>
                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {letters.filter((c) => !filter || (c.tags as string[]).includes(filter)).map((c) => (
                    <li key={c.slug}>
                      <button type="button" disabled={busy === "start"} onClick={() => void beginLetter(c.slug)} className="group block w-full text-left">
                        <img src={c.cover} alt="" width={540} height={1020} loading="lazy" className="aspect-[9/17] w-full rounded-[1.2rem] border-[4px] border-ink bg-paper-2 object-cover object-top transition group-hover:-translate-y-1" onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
                        <span className="mt-2 block font-serif text-[18px] leading-tight text-ink group-hover:text-accent">{c.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-14 text-[22px] font-semibold text-ink">Or a classic gift</h3>
              </div>
            )}
            {forever && creds && letter && <div className="rounded-xl border border-rule-strong bg-white p-5"><p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">You are making</p><p className="mt-1 font-serif text-[30px] leading-tight text-ink">{letter.title}</p><p className="mt-1 text-[15.5px] text-ink-2/85">{letter.purpose}</p></div>}
            {!forever && <p className="text-[17px] text-ink-2/85">Choose what it is for. You can change your mind later.</p>}
            {!forever && <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {LOVE_OCCASIONS.map((o) => (
                <li key={o}>
                  <button type="button" disabled={busy === "start"} onClick={() => begin(o)} className={cn("flex w-full items-center gap-4 rounded-xl border p-4 text-left transition hover:border-ink-2", love.occasion === o && creds ? "border-ink bg-white" : "border-rule-strong bg-white")}>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Heart className="size-5" aria-hidden /></span>
                    <span><span className="block text-[17px] font-semibold text-ink">{OCCASION_INFO[o].label}</span><span className="block text-[14px] text-muted">{OCCASION_INFO[o].hint}</span></span>
                  </button>
                </li>
              ))}
            </ul>}
            {busy === "start" && <p className="mt-4 flex items-center gap-2 text-muted"><Loader2 className="size-4 animate-spin" /> Setting up your gift…</p>}
          </div>
        );
      case 1:
        return (
          <div className="grid gap-6">
            <Field label="Your name"><input className={input} maxLength={60} value={love.from} onChange={(e) => update({ from: e.target.value })} placeholder="Arjun" autoComplete="given-name" /></Field>
            <Field label="Their name"><input className={input} maxLength={60} value={love.to} onChange={(e) => update({ to: e.target.value })} placeholder="Meera" /></Field>
            <Field label="A pet name for them (optional)" hint="What you actually call them."><input className={input} maxLength={40} value={love.nickname} onChange={(e) => update({ nickname: e.target.value })} placeholder="Meeru" /></Field>
            <div>
              <p className="text-[15px] font-semibold text-ink">How should the gift call them?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {([["name", "By their name"], ["nickname", "By the pet name"], ["both", "Pet name, with their name"]] as const).map(([k, label]) => (
                  <Pill key={k} on={love.addressAs === k} onClick={() => update({ addressAs: k })}>{label}</Pill>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink">How should it be signed?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {([["name", "With my name"], ["initial", "With my initial"], ["anonymous", "“Someone who loves you”"]] as const).map(([k, label]) => (
                  <Pill key={k} on={love.signAs === k} onClick={() => update({ signAs: k })}>{label}</Pill>
                ))}
              </div>
            </div>
            {!forever && DATE_Q[love.occasion] && (
              <Field label={DATE_Q[love.occasion]}><input type="date" className={input} value={love.date} onChange={(e) => update({ date: e.target.value })} /></Field>
            )}
            <Field label="The language you are writing in" hint="Your own words stay exactly as you write them. This only picks the right letters for them.">
              <select className={input} value={love.language} onChange={(e) => update({ language: e.target.value })}>{LANGS.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}</select>
            </Field>
          </div>
        );
      case 2:
        if (letter) return letterSettings();
        return (
          <div className="grid gap-9">
            <div>
              <h3 className="text-[19px] font-semibold text-ink">Pick its colours</h3>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {LOVE_MOODS.map((m) => {
                  const c = THEME_SEEDS.find((t) => t.slug === MOOD_THEME[m])?.tokens.colors;
                  return (
                    <Pill key={m} on={love.mood === m} onClick={() => update({ mood: m as LoveMood })}>
                      {c && <span className="flex" aria-hidden>{[c.background, c.primary, c.accent].map((h, i) => (<span key={i} className="-ml-1 size-3.5 rounded-full border border-black/15 first:ml-0" style={{ background: h }} />))}</span>}
                      {MOOD_LABEL[m]}
                    </Pill>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-[19px] font-semibold text-ink">How should it unfold?</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {LOVE_EXPERIENCES.map((e) => (
                  <li key={e}>
                    <button type="button" aria-pressed={love.experience === e} onClick={() => update({ experience: e as LoveExperience })} className={cn("flex h-full w-full gap-4 rounded-xl border p-3 text-left transition", love.experience === e ? "border-ink bg-white shadow-[0_0_0_1px_var(--ink)]" : "border-rule-strong bg-white hover:border-ink-2")}>
                      <img src={`/templates/${LOVE_EXPERIENCE_INFO[e].slug}.webp`} alt="" className="h-28 w-16 shrink-0 rounded-md bg-paper-2 object-cover" onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
                      <span><span className="block text-[17px] font-semibold text-ink">{LOVE_EXPERIENCE_INFO[e].name}</span><span className="mt-1 block text-[14px] leading-snug text-ink-2/85">{LOVE_EXPERIENCE_INFO[e].tagline}</span><span className="mt-2 block text-[13px] text-muted">{LOVE_EXPERIENCE_INFO[e].howItFeels}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 3:
        if (letter) return <ScenarioForm spec={letter} values={love.forever.v as Values} photos={photos} onChange={(v) => setForever({ v })} />;
        return (
          <div className="grid gap-8">
            <p className="text-[16.5px] text-ink-2/85">Write as little or as much as you like. Nothing here is required — and if you are stuck, tap a question for a nudge.</p>
            <details className="rounded-xl border border-rule-strong bg-white p-4" open={!T(love.letter)}>
              <summary className="cursor-pointer text-[16px] font-semibold text-ink">Help me find the words</summary>
              <div className="mt-4 grid gap-5">
                {LOVE_PROMPTS.filter((p) => (exp === "sorry" ? true : p.key !== "sorry")).map((p) => (
                  <PromptCard key={p.key} question={p.question} placeholder={p.placeholder} onAdd={(text) => update(p.key === "sorry" ? { apology: { ...love.apology, owning: appendTo(love.apology.owning, text) } } : p.key === "mostLove" ? { reasons: text.split(/\n+/).map((x) => x.trim()).filter(Boolean).slice(0, 12).map((x) => setT(lang, x)), letter: appendTo(love.letter, text) } : { letter: appendTo(love.letter, text) })} />
                ))}
              </div>
            </details>

            {exp !== "sorry" && (
              <Field label="Your message" hint="Blank lines make new paragraphs. This is the heart of your gift.">{textArea(love.letter, (v) => update({ letter: v }), 9, "Dear you…")}</Field>
            )}
            {exp === "sorry" && (
              <div className="grid gap-6 rounded-xl border border-rule-strong bg-white p-5">
                <p className="text-[15px] leading-relaxed text-ink-2/85">A good apology is plain, specific and asks for nothing back. Say what happened, how you think it felt for them, and what you will do. Please don’t pressure them to forgive you — the gift never will.</p>
                <Field label="What I did, plainly">{textArea(love.apology.owning, (v) => update({ apology: { ...love.apology, owning: v } }), 5, "I wasn’t there when you needed me, and then I got defensive…")}</Field>
                <Field label="How I think it felt for you">{textArea(love.apology.feelings, (v) => update({ apology: { ...love.apology, feelings: v } }), 5, "I think it felt like…")}</Field>
                <Field label="What I would like to do">{textArea(love.apology.promise, (v) => update({ apology: { ...love.apology, promise: v } }), 5, "I would like to listen, whenever you are ready…")}</Field>
                <Field label="Anything else (optional)">{textArea(love.letter, (v) => update({ letter: v }), 4)}</Field>
              </div>
            )}

            {(exp === "surprise" || exp === "day") && (
              <Field label="Things you love about them" hint="One on each line. Up to 12.">
                <textarea className={area} rows={5} value={reasonsText} onChange={(e) => update({ reasons: e.target.value.split("\n").slice(0, 12).map((x) => setT(lang, x)) })} placeholder={"The way you laugh\nHow you remember everything"} />
              </Field>
            )}

            {exp !== "letter" && (
              <div>
                <p className="text-[15px] font-semibold text-ink">{exp === "sorry" ? "A memory you keep coming back to (optional)" : "Memories"}</p>
                <p className="mt-0.5 text-[13.5px] text-muted">{exp === "story" ? "Each memory becomes a chapter with its own photograph." : "Each one gets its own moment in the gift."}</p>
                <div className="mt-3 grid gap-4">
                  {love.memories.map((m, i) => (
                    <div key={m.id} className="rounded-xl border border-rule-strong bg-white p-4">
                      <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
                        <input className={input} maxLength={40} placeholder="When? (June 2019)" value={m.when} onChange={(e) => update((l) => ({ ...l, memories: l.memories.map((x, k) => (k === i ? { ...x, when: e.target.value } : x)) }))} aria-label="When" />
                        <input className={input} placeholder="A title" value={T(m.title)} onChange={(e) => update((l) => ({ ...l, memories: l.memories.map((x, k) => (k === i ? { ...x, title: setT(lang, e.target.value) } : x)) }))} aria-label="Title" />
                      </div>
                      <textarea className={cn(area, "mt-3")} rows={3} placeholder="What happened, and why it matters" value={T(m.body)} onChange={(e) => update((l) => ({ ...l, memories: l.memories.map((x, k) => (k === i ? { ...x, body: setT(lang, e.target.value) } : x)) }))} aria-label="The memory" />
                      {photos.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-[13.5px] text-muted">Photo:</span>
                          <button type="button" onClick={() => update((l) => ({ ...l, memories: l.memories.map((x, k) => (k === i ? { ...x, photo: undefined } : x)) }))} className={cn("rounded-md border px-2 py-1 text-[13px]", !m.photo ? "border-ink" : "border-rule-strong")}>None</button>
                          {photos.map((p) => (
                            <button key={p.id} type="button" aria-label="Use this photograph" aria-pressed={m.photo === p.id} onClick={() => update((l) => ({ ...l, memories: l.memories.map((x, k) => (k === i ? { ...x, photo: p.id } : x)) }))} className={cn("size-12 overflow-hidden rounded-md border-2", m.photo === p.id ? "border-ink" : "border-transparent")}>
                                      <img src={p.url} alt="" className="size-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                      <button type="button" onClick={() => update((l) => ({ ...l, memories: l.memories.filter((_, k) => k !== i) }))} className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] text-bad"><Trash2 className="size-4" aria-hidden /> Remove this memory</button>
                    </div>
                  ))}
                  {love.memories.length < memLimit && (
                    <button type="button" onClick={() => update((l) => ({ ...l, memories: [...l.memories, { id: newId(), title: {}, body: {}, when: "", photo: undefined }] }))} className="btn btn-quiet w-fit"><Plus className="size-4" aria-hidden /> Add a memory</button>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your closing line (optional)" hint="“Always,” is used if you leave it empty."><input className={input} maxLength={120} value={T(love.closing)} onChange={(e) => update({ closing: setT(lang, e.target.value) })} placeholder="Always yours," /></Field>
              <Field label="A title of your own (optional)" hint="Otherwise we write one for the occasion."><input className={input} maxLength={120} value={T(love.headline)} onChange={(e) => update({ headline: setT(lang, e.target.value) })} /></Field>
            </div>

            <div className="rounded-xl border border-rule-strong bg-white p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" className="mt-1 size-5 accent-[var(--accent)]" checked={love.reply.enabled} onChange={(e) => update({ reply: { ...love.reply, enabled: e.target.checked } })} />
                <span><span className="block text-[15.5px] font-semibold text-ink">Let them reply on WhatsApp</span><span className="block text-[13.5px] text-muted">Off by default. If you switch it on, they see a quiet button at the end — they are never asked to use it.</span></span>
              </label>
              {love.reply.enabled && (<div className="mt-4"><Field label="Your WhatsApp number" hint="With country code, e.g. 919846000000"><input className={input} inputMode="tel" value={love.reply.whatsapp} onChange={(e) => update({ reply: { ...love.reply, whatsapp: e.target.value } })} /></Field></div>)}
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <p className="text-[16.5px] text-ink-2/85">Add up to 12 of your own photographs. They are used only in this gift, and you can delete them — or the whole gift — whenever you like.</p>
            <label className={cn("mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-rule-strong bg-white p-6 text-center transition hover:border-ink-2", busy === "photo" && "opacity-60")}>
              {busy === "photo" ? <Loader2 className="size-7 animate-spin text-accent" aria-hidden /> : <ImagePlus className="size-7 text-accent" aria-hidden />}
              <span className="text-[16px] font-semibold text-ink">{busy === "photo" ? "Adding…" : "Choose photographs"}</span>
              <span className="text-[13.5px] text-muted">JPG, PNG or WebP · up to 12 MB each</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={busy === "photo"} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
            </label>
            {love.photos.length > 0 && (
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {love.photos.map((id, i) => {
                  const p = photos.find((x) => x.id === id);
                  if (!p) return null;
                  return (
                    <li key={id} className="overflow-hidden rounded-xl border border-rule-strong bg-white">
                      <img src={p.url} alt={`Photograph ${i + 1}`} className="aspect-[4/5] w-full object-cover" />
                      <div className="flex items-center justify-between gap-1 p-2">
                        <span className="text-[13px] text-muted">{i + 1}</span>
                        <span className="flex gap-1">
                          <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => move(id, -1)} className="grid size-9 place-items-center rounded-md hover:bg-paper-2 disabled:opacity-30"><ArrowUp className="size-4" /></button>
                          <button type="button" aria-label="Move later" disabled={i === love.photos.length - 1} onClick={() => move(id, 1)} className="grid size-9 place-items-center rounded-md hover:bg-paper-2 disabled:opacity-30"><ArrowDown className="size-4" /></button>
                          <button type="button" aria-label="Remove this photograph" onClick={() => removePhoto(id)} className="grid size-9 place-items-center rounded-md text-bad hover:bg-bad-soft"><Trash2 className="size-4" /></button>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      case 5:
        return (
          <div>
            <p className="text-[16.5px] text-ink-2/85">Music is optional. If you add a song, it never plays by itself — they choose to press play.</p>
            <div className="mt-5 rounded-xl border border-rule-strong bg-white p-5">
              {music ? (
                <div className="flex items-center justify-between gap-4"><span className="flex items-center gap-3 text-[16px] font-medium text-ink"><Music2 className="size-5 text-accent" aria-hidden /> {music.title}</span><button type="button" onClick={dropMusic} className="btn btn-quiet btn-sm"><Trash2 className="size-4" aria-hidden /> Remove</button></div>
              ) : (
                <label className={cn("flex cursor-pointer flex-col items-center gap-2 py-4 text-center", busy === "music" && "opacity-60")}>
                  {busy === "music" ? <Loader2 className="size-6 animate-spin text-accent" /> : <Music2 className="size-6 text-accent" aria-hidden />}
                  <span className="text-[16px] font-semibold text-ink">Add a song from your phone</span>
                  <span className="text-[13.5px] text-muted">MP3 or M4A · up to 10 MB</span>
                  <input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav" className="sr-only" disabled={busy === "music"} onChange={(e) => { void uploadMusic(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
            {letter && !music && <GiftMusicLibrary suggest={letter.music} onPick={(id) => void pickLibrary(id)} busy={busy === "music"} />}
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{letter ? "If you add your own song, please use music you have the right to share. " : "Please use music you have the right to share — your own, or something you are licensed to use. We don’t supply songs. "}If you would rather have no music at all, simply skip this step.</p>
          </div>
        );
      case 6:
        return (
          <div>
            <p className="text-[16.5px] text-ink-2/85">This is exactly what they will see, from the very first screen. Open it the way they will.</p>
            <div className="mt-5"><PhoneFrame src={`${previewUrl}&k=${step}`} title="Your gift, as they will see it" tall /></div>
          </div>
        );
      default:
        return sent ? (
          <Sent sent={sent} creds={creds} priceText={priceText} />
        ) : (
          <div className="grid gap-6">
            <div className="rounded-xl border border-rule-strong bg-white p-5">
              <h3 className="text-[19px] font-semibold text-ink">Almost there</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2/85">Send your gift to us and we will publish it on a private link that only you and the people you share it with can open. You see it, and approve it, before anyone else does.</p>
              <ol className="mt-4 grid gap-2 text-[15px] text-ink-2/85">
                <li className="flex gap-3"><b className="text-accent">1.</b> We message you on WhatsApp to confirm{priceText ? ` — the gift is ${priceText}` : " and share the price"}.</li>
                <li className="flex gap-3"><b className="text-accent">2.</b> You pay, and we publish it.</li>
                <li className="flex gap-3"><b className="text-accent">3.</b> You get a private link to send on WhatsApp — and you can pause or delete it, any time.</li>
              </ol>
            </div>
            <Field label="Your name"><input className={input} value={contact.name} maxLength={80} onChange={(e) => setContact({ ...contact, name: e.target.value })} autoComplete="name" /></Field>
            <Field label="Your WhatsApp number" hint="So we can reach you. We never share it."><input className={input} inputMode="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+91 98460 00000" /></Field>
            <button type="button" disabled={busy === "send"} onClick={send} className="btn btn-accent btn-lg w-full sm:w-fit">{busy === "send" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Heart className="size-4" aria-hidden />} Send my gift to be published</button>
            <PrivacyNote />
          </div>
        );
    }
  };

  const canNext = step === 0 ? !!creds : step === 1 ? !!love.to.trim() : true;
  return (
    <div className="mx-auto max-w-[76rem] px-5 pb-32 pt-8 sm:px-8 lg:pb-16">
      <nav aria-label="Steps" className="mb-8">
        <ol className="flex flex-wrap gap-x-5 gap-y-2 text-[13.5px]">
          {(forever ? FOREVER_STEPS : STEPS).map((s, i) => (
            <li key={s}><button type="button" disabled={i > 0 && !creds} onClick={() => void goto(i)} aria-current={i === step ? "step" : undefined} className={cn("inline-flex items-center gap-1.5 py-1", i === step ? "font-semibold text-ink" : i < step ? "text-accent" : "text-muted")}>{i < step ? <Check className="size-3.5" aria-hidden /> : <span className="tnum">{i + 1}</span>} {s}</button></li>
          ))}
        </ol>
        <div className="mt-3 h-1 rounded-full bg-paper-2"><div className="h-1 rounded-full bg-accent transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      </nav>
      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <section aria-live="polite">
          <h1 className="font-serif text-[clamp(34px,4.6vw,52px)] font-medium leading-[1.05] text-ink">{(forever ? FOREVER_TITLES : ["What is it for?", "Who is it between?", "How should it feel?", "Say it your way", "Add your photographs", "Add a song", "See it the way they will", "Send it to us"])[step]}</h1>
          <div className="mt-7">{stepBody()}</div>
          {error && <p role="alert" className="mt-6 rounded-lg border border-bad/40 bg-bad-soft px-4 py-3 text-[15px] text-bad">{error}</p>}
          {step > 0 && !(step === 7 && sent) && (
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-rule bg-white/95 px-5 py-3 backdrop-blur lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0">
              <button type="button" onClick={() => void goto(step - 1)} className="btn btn-quiet"><ArrowLeft className="size-4" aria-hidden /> Back</button>
              <span className="hidden text-[13px] text-muted sm:block" aria-live="polite">{saved === "saving" ? "Saving…" : saved === "saved" ? "Saved" : ""}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setDrawer(true)} className="btn btn-quiet lg:hidden"><Eye className="size-4" aria-hidden /> See it</button>
                {step < 7 && <button type="button" disabled={!canNext} onClick={() => void goto(step + 1)} className="btn btn-accent">{step === 5 ? (music ? "Next" : "Skip music") : "Next"} <ArrowRight className="size-4" aria-hidden /></button>}
              </div>
            </div>
          )}
        </section>
        {step > 0 && step < 6 && (
          <aside className="hidden lg:block"><div className="sticky top-24"><PhoneFrame src={`${previewUrl}&m=live`} title="Live preview of your gift" frameRef={setFrame} onLoad={post} /><p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-muted"><Lock className="size-3.5" aria-hidden /> Only you can see this preview</p></div></aside>
        )}
      </div>
      {drawer && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 lg:hidden" role="dialog" aria-modal="true" aria-label="Preview of your gift">
          <div className="w-full max-w-sm">
            <div className="mb-2 flex justify-end"><button type="button" onClick={() => setDrawer(false)} className="grid size-11 place-items-center rounded-full bg-white" aria-label="Close preview"><X className="size-5" /></button></div>
            <PhoneFrame src={`${previewUrl}&m=live`} title="Live preview of your gift" frameRef={setFrame} onLoad={post} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── small parts ─────────────────────────────────────────────────────────────────────────────────────────
function PromptCard({ question, placeholder, onAdd }: { question: string; placeholder: string; onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div>
      <p className="text-[15px] font-medium text-ink">{question}</p>
      <textarea className={cn(area, "mt-2")} rows={2} value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} aria-label={question} />
      <button type="button" disabled={!text.trim()} onClick={() => { onAdd(text); setText(""); }} className="btn btn-quiet btn-sm mt-2">Add to my gift</button>
    </div>
  );
}

function PhoneFrame({ src, title, tall, frameRef, onLoad }: { src: string; title: string; tall?: boolean; frameRef?: (el: HTMLIFrameElement | null) => void; onLoad?: () => void }) {
  return (
    <div className={cn("mx-auto w-full overflow-hidden rounded-[2.4rem] border-[9px] border-ink bg-ink shadow-[0_40px_70px_-34px_rgba(11,27,53,.6)]", tall ? "max-w-[24rem]" : "max-w-[21rem]")}>
      <iframe ref={frameRef} src={src} title={title} onLoad={onLoad} className={cn("block w-full rounded-[1.7rem] border-0 bg-white", tall ? "h-[44rem]" : "h-[38rem]")} referrerPolicy="no-referrer" />
    </div>
  );
}

export function PrivacyNote() {
  return (
    <div className="rounded-xl border border-rule bg-paper p-4 text-[13.5px] leading-relaxed text-ink-2/80">
      <p className="flex items-center gap-2 font-semibold text-ink"><Lock className="size-4 text-accent" aria-hidden /> How we keep your gift private</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Your gift lives on a link no one can guess, and it is never listed on Google.</li>
        <li>Your photographs are stored privately and shown only in your gift. We never use them to advertise.</li>
        <li>You can pause the link — it stops working at once — or delete the gift and every photograph, any time.</li>
        <li>A gift you start but never send us is deleted automatically after 14 days.</li>
      </ul>
      <p className="mt-2"><Link href="/for-my-love/privacy" className="underline underline-offset-4">Read our gift privacy promise</Link></p>
    </div>
  );
}

function Sent({ sent, creds, priceText }: { sent: { ref: string; whatsapp: string }; creds: GiftCreds | null; priceText: string | null }) {
  const [copied, setCopied] = useState(false);
  const link = creds ? `${typeof window === "undefined" ? "" : window.location.origin}/for-my-love/gift/${creds.id}${credsHash(creds)}` : "";
  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-ok/40 bg-ok-soft p-5">
        <p className="flex items-center gap-2 text-[18px] font-semibold text-ok"><Check className="size-5" aria-hidden /> Your gift is with us.</p>
        <p className="mt-2 text-[15.5px] text-ink-2/90">Your reference is <b className="tnum">{sent.ref}</b>. We will message you on WhatsApp{priceText ? ` — the gift is ${priceText}` : ""} and publish it once that is settled.</p>
        {sent.whatsapp && <a href={sent.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-lg mt-4 bg-[#1fa855] text-white hover:bg-[#188f47]">Message us on WhatsApp now</a>}
      </div>
      {creds && (
        <div className="rounded-xl border border-rule-strong bg-white p-5">
          <p className="text-[16px] font-semibold text-ink">Keep this link safe</p>
          <p className="mt-1 text-[14.5px] text-ink-2/85">It is the only way to change, pause or delete your gift. Anyone who has it can edit your gift, so don’t share it.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input readOnly className="field-input min-w-0 flex-1 !text-[13px]" value={link} aria-label="Your private link" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="btn btn-quiet" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }}><Copy className="size-4" aria-hidden /> {copied ? "Copied" : "Copy"}</button>
          </div>
          <Link href={`/for-my-love/gift/${creds.id}${credsHash(creds)}`} className="mt-4 inline-block text-[14.5px] text-accent underline underline-offset-4">Open my gift page</Link>
        </div>
      )}
      <PrivacyNote />
    </div>
  );
}
