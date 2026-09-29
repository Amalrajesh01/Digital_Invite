"use client";
import { cn } from "@/lib/cn";
import type { Person, SectionConfig } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { Shell, SectionHead, useCopy } from "./shared";

function Blurb({ p, role, align = "left" }: { p: Person; role: string; align?: "left" | "center" }) {
  const { L } = useInvitation();
  return (
    <div className={cn("mt-6", align === "center" && "text-center")}>
      <p className="inv-eyebrow">{role}</p>
      <h3 className="inv-h2 mt-2 !text-[clamp(2rem,7vw,3.2rem)]">{L(p.fullName) || L(p.name)}</h3>
      {L(p.parents) && <p className="inv-muted mt-2 text-[0.95rem] italic">{L(p.parents)}</p>}
      {L(p.bio) && <p className={cn("mt-4 max-w-md text-[1.02rem] leading-[1.8]", align === "center" && "mx-auto")}>{L(p.bio)}</p>}
    </div>
  );
}

function Quote() {
  const { view, L } = useInvitation();
  const q = view.doc.couple.quote;
  if (!L(q.text)) return null;
  return (
    <Reveal className="mx-auto mt-20 max-w-2xl text-center md:mt-28">
      <p className="inv-h3 italic !leading-[1.35]" style={{ fontFamily: "var(--f-heading)" }}>“{L(q.text)}”</p>
      {L(q.author) && <p className="inv-eyebrow mt-5">— {L(q.author)}</p>}
    </Reveal>
  );
}

export default function CoupleSection({ section }: { section: SectionConfig }) {
  const { view, t } = useInvitation();
  const c = view.doc.couple;
  const copy = useCopy(section, { title: "couple.title" });
  const first = c.order === "groom-first" ? ("groom" as const) : ("bride" as const);
  const people = first === "bride" ? ([["bride", c.bride], ["groom", c.groom]] as const) : ([["groom", c.groom], ["bride", c.bride]] as const);
  const role = (k: "bride" | "groom") => (k === "bride" ? t("couple.bride") : t("couple.groom"));
  const v = section.variant;

  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} className={!copy.title ? "!mb-10" : ""} />

      {v === "editorial" && (
        <div className="relative grid gap-14 md:grid-cols-2 md:gap-20">
          <span aria-hidden className="inv-script pointer-events-none absolute left-1/2 top-1/3 -z-0 hidden -translate-x-1/2 text-[22rem] leading-none text-[var(--c-accent)] opacity-[0.12] md:block">&amp;</span>
          {people.map(([k, p], i) => (
            <Reveal key={k} delay={i * 120} className={cn("relative z-10", i === 1 && "md:mt-28")}>
              <Photo id={p.photo} ratio="aspect-[4/5]" className="w-full" seed={i + 4} sizes="(max-width: 768px) 100vw, 520px" />
              <Blurb p={p} role={role(k)} />
            </Reveal>
          ))}
        </div>
      )}

      {v === "arch" && (
        <div className="grid gap-16 md:grid-cols-2 md:gap-10">
          {people.map(([k, p], i) => (
            <Reveal key={k} delay={i * 120} className="flex flex-col items-center">
              <div className="inv-arch inv-frame w-[min(72vw,19rem)]">
                <Photo id={p.photo} ratio="aspect-[3/4]" className="inv-arch" seed={i + 6} sizes="(max-width: 768px) 72vw, 304px" />
              </div>
              <Blurb p={p} role={role(k)} align="center" />
            </Reveal>
          ))}
        </div>
      )}

      {(v === "portraits" || !["editorial", "arch"].includes(v)) && (
        <div className="grid gap-12 md:grid-cols-2 md:gap-14">
          {people.map(([k, p], i) => (
            <Reveal key={k} delay={i * 120}>
              <Photo id={p.photo} ratio="aspect-[4/5]" className="w-full" seed={i + 8} sizes="(max-width: 768px) 100vw, 540px" />
              <Blurb p={p} role={role(k)} align="center" />
            </Reveal>
          ))}
        </div>
      )}
      <Quote />
    </Shell>
  );
}
