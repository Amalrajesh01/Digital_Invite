"use client";
import { cn } from "@/lib/cn";
import type { SectionConfig, LocalizedText } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Reveal, RevealWords } from "../engine/motion";
import type { StringKey } from "../i18n/strings";

export type Tone = "light" | "tint" | "night";

const DEFAULT_TONE: Partial<Record<SectionConfig["type"], Tone>> = {
  story: "light", timeline: "tint", countdown: "night", events: "light", ceremonies: "tint", dresscode: "tint", games: "tint", quiz: "tint", scavenger: "tint",
  film: "night", rsvp: "tint", livesched: "night", photowall: "night", liveupdate: "tint", livestream: "night", qrpass: "tint", checkin: "light",
  timecapsule: "night", anniversary: "night", thankyou: "tint", memory: "light", travel: "tint", wishes: "tint", guestupload: "light", gallery: "light",
  about: "light", tribute: "light", speakers: "tint", agenda: "light", sponsors: "tint", message: "tint", people: "light", prayer: "night",
};

export function toneFor(section: SectionConfig, flavor: string): Tone {
  const set = section.settings.tone;
  if (set === "light" || set === "tint" || set === "night") return set;
  const base = DEFAULT_TONE[section.type] ?? "light";
  // Cinematic flavour leans nocturnal: light sections become tinted so the page keeps its mood.
  if (flavor === "cinematic" && base === "light") return "tint";
  return base;
}

/** Section copy: super admin overrides (content.eyebrow/title/intro) or the built-in translated default. */
export function useCopy(section: SectionConfig, defaults: { eyebrow?: StringKey | string; title?: StringKey | string; intro?: StringKey | string } = {}) {
  const { t, L } = useInvitation();
  const c = section.content as Record<string, LocalizedText | undefined>;
  const pick = (k: "eyebrow" | "title" | "intro") => {
    const own = L(c[k]);
    if (own) return own;
    const d = defaults[k];
    if (!d) return "";
    return d.includes(".") ? t(d as StringKey) : d;
  };
  return { eyebrow: pick("eyebrow"), title: pick("title"), intro: pick("intro") };
}

export function SectionHead({ eyebrow, title, intro, align = "center", tone, className }: { eyebrow?: string; title?: string; intro?: string; align?: "center" | "left"; tone?: Tone; className?: string }) {
  void tone;
  return (
    <div className={cn("inv-head chap", align === "left" && "!text-left", className)}>
      <Reveal variant="fade"><span className="chap-line" aria-hidden style={align === "left" ? { marginInline: 0 } : undefined} /></Reveal>
      {eyebrow && (
        <Reveal variant="fade" delay={80}>
          <p className="inv-eyebrow">{eyebrow}</p>
        </Reveal>
      )}
      {title && <RevealWords text={title} className="inv-h2" />}
      {intro && (
        <Reveal delay={150} className={cn(align === "center" && "mx-auto")}>
          <p className={cn("inv-lede mt-5", align === "center" && "mx-auto")}>{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

export function Shell({ section, tone, className, children, wide = true, id }: { section: SectionConfig; tone?: Tone; className?: string; children: React.ReactNode; wide?: boolean; id?: string }) {
  const { view } = useInvitation();
  const tn = tone ?? toneFor(section, view.flavor);
  return (
    <section
      id={id ?? `s-${section.type}`}
      data-section={section.type}
      data-tone={tn}
      aria-labelledby={undefined}
      className={cn("inv-section", tn === "night" && "inv-night", tn === "tint" && "inv-tint", className)}
    >
      <div className={wide ? "inv-wrap" : "inv-wrap-narrow"}>{children}</div>
    </section>
  );
}

export function InlineNotice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "error" | "ok" }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={cn("rounded-[var(--r)] border px-4 py-3 text-[0.95rem]", tone === "error" ? "border-[#c9847e] bg-[#b3372f]/10" : tone === "ok" ? "border-[var(--c-accent)] bg-[var(--c-accent)]/10" : "border-[var(--c-border)] bg-[var(--c-surface)]")}>
      {children}
    </p>
  );
}
