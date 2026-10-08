"use client";
import { useState } from "react";
import { Play } from "lucide-react";
import type { SectionConfig } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { filmSourceFromUrl } from "../engine/format";
import { useSlot } from "../engine/images";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { Shell, SectionHead, useCopy } from "./shared";

type Source = { kind: "embed"; src: string } | { kind: "file"; src: string };

/**
 * The wedding film. Only three things can ever play, and the page builds the player itself — an editor
 * cannot inject markup: a YouTube/Vimeo link (privacy-enhanced embed), a direct https .mp4/.webm link, or a
 * video uploaded to the media library. With none of those the section is not rendered at all: no empty frame.
 * Nothing is requested from a video host until the guest presses play.
 */
function useSource(): Source | null {
  const { view, media } = useInvitation();
  const f = view.doc.film;
  const up = media(f.video);
  if (up && up.kind === "VIDEO") return { kind: "file", src: up.url };
  return filmSourceFromUrl(f.url);
}

export default function FilmSection({ section }: { section: SectionConfig }) {
  const { view, L, t, music } = useInvitation();
  const copy = useCopy(section, { eyebrow: "film.eyebrow", title: "film.title" });
  const source = useSource();
  const couple = useSlot("couple");
  const [playing, setPlaying] = useState(false);
  if (!source) return null;
  const f = view.doc.film;
  const poster = f.poster || couple;
  const title = L(f.title) || copy.title;
  const play = () => {
    music.pause(); // the film has its own sound
    setPlaying(true);
  };
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={title || undefined} intro={copy.intro} className="!mb-12" />
      <Reveal className="film-frame">
        <div className="film-screen">
          {playing ? (
            source.kind === "embed" ? (
              <iframe src={source.src} title={title || t("film.title")} className="absolute inset-0 h-full w-full border-0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            ) : (
              <video src={source.src} controls autoPlay playsInline poster={undefined} className="absolute inset-0 h-full w-full bg-black object-contain" />
            )
          ) : (
            <button type="button" onClick={play} className="film-poster" aria-label={`${t("film.play")}${title ? `: ${title}` : ""}`}>
              <Photo id={poster} className="absolute inset-0 h-full w-full" seed={6} sizes="(max-width: 1100px) 100vw, 1100px" />
              <span className="film-veil" aria-hidden />
              <span className="film-play" aria-hidden><Play className="size-7 translate-x-[2px]" fill="currentColor" strokeWidth={0} /></span>
              <span className="film-cta">{t("film.play")}</span>
              <span className="film-bars" aria-hidden />
            </button>
          )}
        </div>
      </Reveal>
      {L(f.caption) && <Reveal delay={150}><p className="inv-serif-lede mx-auto mt-10 max-w-2xl text-center opacity-90">{L(f.caption)}</p></Reveal>}
    </Shell>
  );
}
