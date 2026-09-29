"use client";
import { useState } from "react";
import { Lock, Pin } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SectionConfig } from "@/domain/doc/schema";
import { ApiError, useInvitation } from "../engine/context";
import { Reveal } from "../engine/motion";
import { Shell, SectionHead, useCopy, InlineNotice } from "./shared";

type Kind = "WISH" | "SHOUTOUT" | "PRIVATE";

export default function GuestbookSection({ section }: { section: SectionConfig }) {
  const { view, t, post, locale, has, isPreview } = useInvitation();
  const copy = useCopy(section, { eyebrow: "guestbook.title", title: "guestbook.write" });
  const guest = view.guest && !view.guest.isPreview ? view.guest : null;
  const [kind, setKind] = useState<Kind>("WISH");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [sealed, setSealed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  const wishes = view.initial.wishes;
  const canPrivate = has("private_messages");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) return;
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
      <SectionHead eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} />
      <div className="mx-auto max-w-xl">
        {state === "sent" ? (
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
          <p className="text-center inv-muted italic">{t("guestbook.empty")}</p>
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
