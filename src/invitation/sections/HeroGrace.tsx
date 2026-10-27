"use client";
import "./hero-grace.css";
import type { SectionConfig } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { ScrollCue, useHeroData } from "./HeroSection";
import { GraceView } from "./GraceView";
import { isReveal } from "@/domain/design/reveals";

export default function HeroGrace({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  const { t } = useInvitation();
  const chosen = section.settings.reveal;
  const reveal = isReveal(chosen) ? chosen : undefined;
  const photo = h.bg ? <Photo id={h.bg} wideId={h.wide} priority className="absolute inset-0 h-full w-full" seed={1} sizes="(max-width: 768px) 80vw, 420px" /> : undefined;
  return (
    <GraceView
      variant={section.variant ?? "gr-heavenly"}
      eyebrow={h.invitation}
      name={h.names.a}
      size={h.size}
      phrase={h.phrase}
      date={h.dateLabel || h.dateText}
      place={[h.venueName, h.city].filter(Boolean).join(" · ")}
      hosts={h.hosts ? t("hero.hostedBy", { hosts: h.hosts }) : ""}
      photo={photo}
      reveal={reveal}
      candle={{ label: t("candle.light", { name: h.names.a }), message: t("candle.lit", { name: h.names.a }) }}
      cue={<ScrollCue />}
    />
  );
}
