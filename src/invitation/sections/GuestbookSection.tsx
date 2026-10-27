"use client";
import { useEffect, useState } from "react";
import { Lock, Pin } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SectionConfig } from "@/domain/doc/schema";
import { ApiError, useInvitation } from "../engine/context";
import { Reveal } from "../engine/motion";
import { useSubject } from "../engine/subject";
import type { StringKey } from "../i18n/strings";
import { Shell, SectionHead, useCopy, InlineNotice } from "./shared";

type Kind = "WISH" | "SHOUTOUT" | "PRIVATE";
const IDEAS: StringKey[] = ["blessing.s1", "blessing.s2", "blessing.s3", "blessing.s4"];

export default function GuestbookSection({ section }: { section: SectionConfig }) {
  const { view, t, post, locale, has, isPreview } = useInvitation();
  const card = section.variant === "card";
  const names = useSubject();
  const copy = useCopy(section, { eyebrow: card ? "blessing.eyebrow" : "guestbook.title", title: card ? undefined : "guestbook.write" });
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const [preview, setPreview] = useState(false);
  const guest = view.guest && !view.guest.isPreview ? view.guest : null;
  const [kind, setKind] = useState<Kind>("WISH");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [sealed, setSealed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  const wishes = view.initial.wishes;
  const canPrivate = has("private_messages") && !card;
  // the card opens with a short animation; the form always arrives, even where the animation cannot run
  useEffect(() => {
    if (phase !== "opening") return;
    const id = setTimeout(() => setPhase("open"), 650);
    return () => clearTimeout(id);
  }, [phase]);
  const openCard = () => setPhase(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "open" : "opening");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) { setPreview(true); return; }
    setPreview(false);
    setErr("");
    if (!guest && !name.trim()) return setErr(t("rsvp.needName"));
    if (body.trim().length < 2) return setErr(t("guestbook.placeholder"));
    setBusy(true);
    try {
      await post("/messages", { kind, body, sealed: kind === "PRIVATE" ? sealed : undefined, locale, ...(guest ? {} : { name }) });
      setState("sent");
      setBody("");
    } catch (e2) {
      setErr(e2 instanceof ApiError && e2.code !== "NETWORK" && e2.code !== "INTERNAL" ? e2.message : t("error.generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={card ? copy.title || t("blessing.title", { name: names.a }) : copy.title} intro={card ? copy.intro || t("blessing.lede", { name: names.a }) : copy.intro} />
      <div className={cn("mx-auto", card ? "bc" : "max-w-xl")}>
        {card && state !== "sent" && phase !== "open" ? (
          <button type="button" className="bc-cover" data-out={phase === "opening" ? "1" : undefined} onClick={openCard} disabled={phase === "opening"}>
            <svg className="bc-cover-mark" viewBox="0 0 20 28" aria-hidden focusable="false"><path d="M10 1 V27 M2 9 H18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            <span className="bc-cover-title">{names.a}</span>
            <span className="bc-cover-open">{t("blessing.open")}</span>
          </button>
        ) : card && state === "sent" ? (
          <Reveal className="bc-thanks inv-card">
            <p className="inv-h3">{t("blessing.thanks")}</p>
            <button type="button" className="inv-btn inv-btn-ghost inv-btn-sm" onClick={() => { setState("idle"); setPhase("open"); }}>{t("blessing.another")}</button>
          </Reveal>
        ) : card ? (
          <form onSubmit={submit} className="bc-inside" noValidate>
            {!guest && (<div><label className="inv-label" htmlFor="gb-name">{t("blessing.name")}</label><input id="gb-name" className="inv-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} /></div>)}
            <div>
              <label className="inv-label" htmlFor="gb-body">{t("blessing.write")}</label>
              <textarea id="gb-body" className="inv-input" rows={4} maxLength={600} placeholder={t("guestbook.placeholder")} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div>
              <p className="inv-eyebrow !text-[0.64rem]" id="gb-ideas">{t("blessing.ideas")}</p>
              <ul className="bc-ideas mt-2" aria-labelledby="gb-ideas">
                {IDEAS.map((k) => (<li key={k}><button type="button" className="bc-idea" onClick={() => setBody((b) => (b.trim() ? `${b.trim()} ${t(k)}` : t(k)))}>{t(k)}</button></li>))}
              </ul>
            </div>
            {err && <InlineNotice tone="error">{err}</InlineNotice>}
            {preview && <InlineNotice>{t("blessing.preview")}</InlineNotice>}
            <button className="inv-btn" disabled={busy}>{busy ? t("common.loading") : t("blessing.send")}</button>
          </form>
        ) : state === "sent" ? (
          <Reveal className="inv-card p-8 text-center">
            <p className="inv-h3">{kind === "PRIVATE" ? t("guestbook.thanksPrivate") : t("guestbook.thanks")}</p>
            <button type="button" className="inv-btn inv-btn-ghost inv-btn-sm mt-6" onClick={() => setState("idle")}>{t("guestbook.write")}</button>
          </Reveal>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            {canPrivate && (
              <div className="inv-tabs !justify-start" role="tablist" aria-label={t("guestbook.write")}>
                {([["WISH", t("guestbook.kind.wish")], ["SHOUTOUT", t("guestbook.kind.shout")], ["PRIVATE", t("guestbook.kind.private")]] as [Kind, string][]).map(([k, label]) => (
                  <button key={k} type="button" role="tab" aria-selected={kind === k} className="inv-tab !px-3" onClick={() => setKind(k)}>{k === "PRIVATE" && <Lock className="mr-1 inline size-3" />}{label}</button>
                ))}
              </div>
            )}
            {!guest && (<div><label className="inv-label" htmlFor="gb-name">{t("guestbook.name")}</label><input id="gb-name" className="inv-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} /></div>)}
            <div>
              <label className="sr-only" htmlFor="gb-body">{t("guestbook.write")}</label>
              <textarea id="gb-body" className="inv-input" rows={kind === "SHOUTOUT" ? 2 : 5} maxLength={kind === "SHOUTOUT" ? 160 : 1200} placeholder={t("guestbook.placeholder")} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            {kind === "PRIVATE" && (<label className="flex cursor-pointer items-center gap-3 text-[0.95rem]"><input type="checkbox" className="size-5 accent-[var(--c-primary)]" checked={sealed} onChange={(e) => setSealed(e.target.checked)} />{t("guestbook.sealed")}</label>)}
            {err && <InlineNotice tone="error">{err}</InlineNotice>}
            <button className="inv-btn" disabled={busy}>{busy ? t("common.loading") : t("common.send")}</button>
          </form>
        )}
      </div>

      <div className="mt-20">
        {wishes.length === 0 ? (
          <p className="text-center inv-muted">{card ? t("blessing.empty", { name: names.a }) : t("guestbook.empty")}</p>
        ) : (
          <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5">
            {wishes.map((w, i) => (
              <Reveal as="li" key={w.id} delay={(i % 3) * 80} className="break-inside-avoid">
                <figure className={cn("inv-card p-6", w.kind === "SHOUTOUT" && "!bg-[var(--c-primary)] !text-[var(--c-on-primary)]")}>
                  {w.pinned && <Pin className="mb-2 size-3.5 text-[var(--c-accent)]" aria-hidden />}
                  <blockquote className="whitespace-pre-line text-[1.02rem] leading-[1.75]" style={{ fontFamily: w.kind === "SHOUTOUT" ? "var(--f-heading)" : undefined }}>“{w.body}”</blockquote>
                  <figcaption className="inv-eyebrow mt-4 !text-[0.66rem] opacity-80" style={w.kind === "SHOUTOUT" ? { color: "inherit" } : undefined}>{w.authorName}</figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
