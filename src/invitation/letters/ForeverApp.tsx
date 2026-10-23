"use client";
import { useCallback, useMemo } from "react";
import type { Values } from "@/domain/letters/types";
import { useInvitation } from "../engine/context";
import { useLove } from "../love/useLove";
import { ForeverPlayer, type PlayerProps, type ReplyPayload } from "./Player";

/**
 * A Forever Letter inside the invitation engine: the gift's own words, photographs, soundtrack and public API, handed to the
 * player. The player knows nothing of invitations — the same component also plays the public demonstrations.
 */
export function ForeverApp({ autoOpen }: { autoOpen?: boolean }) {
  const { view, media, L, post, music, isPreview } = useInvitation();
  const l = useLove();
  const spec = view.letter;
  const f = l.love.forever;
  const resolvePhoto = useCallback<NonNullable<PlayerProps["resolvePhoto"]>>((id) => {
    const m = media(id);
    return m && m.kind === "IMAGE" ? { src: m.url, srcSet: m.srcSet, alt: L(m.alt) || "", focal: m.focal } : undefined;
  }, [media, L]);
  const onReply = useCallback(async (p: ReplyPayload) => {
    try { await post("/letter-reply", p); return "sent" as const; } catch { return "error" as const; }
  }, [post]);
  const values = f.v as Values;
  const names = useMemo(() => ({ to: l.address, from: l.love.from, nick: l.love.nickname, sign: l.signature, anonymous: l.love.signAs === "anonymous" }), [l.address, l.love.from, l.love.nickname, l.signature, l.love.signAs]);
  const whatsapp = l.love.reply.enabled && l.love.reply.whatsapp.replace(/\D/g, "").length >= 8 ? l.love.reply.whatsapp : null;
  const replyMode = f.replies === "whatsapp" && !whatsapp ? "off" : f.replies;
  if (!spec) return <main id="main" style={{ padding: "4rem 1.5rem", textAlign: "center" }}><p>This letter is not available any more.</p></main>;
  return (
    <ForeverPlayer
      spec={spec} values={values} names={names} ui={l.ui === "ml" ? "ml" : "en"} mode={isPreview ? "preview" : "live"} resolvePhoto={resolvePhoto} onReply={onReply}
      replyMode={replyMode} whatsapp={whatsapp} playfulNo={f.playfulNo} shareAnswers={f.shareAnswers} intensity={f.intensity}
      audio={music.ready ? { ready: true, playing: music.playing, toggle: music.toggle } : null} startAt={autoOpen ? 1 : 0}
      makeHref={new URL("/for-my-love", view.urls.canonical).href}
    />
  );
}
