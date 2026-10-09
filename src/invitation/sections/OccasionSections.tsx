"use client";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { AgendaItem, Highlight, OccasionPerson, SectionConfig, Sponsor } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { fmtDate, fmtTime } from "../engine/format";
import { Divider } from "../engine/Ornament";
import { initialsOf } from "../engine/subject";
import { Shell, SectionHead, useCopy } from "./shared";

/**
 * The sections of occasions that are not about a couple: what it is (about), the people on stage (speakers), the
 * day (agenda), who stands behind it (sponsors, people), a letter (message), a prayer, and — for a memorial —
 * the tribute. They read `doc.occasion`; every one of them renders nothing when there is nothing to show.
 */

const paragraphs = (s: string) => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const lines = (s: string) => s.split("\n").map((p) => p.trim()).filter(Boolean);

/** A person without a photograph gets a typographic monogram, never a grey box. */
function Avatar({ name, photo, className, ratio = "aspect-[4/5]", seed = 0, sizes }: { name: string; photo?: string; className?: string; ratio?: string; seed?: number; sizes?: string }) {
  const { media } = useInvitation();
  if (photo && media(photo)) return <Photo id={photo} ratio={ratio} className={cn("w-full", className)} seed={seed} sizes={sizes ?? "(max-width: 768px) 50vw, 280px"} alt={name} />;
  return (
    <div className={cn("occ-mono", ratio, className)} aria-hidden>
      <span>{initialsOf(name) || "·"}</span>
    </div>
  );
}

// ── about ───────────────────────────────────────────────────────────────────
/** The facts at a glance. A component of its own — one defined inside another is a new component on every render. */
function FactList({ facts, className }: { facts: Highlight[]; className?: string }) {
  const { L } = useInvitation();
  if (!facts.length) return null;
  return (
    <ul className={cn("occ-facts", className)}>
      {facts.map((f, i) => (
        <Reveal key={f.id} as="li" delay={i * 70} className="occ-fact">
          <span className="occ-fact-value inv-num">{L(f.value)}</span>
          <span className="occ-fact-label">{L(f.label)}</span>
          {L(f.note) && <span className="occ-fact-note">{L(f.note)}</span>}
        </Reveal>
      ))}
    </ul>
  );
}

export function AboutSection({ section }: { section: SectionConfig }) {
  const { view, L } = useInvitation();
  const a = view.doc.occasion.about;
  const copy = useCopy(section, { eyebrow: L(a.eyebrow) || "about.eyebrow", title: L(a.title) || "about.title" });
  const body = paragraphs(L(a.body));
  const facts = a.highlights;
  if (!body.length && !facts.length) return null;
  const v = section.variant;
  const quote = L(a.quote.text);

  const Quote = quote ? (
    <Reveal className="mx-auto mt-16 max-w-2xl text-center md:mt-24">
      <p className="inv-h3 !leading-[1.35]" style={{ fontFamily: "var(--f-heading)" }}>“{quote}”</p>
      {L(a.quote.author) && <p className="inv-eyebrow mt-5">— {L(a.quote.author)}</p>}
    </Reveal>
  ) : null;

  if (v === "statement") {
    return (
      <Shell section={section} wide={false}>
        <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} />
        {body[0] && <Reveal><p className="inv-serif-lede text-center">{body[0]}</p></Reveal>}
        {body.length > 1 && <div className="occ-body mx-auto mt-8 max-w-xl text-center">{body.slice(1).map((p, i) => (<Reveal key={i} delay={i * 80}><p>{p}</p></Reveal>))}</div>}
        <FactList facts={facts} className="occ-facts-row mt-14" />
        {Quote}
      </Shell>
    );
  }
  if (v === "facts") {
    return (
      <Shell section={section}>
        <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} />
        <FactList facts={facts} className="occ-facts-grid" />
        {body.length > 0 && (
          <div className="occ-body occ-cols mx-auto mt-14 max-w-4xl">
            {body.map((p, i) => (<Reveal key={i} delay={i * 80}><p>{p}</p></Reveal>))}
          </div>
        )}
        {Quote}
      </Shell>
    );
  }
  return (
    <Shell section={section}>
      <div className="occ-about">
        <div>
          <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} align="left" className="!mb-8" />
          <div className="occ-body">
            {body.map((p, i) => (<Reveal key={i} delay={i * 80}>{i === 0 ? <p className="inv-serif-lede !text-[clamp(1.2rem,3.6vw,1.55rem)]">{p}</p> : <p>{p}</p>}</Reveal>))}
          </div>
        </div>
        <FactList facts={facts} />
      </div>
      {Quote}
    </Shell>
  );
}

// ── tribute (memorial) ──────────────────────────────────────────────────────
function yearOf(iso: string) {
  return iso ? iso.slice(0, 4) : "";
}
function ageBetween(born: string, passed: string): number | null {
  if (!born || !passed) return null;
  const [by, bm, bd] = born.split("-").map(Number);
  const [py, pm, pd] = passed.split("-").map(Number);
  let age = py - by;
  if (pm < bm || (pm === bm && pd < bd)) age--;
  return age >= 0 && age < 130 ? age : null;
}

export function TributeSection({ section }: { section: SectionConfig }) {
  const { view, L, t, locale } = useInvitation();
  const o = view.doc.occasion;
  const h = o.honoree;
  const copy = useCopy(section, { eyebrow: "tribute.eyebrow" });
  const name = L(h.fullName) || L(h.name) || L(o.title) || view.wedding.title;
  const age = ageBetween(h.born, h.passed);
  const years = h.born || h.passed ? `${yearOf(h.born)}${h.born && h.passed ? "  —  " : ""}${yearOf(h.passed)}` : "";
  return (
    <Shell section={section} wide={false}>
      <div className="occ-tribute">
        <Reveal variant="fade"><p className="inv-eyebrow">{copy.eyebrow}</p></Reveal>
        <Reveal variant="mask" className="occ-portrait">
          <Photo id={h.photo} ratio="aspect-[4/5]" className="w-full" seed={7} sizes="(max-width: 768px) 78vw, 360px" alt={name} />
        </Reveal>
        <Reveal delay={150}>
          <h2 className="occ-tribute-name">{name}</h2>
          {L(h.role) && <p className="occ-tribute-role">{L(h.role)}</p>}
          {years && <p className="occ-tribute-years inv-num" aria-label={[h.born && fmtDate(h.born, locale, "long"), h.passed && fmtDate(h.passed, locale, "long")].filter(Boolean).join(" – ")}>{years}</p>}
          {(h.born || h.passed) && (
            <dl className="occ-tribute-dates">
              {h.born && (<div><dt>{t("tribute.born")}</dt><dd>{fmtDate(h.born, locale, "monthDay")}, {yearOf(h.born)}</dd></div>)}
              {h.passed && (<div><dt>{t("tribute.passed")}</dt><dd>{fmtDate(h.passed, locale, "monthDay")}, {yearOf(h.passed)}</dd></div>)}
              {age != null && (<div><dt>Aged</dt><dd>{age} years</dd></div>)}
            </dl>
          )}
          {L(h.epitaph) && <p className="occ-tribute-epitaph">{L(h.epitaph)}</p>}
        </Reveal>
      </div>
    </Shell>
  );
}

// ── speakers ────────────────────────────────────────────────────────────────
export function SpeakersSection({ section }: { section: SectionConfig }) {
  const { view, L, t } = useInvitation();
  const copy = useCopy(section, { eyebrow: "speakers.eyebrow", title: "speakers.title" });
  const all = view.doc.occasion.speakers;
  if (!all.length) return null;
  const v = section.variant;
  const lead = v === "featured" ? all.find((s) => s.featured) ?? all[0] : null;
  const rest = lead ? all.filter((s) => s !== lead) : all;

  if (v === "list") {
    return (
      <Shell section={section} wide={false}>
        <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} />
        <ol className="occ-roll">
          {all.map((s, i) => (
            <Reveal key={s.id} as="li" delay={(i % 6) * 60} className="occ-roll-row">
              <span className="occ-roll-name">{L(s.name)}</span>
              <span className="occ-roll-role">{[L(s.role), L(s.org)].filter(Boolean).join(" · ")}</span>
              {L(s.topic) && <span className="occ-roll-topic">{L(s.topic)}</span>}
            </Reveal>
          ))}
        </ol>
      </Shell>
    );
  }

  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} />
      {lead && (
        <Reveal className="occ-lead">
          <Avatar name={L(lead.name)} photo={lead.photo} ratio="aspect-[4/5]" seed={3} sizes="(max-width: 900px) 100vw, 460px" />
          <div className="occ-lead-body">
            <p className="inv-eyebrow !text-[var(--c-accent)]">{t("speakers.topic")}</p>
            {L(lead.topic) && <p className="inv-serif-lede mt-3">“{L(lead.topic)}”</p>}
            <h3 className="inv-h3 mt-8">{L(lead.name)}</h3>
            <p className="occ-person-role">{L(lead.role)}</p>
            {L(lead.org) && <p className="occ-person-org">{L(lead.org)}</p>}
            {L(lead.bio) && <p className="inv-muted mt-5 leading-[1.8]">{L(lead.bio)}</p>}
          </div>
        </Reveal>
      )}
      <ul className={cn("occ-people", lead && "mt-16")}>
        {rest.map((s, i) => (
          <Reveal key={s.id} as="li" delay={(i % 4) * 90} className="occ-person">
            <Avatar name={L(s.name)} photo={s.photo} seed={i + 2} />
            <h3 className="occ-person-name">{L(s.name)}</h3>
            {L(s.role) && <p className="occ-person-role">{L(s.role)}</p>}
            {L(s.org) && <p className="occ-person-org">{L(s.org)}</p>}
            {L(s.topic) && <p className="occ-person-topic">{L(s.topic)}</p>}
          </Reveal>
        ))}
      </ul>
    </Shell>
  );
}

// ── agenda ──────────────────────────────────────────────────────────────────
const KIND_LABEL: Record<AgendaItem["kind"], string> = { session: "", keynote: "Keynote", panel: "Panel", workshop: "Workshop", break: "", networking: "Networking", ceremony: "Ceremony" };

function byTime(a: AgendaItem, b: AgendaItem) {
  return `${a.day || "9999"} ${a.start || "00:00"}`.localeCompare(`${b.day || "9999"} ${b.start || "00:00"}`);
}

function AgendaRow({ item, index }: { item: AgendaItem; index: number }) {
  const { L, locale, t } = useInvitation();
  const kind = item.kind === "break" ? t("agenda.break") : KIND_LABEL[item.kind];
  const who = L(item.speaker);
  return (
    <li className="occ-slot" data-kind={item.kind} style={{ "--i": Math.min(index, 14) } as React.CSSProperties}>
      <div className="occ-slot-time inv-num">
        {item.start && <span>{fmtTime(item.start, locale)}</span>}
        {item.end && <span className="occ-slot-end">{fmtTime(item.end, locale)}</span>}
      </div>
      <div className="occ-slot-body">
        {kind && <span className="occ-chip occ-chip-kind">{kind}</span>}
        <h3 className="occ-slot-title">{L(item.title)}</h3>
        {who && <p className="occ-slot-who">{t("agenda.with", { who })}</p>}
        {(L(item.track) || L(item.room)) && (
          <p className="occ-slot-meta">
            {L(item.track) && <span className="occ-chip">{L(item.track)}</span>}
            {L(item.room) && <span className="occ-slot-room">{L(item.room)}</span>}
          </p>
        )}
        {L(item.description) && <p className="occ-slot-desc">{L(item.description)}</p>}
      </div>
    </li>
  );
}

export function AgendaSection({ section }: { section: SectionConfig }) {
  const { view, L, t, locale } = useInvitation();
  const o = view.doc.occasion;
  const copy = useCopy(section, { eyebrow: "agenda.eyebrow", title: "agenda.title" });
  const items = useMemo(() => [...o.agenda].sort(byTime), [o.agenda]);
  const days = useMemo(() => [...new Set(items.map((i) => i.day))], [items]);
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const day = days[Math.min(active, days.length - 1)];
  const shown = items.filter((i) => i.day === day);
  const reg = o.registration;
  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} />
      {days.length > 1 && (
        <div className="inv-tabs mb-10" role="tablist" aria-label={copy.title || t("agenda.title")}>
          {days.map((d, i) => (
            <button key={d || i} role="tab" type="button" aria-selected={i === active} className="inv-tab" onClick={() => setActive(i)}>
              {t("agenda.day", { n: i + 1 })}{d ? ` · ${fmtDate(d, locale, "monthDay")}` : ""}
            </button>
          ))}
        </div>
      )}
      <div role="tabpanel" data-rail={section.variant === "timeline"}>
        {day && days.length === 1 && <p className="occ-day-label inv-eyebrow">{fmtDate(day, locale, "long")}</p>}
        <ol className="occ-slots">
          {shown.map((it, i) => (<AgendaRow key={`${day}-${it.id}`} item={it} index={i} />))}
        </ol>
      </div>
      {(reg.url || L(reg.note)) && (
        <Reveal className="mt-14 text-center">
          {L(reg.note) && <p className="inv-muted mx-auto mb-5 max-w-md">{L(reg.note)}</p>}
          {reg.url && <a href={reg.url} target="_blank" rel="noopener noreferrer" className="inv-btn">{L(reg.label) || t("agenda.register")}</a>}
        </Reveal>
      )}
    </Shell>
  );
}

// ── sponsors ────────────────────────────────────────────────────────────────
function Wordmark({ s }: { s: Sponsor }) {
  const { L } = useInvitation();
  const inner = s.logo ? (
    <Photo id={s.logo} ratio="aspect-[3/1]" className="occ-logo" imgClassName="!object-contain" alt={L(s.name)} sizes="220px" />
  ) : (
    <span className="occ-wordmark">{L(s.name)}</span>
  );
  return s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="occ-sponsor" aria-label={L(s.name)}>{inner}</a> : <span className="occ-sponsor">{inner}</span>;
}

export function SponsorsSection({ section }: { section: SectionConfig }) {
  const { view, L } = useInvitation();
  const copy = useCopy(section, { eyebrow: "sponsors.eyebrow", title: "sponsors.title" });
  const all = view.doc.occasion.sponsors;
  const tiers = useMemo(() => {
    const out: { tier: string; items: Sponsor[] }[] = [];
    for (const s of all) {
      const tier = L(s.tier);
      const g = out.find((x) => x.tier === tier);
      if (g) g.items.push(s);
      else out.push({ tier, items: [s] });
    }
    return out;
  }, [all, L]);
  if (!all.length) return null;
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} />
      <div className="occ-tiers">
        {tiers.map((g, gi) => (
          <Reveal key={g.tier || gi} className="occ-tier">
            {g.tier && <p className="inv-eyebrow occ-tier-name">{g.tier}</p>}
            <ul className="occ-tier-row" data-size={gi === 0 ? "lg" : "md"}>
              {g.items.map((s) => (<li key={s.id}><Wordmark s={s} /></li>))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}

// ── message ─────────────────────────────────────────────────────────────────
export function MessageSection({ section }: { section: SectionConfig }) {
  const { view, L } = useInvitation();
  const m = view.doc.occasion.message;
  const copy = useCopy(section, { eyebrow: L(m.title) ? undefined : "message.eyebrow", title: L(m.title) || "message.title" });
  const body = paragraphs(L(m.body));
  if (!body.length) return null;
  if (section.variant === "pull") {
    return (
      <Shell section={section} wide={false}>
        <Reveal className="occ-pull">
          <p className="occ-pull-text">{body[0]}</p>
          {(L(m.from) || L(m.role)) && <p className="occ-sign-line"><strong>{L(m.from)}</strong>{L(m.role) && <span>{L(m.role)}</span>}</p>}
        </Reveal>
      </Shell>
    );
  }
  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} />
      <Reveal className="occ-letter">
        {m.photo && <Photo id={m.photo} ratio="aspect-square" className="occ-letter-photo" seed={4} sizes="120px" alt={L(m.from)} />}
        <div className="occ-body">{body.map((p, i) => (<p key={i}>{p}</p>))}</div>
        {(L(m.from) || L(m.role)) && (
          <p className="occ-sign">
            {L(m.from) && <span className="inv-script occ-sign-name">{L(m.from)}</span>}
            {L(m.role) && <span className="occ-sign-role">{L(m.role)}</span>}
          </p>
        )}
      </Reveal>
    </Shell>
  );
}

// ── people ──────────────────────────────────────────────────────────────────
export function PeopleSection({ section }: { section: SectionConfig }) {
  const { view, L } = useInvitation();
  const copy = useCopy(section, { eyebrow: "people.eyebrow", title: "people.title" });
  const all = view.doc.occasion.people;
  const groups = useMemo(() => {
    const out: { group: string; items: OccasionPerson[] }[] = [];
    for (const p of all) {
      const g = L(p.group);
      const hit = out.find((x) => x.group === g);
      if (hit) hit.items.push(p);
      else out.push({ group: g, items: [p] });
    }
    return out;
  }, [all, L]);
  if (!all.length) return null;
  const cards = section.variant === "cards";
  return (
    <Shell section={section} wide={cards}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} />
      <div className="occ-groups">
        {groups.map((g, gi) => (
          <Reveal key={g.group || gi} className="occ-group">
            {g.group && <p className="inv-eyebrow occ-group-name">{g.group}</p>}
            {cards ? (
              <ul className="occ-people occ-people-sm">
                {g.items.map((p, i) => (
                  <li key={p.id} className="occ-person">
                    <Avatar name={L(p.name)} photo={p.photo} seed={i + gi} ratio="aspect-square" className="occ-round" sizes="160px" />
                    <h3 className="occ-person-name">{L(p.name)}</h3>
                    {L(p.relation) && <p className="occ-person-role">{L(p.relation)}</p>}
                    {L(p.note) && <p className="occ-person-topic">{L(p.note)}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="occ-names">
                {g.items.map((p) => (
                  <li key={p.id}>
                    <span className="occ-names-name">{L(p.name)}</span>
                    {(L(p.relation) || L(p.note)) && <span className="occ-names-rel">{[L(p.relation), L(p.note)].filter(Boolean).join(" — ")}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}

// ── prayer ──────────────────────────────────────────────────────────────────
export function PrayerSection({ section }: { section: SectionConfig }) {
  const { view, L } = useInvitation();
  const p = view.doc.occasion.prayer;
  const copy = useCopy(section, { eyebrow: L(p.title) ? undefined : "prayer.eyebrow", title: L(p.title) || "prayer.title" });
  const text = lines(L(p.text));
  if (!text.length) return null;
  return (
    <Shell section={section} wide={false}>
      <div className="occ-prayer">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} />
        <Reveal>
          <blockquote className="occ-verse">
            {text.map((l, i) => (<p key={i}>{l}</p>))}
          </blockquote>
          {L(p.source) && <p className="inv-eyebrow occ-verse-source">{L(p.source)}</p>}
          <Divider kind={view.tokens.divider} className="mt-10" />
        </Reveal>
      </div>
    </Shell>
  );
}
