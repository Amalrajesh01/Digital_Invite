"use client";
import { useRef, useState } from "react";
import { Camera, Check, ImagePlus, Lock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SectionConfig } from "@/domain/doc/schema";
import { ApiError, useInvitation } from "../engine/context";
import { Reveal } from "../engine/motion";
import { fmtDate } from "../engine/format";
import { useSharedPoll } from "../engine/poll";
import { Recorder, type Recorded } from "../engine/Recorder";
import { prepareImage, useUploader } from "../engine/upload";
import { Shell, SectionHead, useCopy, InlineNotice } from "./shared";

function errText(e: unknown, generic: string) {
  return e instanceof ApiError && e.code !== "NETWORK" && e.code !== "INTERNAL" ? e.message : generic;
}

// ── guest photo uploads ─────────────────────────────────────────────────────
interface Job { id: string; name: string; pct: number; state: "queued" | "uploading" | "done" | "failed"; file: File; error?: string }

export function GuestUploadSection({ section }: { section: SectionConfig }) {
  const { view, t, has, isPreview } = useInvitation();
  const copy = useCopy(section, { title: "upload.title" });
  const upload = useUploader();
  const guest = view.guest && !view.guest.isPreview ? view.guest : null;
  const [name, setName] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);
  const accept = has("video_wishes") ? "image/*,video/mp4,video/quicktime,video/webm" : "image/*";

  const run = async (job: Job) => {
    setJobs((j) => j.map((x) => (x.id === job.id ? { ...x, state: "uploading", pct: 0, error: undefined } : x)));
    try {
      const f = await prepareImage(job.file);
      const form = new FormData();
      form.set("file", f);
      if (!guest) form.set("name", name);
      await upload("/upload", form, (pct) => setJobs((j) => j.map((x) => (x.id === job.id ? { ...x, pct } : x))));
      setJobs((j) => j.map((x) => (x.id === job.id ? { ...x, state: "done", pct: 100 } : x)));
    } catch (e) {
      setJobs((j) => j.map((x) => (x.id === job.id ? { ...x, state: "failed", error: errText(e, t("upload.failed")) } : x)));
    }
  };

  const add = (files: FileList | File[] | null) => {
    if (!files || isPreview) return;
    if (!guest && !name.trim()) return void document.getElementById("up-name")?.focus();
    const next: Job[] = Array.from(files).slice(0, 12).map((file) => ({ id: crypto.randomUUID(), name: file.name, pct: 0, state: "queued", file }));
    setJobs((j) => [...next, ...j]);
    next.forEach((j) => void run(j));
  };

  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={t("upload.lede")} className="!mb-8" />
      {!guest && (<div className="mb-5"><label className="inv-label" htmlFor="up-name">{t("upload.yourName")}</label><input id="up-name" className="inv-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" /></div>)}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        className={cn("grid place-items-center gap-4 border border-dashed p-10 text-center transition-colors", drag ? "border-[var(--c-primary)] bg-[var(--c-primary)]/5" : "border-[var(--c-border)]")}
        style={{ borderRadius: "var(--r)" }}
      >
        <ImagePlus className="size-9 text-[var(--c-accent)]" aria-hidden />
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="inv-btn" onClick={() => input.current?.click()}>{t("upload.choose")}</button>
          <button type="button" className="inv-btn inv-btn-ghost" onClick={() => cam.current?.click()}><Camera className="size-4" /> {t("upload.camera")}</button>
        </div>
        <input ref={input} type="file" accept={accept} multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      {jobs.length > 0 && (
        <ul className="mt-6 space-y-2" aria-live="polite">
          {jobs.map((j) => (
            <li key={j.id} className="flex items-center gap-3 border border-[var(--c-border)] px-4 py-3 text-[0.92rem]" style={{ borderRadius: "var(--r)" }}>
              <span className="min-w-0 flex-1 truncate">{j.name}</span>
              {j.state === "uploading" && <span className="inv-num text-[var(--c-primary)]">{j.pct}%</span>}
              {j.state === "done" && <span className="inline-flex items-center gap-1.5 text-[#2f6b3f]"><Check className="size-4" />{t("upload.done")}</span>}
              {j.state === "failed" && <button type="button" onClick={() => void run(j)} className="inline-flex items-center gap-1.5 text-[#b3372f] underline"><RefreshCw className="size-3.5" />{j.error ?? t("upload.failed")}</button>}
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

// ── video & voice wishes ────────────────────────────────────────────────────
type WishItem = { id: string; authorName: string; message: string; media: { url: string; kind: string } };

export function WishesSection({ section }: { section: SectionConfig }) {
  const { view, t, has, get, slug, token, isPreview } = useInvitation();
  const copy = useCopy(section, { title: "wishes.title" });
  const upload = useUploader();
  const guest = view.guest && !view.guest.isPreview ? view.guest : null;
  const voice = has("voice_wishes");
  const [kind, setKind] = useState<"VIDEO" | "VOICE">("VIDEO");
  const [rec, setRec] = useState<Recorded | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const list = useSharedPoll<{ video: WishItem[]; voice: WishItem[] }>(`wishes:${slug}:${token ?? ""}`, () => get("/media-wishes"), 30000, true);
  const videos = list?.video ?? view.initial.videoWishes.map((w) => ({ id: w.id, authorName: w.authorName, message: w.message, media: w.media }));
  const voices = list?.voice ?? view.initial.voiceWishes.map((w) => ({ id: w.id, authorName: w.authorName, message: w.message, media: w.media }));

  const send = async (payload: Recorded) => {
    if (isPreview) return;
    if (!guest && !name.trim()) return setErr(t("rsvp.needName"));
    setBusy(true);
    setErr("");
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", payload.file);
      form.set("durationSec", String(Math.round(payload.durationSec)));
      form.set("message", message);
      if (!guest) form.set("name", name);
      await upload("/media-wish", form, setPct);
      setSent(true);
      setRec(null);
    } catch (e) {
      setErr(errText(e, t("error.generic")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} />
      <div className="mx-auto max-w-xl">
        {sent ? (
          <div className="inv-card p-8 text-center"><p className="inv-h3">{t("wishes.thanks")}</p><button type="button" className="inv-btn inv-btn-ghost inv-btn-sm mt-5" onClick={() => setSent(false)}>{t("wishes.recordVideo")}</button></div>
        ) : (
          <div className="space-y-5">
            {voice && (
              <div className="inv-tabs !justify-start" role="tablist">
                <button role="tab" aria-selected={kind === "VIDEO"} className="inv-tab" onClick={() => { setKind("VIDEO"); setRec(null); }}>{t("wishes.recordVideo")}</button>
                <button role="tab" aria-selected={kind === "VOICE"} className="inv-tab" onClick={() => { setKind("VOICE"); setRec(null); }}>{t("wishes.recordVoice")}</button>
              </div>
            )}
            {!guest && (<div><label className="inv-label" htmlFor="w-name">{t("guestbook.name")}</label><input id="w-name" className="inv-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>)}
            <Recorder key={kind} kind={kind} onChange={setRec} />
            <div>
              <input ref={fileInput} type="file" hidden accept={kind === "VIDEO" ? "video/*" : "audio/*"} onChange={(e) => { const f = e.target.files?.[0]; if (f) setRec({ file: f, durationSec: 0 }); e.target.value = ""; }} />
              <button type="button" className="gate-skip !ml-0 !px-0 !text-[var(--c-text)]" onClick={() => fileInput.current?.click()}>{t("wishes.orUpload")}</button>
              {rec && <span className="inv-muted ml-3 text-[0.85rem]">{rec.file.name}</span>}
            </div>
            <div><label className="inv-label" htmlFor="w-msg">{t("wishes.message")}</label><input id="w-msg" className="inv-input" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} /></div>
            {err && <InlineNotice tone="error">{err}</InlineNotice>}
            <button type="button" className="inv-btn" disabled={!rec || busy} onClick={() => rec && void send(rec)}>{busy ? `${t("upload.uploading")} ${pct}%` : t("wishes.send")}</button>
          </div>
        )}
      </div>

      {videos.length > 0 && (
        <div className="mt-20">
          <p className="inv-eyebrow mb-6 text-center">{t("wishes.watch")}</p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <Reveal as="li" key={v.id}><figure><video src={v.media.url} controls playsInline preload="metadata" className="aspect-[3/4] w-full bg-black object-cover" style={{ borderRadius: "var(--r)" }} /><figcaption className="mt-2 text-center inv-muted text-[0.9rem]">{v.authorName}</figcaption></figure></Reveal>
            ))}
          </ul>
        </div>
      )}
      {voices.length > 0 && (
        <div className="mt-16">
          <p className="inv-eyebrow mb-6 text-center">{t("wishes.listen")}</p>
          <ul className="mx-auto max-w-xl space-y-3">
            {voices.map((v) => (
              <li key={v.id} className="inv-card flex flex-wrap items-center gap-4 p-4"><span className="inv-h4 min-w-24">{v.authorName}</span><audio src={v.media.url} controls preload="none" className="h-10 flex-1" /></li>
            ))}
          </ul>
        </div>
      )}
      {false && <Lock />}
    </Shell>
  );
}

// ── time capsule ────────────────────────────────────────────────────────────
type CapsuleState = { status: { unlockAt: string; unlocked: boolean; count: number } | null; items: { id: string; authorName: string; kind: string; body: string; media: { url: string; kind: string } | null }[] };

export function TimeCapsuleSection({ section }: { section: SectionConfig }) {
  const { view, t, get, slug, token, locale, isPreview, has } = useInvitation();
  const copy = useCopy(section, { title: "capsule.title" });
  const upload = useUploader();
  const guest = view.guest && !view.guest.isPreview ? view.guest : null;
  const cfg = view.doc.timeCapsule;
  const live = useSharedPoll<CapsuleState>(`capsule:${slug}:${token ?? ""}`, () => get("/capsule"), 60000, true);
  const status = live?.status ?? (view.initial.capsule ? { unlockAt: view.initial.capsule.unlockAt, unlocked: view.initial.capsule.unlocked, count: view.initial.capsule.count } : null);
  const items = live?.items ?? [];
  const [kind, setKind] = useState<"TEXT" | "PHOTO" | "VIDEO" | "VOICE">("TEXT");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [rec, setRec] = useState<Recorded | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  if (!status && !cfg.unlockDate) return null;
  const unlocked = !!status?.unlocked;
  const kinds = [["TEXT", t("capsule.text"), true], ["PHOTO", t("capsule.photo"), cfg.allowPhoto], ["VIDEO", t("capsule.video"), cfg.allowVideo], ["VOICE", t("capsule.voice"), cfg.allowVoice && has("voice_wishes")]] as const;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) return;
    setErr("");
    if (!guest && !name.trim()) return setErr(t("rsvp.needName"));
    setBusy(true);
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("body", body);
      if (!guest) form.set("name", name);
      if (kind !== "TEXT") {
        if (!rec) throw new ApiError("VALIDATION", t("capsule.write"));
        form.set("file", kind === "PHOTO" ? await prepareImage(rec.file) : rec.file);
        form.set("durationSec", String(Math.round(rec.durationSec)));
      }
      await upload("/capsule", form);
      setSent(true);
      setBody("");
      setRec(null);
    } catch (e2) {
      setErr(errText(e2, t("error.generic")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} />
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="relative" aria-hidden>
          <svg viewBox="0 0 120 150" className={cn("w-32 transition-transform duration-700", unlocked && "-rotate-6")} fill="none" stroke="var(--c-accent)" strokeWidth="1.3">
            <rect x="26" y="52" width="68" height="84" rx="34" />
            <path d="M26 86h68M26 102h68" opacity=".5" />
            <path d={unlocked ? "M30 52c0-30 60-34 68-6" : "M34 52v-12c0-14 12-24 26-24s26 10 26 24v12"} />
            <circle cx="60" cy="114" r="6" fill="var(--c-accent)" />
          </svg>
        </div>
        {status && !unlocked && (
          <>
            <p className="inv-h3 mt-6">{t("capsule.sealed", { date: fmtDate(status.unlockAt.slice(0, 10), locale, "long") })}</p>
            {L_prompt(view, locale)}
            <p className="inv-muted mt-3 flex items-center gap-2 text-[0.95rem]"><Lock className="size-3.5" />{status.count === 1 ? t("capsule.count1") : t("capsule.count", { n: status.count })}</p>
          </>
        )}
        {unlocked && <p className="inv-h3 mt-6">{t("capsule.opened")}</p>}
      </div>

      {!unlocked && status && (
        <div className="mx-auto mt-10 max-w-xl">
          {sent ? (
            <div className="inv-card p-8 text-center"><p className="inv-h4">{t("capsule.thanks")}</p><button type="button" className="inv-btn inv-btn-ghost inv-btn-sm mt-5" onClick={() => setSent(false)}>{t("capsule.write")}</button></div>
          ) : (
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="inv-tabs !justify-start" role="tablist">
                {kinds.filter((k) => k[2]).map(([k, label]) => (<button key={k} type="button" role="tab" aria-selected={kind === k} className="inv-tab !px-3" onClick={() => { setKind(k); setRec(null); }}>{label}</button>))}
              </div>
              {!guest && (<div><label className="inv-label" htmlFor="c-name">{t("guestbook.name")}</label><input id="c-name" className="inv-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>)}
              {kind === "TEXT" && <textarea className="inv-input" rows={5} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("capsule.placeholder")} aria-label={t("capsule.text")} />}
              {kind === "PHOTO" && (<div><input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setRec({ file: f, durationSec: 0 }); }} /><button type="button" className="inv-btn inv-btn-ghost" onClick={() => fileInput.current?.click()}><ImagePlus className="size-4" /> {t("upload.choose")}</button>{rec && <span className="ml-3 text-[0.88rem] inv-muted">{rec.file.name}</span>}</div>)}
              {(kind === "VIDEO" || kind === "VOICE") && <Recorder key={kind} kind={kind} onChange={setRec} />}
              {err && <InlineNotice tone="error">{err}</InlineNotice>}
              <button className="inv-btn" disabled={busy}>{busy ? t("upload.uploading") : t("capsule.write")}</button>
            </form>
          )}
        </div>
      )}

      {unlocked && items.length > 0 && (
        <ul className="mx-auto mt-14 max-w-3xl columns-1 gap-4 sm:columns-2 [&>li]:mb-4">
          {items.map((it) => (
            <li key={it.id} className="inv-card break-inside-avoid p-5">
              {it.media?.kind === "IMAGE" && <img src={it.media.url} alt="" className="mb-3 w-full" style={{ borderRadius: "var(--r)" }} loading="lazy" />}
              {it.media?.kind === "VIDEO" && (it.kind === "VOICE" ? <audio src={it.media.url} controls className="mb-3 w-full" /> : <video src={it.media.url} controls playsInline className="mb-3 w-full" style={{ borderRadius: "var(--r)" }} />)}
              {it.media?.kind === "AUDIO" && <audio src={it.media.url} controls className="mb-3 w-full" />}
              {it.body && <p className="whitespace-pre-line text-[1rem] leading-[1.75]">{it.body}</p>}
              <p className="inv-eyebrow mt-3 !text-[0.66rem]">{it.authorName}</p>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

function L_prompt(view: ReturnType<typeof useInvitation>["view"], locale: string) {
  const p = view.doc.timeCapsule.prompt;
  const text = p[locale] || p.en || Object.values(p)[0];
  return text ? <p className="inv-muted mt-2 italic">{text}</p> : null;
}
