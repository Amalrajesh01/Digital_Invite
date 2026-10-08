"use client";
import type { SectionConfig } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Glyph } from "../engine/Glyphs";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { Shell, SectionHead, useCopy } from "./shared";

/**
 * The rituals of the wedding, explained. The list is entirely the couple's own — no two families observe the
 * same ceremonies — so nothing here assumes Ganesh Puja, Haldi or a Baraat: it renders whatever was written.
 *   editorial → arch-framed photographs that walk down the page (swipeable on a phone)
 *   grid      → quiet line illustrations and short text, for ceremonies without photographs
 */
export default function CeremoniesSection({ section }: { section: SectionConfig }) {
  const { view, L } = useInvitation();
  const copy = useCopy(section, { eyebrow: "ceremonies.eyebrow", title: "ceremonies.title" });
  const c = view.doc.ceremonies;
  const banner = view.doc.images.ceremony; // only the explicitly chosen photograph — never a repeat of another section's
  const intro = L(c.intro) || copy.intro;
  if (!c.items.length) return null;
  const grid = section.variant === "grid";
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={intro} className="!mb-12" />
      {banner && (
        <Reveal variant="mask" className="cer-banner">
          <Photo id={banner} ratio="aspect-[16/10] md:aspect-[21/9]" className="w-full" seed={4} sizes="(max-width: 1100px) 100vw, 1100px" />
        </Reveal>
      )}
      {grid ? (
        <ol className="cer-grid">
          {c.items.map((it, i) => (
            <Reveal as="li" key={it.id} delay={(i % 4) * 80} className="cer-cell">
              <span className="cer-glyph"><Glyph name={it.glyph === "none" ? "lamp" : it.glyph} /></span>
              <h3 className="cer-name">{L(it.name)}</h3>
              {L(it.when) && <p className="cer-when">{L(it.when)}</p>}
              {L(it.description) && <p className="cer-desc">{L(it.description)}</p>}
            </Reveal>
          ))}
        </ol>
      ) : (
        <ol className="cer-arches" tabIndex={0} aria-label={copy.title}>
          {c.items.map((it, i) => (
            <Reveal as="li" key={it.id} delay={(i % 4) * 90} className="cer-arch">
              <div className="cer-arch-frame">
                {it.photo ? (
                  <Photo id={it.photo} ratio="aspect-[3/4]" className="w-full" seed={i + 3} sizes="(max-width: 900px) 70vw, 280px" />
                ) : (
                  <div className="cer-arch-glyph"><span><Glyph name={it.glyph === "none" ? "lamp" : it.glyph} /></span></div>
                )}
              </div>
              <span className="cer-num inv-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
              <h3 className="cer-name">{L(it.name)}</h3>
              {L(it.when) && <p className="cer-when">{L(it.when)}</p>}
              {L(it.description) && <p className="cer-desc">{L(it.description)}</p>}
            </Reveal>
          ))}
        </ol>
      )}
    </Shell>
  );
}
