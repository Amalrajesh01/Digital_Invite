"use client";
import { useEffect, useMemo, useState } from "react";
import { useInvitation } from "../engine/context";
import { useCountdown } from "../engine/motion";
import { loveText, type LoveKey } from "./copy";

/** Everything an experience needs from the gift, already resolved: names as the sender wants them shown, text, photographs. */
export function useLove() {
  const { view, L, media, locale } = useInvitation();
  const love = view.doc.love;
  const ui = love.language === "ml" || locale === "ml" ? "ml" : "en";
  const { t, headline } = loveText(ui);

  const name = love.to.trim();
  const nick = love.nickname.trim();
  const both = love.addressAs === "both" && !!nick && !!name;
  const address = (love.addressAs === "nickname" && nick) || (both && nick) || name || nick || (ui === "ml" ? "നീ" : "you");
  const secondary = both ? name : "";

  const from = love.from.trim();
  const signature = love.signAs === "anonymous" ? t("someone") : love.signAs === "initial" ? `${from.charAt(0).toUpperCase()}.` : from || t("someone");
  const fromLine = love.signAs === "anonymous" ? t("fromAnon") : t("from", { name: signature });

  const paragraphs = (text: string) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const letter = paragraphs(L(love.letter));
  const photos = love.photos.map((id) => media(id)).filter((m): m is NonNullable<typeof m> => !!m && m.kind === "IMAGE");
  const memories = love.memories
    .map((m) => ({ id: m.id, title: L(m.title), body: paragraphs(L(m.body)), when: m.when, photo: m.photo && media(m.photo)?.kind === "IMAGE" ? m.photo : undefined }))
    .filter((m) => m.title || m.body.length || m.photo);
  const reasons = love.reasons.map((r) => L(r)).filter(Boolean);
  const title = L(love.headline) || headline(love.occasion, address);
  const closing = L(love.closing);
  const reply = love.reply.enabled && love.reply.whatsapp.replace(/\D/g, "").length >= 8 ? `https://wa.me/${love.reply.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(ui === "ml" ? "ഞാൻ ഇത് വായിച്ചു." : "I read what you sent.")}` : null;

  return {
    love, ui, t: (k: LoveKey, v?: Record<string, string | number>) => t(k, v), address, secondary, signature, fromLine, letter, photos, memories, reasons, title, closing, reply,
    apology: { owning: paragraphs(L(love.apology.owning)), feelings: paragraphs(L(love.apology.feelings)), promise: paragraphs(L(love.apology.promise)) },
    dateLabel: L(love.dateLabel),
    paragraphs,
  };
}

/** Today in India as YYYY-MM-DD — the product's day boundary — so a gift opened at midnight in another timezone still counts correctly. */
export function todayIst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/**
 * The next time the gift's date comes round (a birthday, an anniversary), and how many years have been completed so far.
 * A date in the future simply counts down to itself. `null` when the gift has no date.
 */
export function useSpecialDate(date: string) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayIst()), []);
  const info = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !today) return null;
    const [y, m, d] = date.split("-").map(Number);
    const [ty, tm, td] = today.split("-").map(Number);
    let year = y;
    if (y <= ty) year = tm > m || (tm === m && td > d) ? ty + 1 : ty; // this year's, or next year's if it has passed
    const next = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday = next === today;
    // completed years as of now (on the day itself, the year that is being celebrated)
    return { next, years: isToday ? year - y : year - y - 1, isToday, original: y };
  }, [date, today]);
  const target = useMemo(() => (info ? new Date(`${info.next}T00:00:00+05:30`) : null), [info]);
  const count = useCountdown(target);
  return info && count ? { ...info, ...count } : null;
}
