"use client";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { FamilyMember, SectionConfig } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { useSlot } from "../engine/images";
import { Segmented } from "./Segmented";
import { Shell, SectionHead, useCopy } from "./shared";

/**
 * "With the blessings of our parents" — set as typography. Each side is a family name, the parents' line in
 * the display face and a quiet list of the people who matter; one optional photograph of everyone together.
 */
function Editorial() {
  const { view, L, t } = useInvitation();
  const f = view.doc.family;
  const c = view.doc.couple;
  const photo = useSlot("family");
  const side = (s: "bride" | "groom") => f.members.filter((m) => m.side === s);
  const block = (s: "bride" | "groom", title: string, fam: string, parents: string) => (
    <Reveal className="fam-side">
      <p className="inv-eyebrow">{title}</p>
      {fam && <h3 className="fam-name">{fam}</h3>}
      {parents && <p className="fam-parents">{parents}</p>}
      {side(s).length > 0 && (
        <ul className="fam-list">
          {side(s).map((m) => (
            <li key={m.id}>
              {m.photo && <Photo id={m.photo} className="fam-avatar" seed={7} sizes="56px" />}
              <span className="fam-person"><span className="fam-person-name">{L(m.name)}</span><span className="fam-person-rel">{L(m.relation)}</span></span>
            </li>
          ))}
        </ul>
      )}
    </Reveal>
  );
  return (
    <>
      {photo && <Reveal variant="mask" className="fam-photo"><Photo id={photo} ratio="aspect-[3/2] md:aspect-[2/1]" className="w-full" seed={5} sizes="(max-width: 1100px) 100vw, 1100px" /></Reveal>}
      <div className="fam-grid">
        {block("bride", t("family.bride"), L(f.brideFamilyName), L(c.bride.parents))}
        <span className="fam-amp inv-script" aria-hidden>&amp;</span>
        {block("groom", t("family.groom"), L(f.groomFamilyName), L(c.groom.parents))}
      </div>
      {f.party.length > 0 && (
        <div className="mt-28">
          <p className="inv-eyebrow mb-10 text-center">{t("family.party")}</p>
          <ul className="mx-auto grid max-w-4xl grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {f.party.map((p, i) => (
              <Reveal as="li" key={p.id} delay={i * 60} className="text-center">
                <Photo id={p.photo} className="mx-auto size-24 rounded-full md:size-28" seed={i + 11} sizes="112px" />
                <p className="inv-h4 mt-4">{L(p.name)}</p>
                <p className="inv-muted text-[0.88rem]">{L(p.role)}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function List() {
  const { view, L, t } = useInvitation();
  const f = view.doc.family;
  return (
    <div className="mx-auto grid max-w-3xl gap-10 md:grid-cols-2">
      {(["bride", "groom"] as const).map((s) => (
        <div key={s}>
          <p className="inv-eyebrow mb-4">{s === "bride" ? t("family.bride") : t("family.groom")}</p>
          <ul className="space-y-3">
            {f.members.filter((m) => m.side === s).map((m) => (
              <li key={m.id}><span className="inv-h4">{L(m.name)}</span> <span className="inv-muted">— {L(m.relation)}</span></li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

type Node = { m: FamilyMember; spouse?: FamilyMember; children: Node[] };
function buildTree(members: FamilyMember[]): Node[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const spouseOf = new Map<string, FamilyMember>();
  for (const m of members) if (m.spouseOf && byId.has(m.spouseOf)) spouseOf.set(m.spouseOf, m);
  const make = (m: FamilyMember): Node => ({ m, spouse: spouseOf.get(m.id), children: members.filter((c) => c.parentId === m.id || (spouseOf.get(m.id) && c.parentId === spouseOf.get(m.id)!.id)).map(make) });
  const roots = members.filter((m) => !m.parentId && !(m.spouseOf && byId.has(m.spouseOf)));
  return roots.map(make);
}

function TreeNode({ n, active, onPick }: { n: Node; active: string | null; onPick: (m: FamilyMember) => void }) {
  const { L } = useInvitation();
  const chip = (m: FamilyMember) => (
    <button type="button" onClick={() => onPick(m)} aria-pressed={active === m.id} className={cn("tree-chip", active === m.id && "is-active")}>
      <span className="block text-[0.98rem] leading-tight">{L(m.name)}</span>
      <span className="block text-[0.72rem] uppercase tracking-[0.12em] opacity-65">{L(m.relation)}</span>
    </button>
  );
  return (
    <li>
      <div className="tree-couple">
        {chip(n.m)}
        {n.spouse && (<><span aria-hidden className="tree-join">+</span>{chip(n.spouse)}</>)}
      </div>
      {n.children.length > 0 && (
        <ul>
          {n.children.map((c) => (
            <TreeNode key={c.m.id} n={c} active={active} onPick={onPick} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Tree() {
  const { view, L, t } = useInvitation();
  const [side, setSide] = useState<"bride" | "groom">("bride");
  const [picked, setPicked] = useState<FamilyMember | null>(null);
  const trees = useMemo(() => buildTree(view.doc.family.members.filter((m) => m.side === side)), [view.doc.family.members, side]);
  return (
    <div>
      <div className="mb-10 flex justify-center">
        <Segmented value={side} onChange={(v) => { setSide(v); setPicked(null); }} label={t("family.tree")} options={[{ value: "bride", label: t("family.bride") }, { value: "groom", label: t("family.groom") }]} />
      </div>
      <div className="tree-scroll" tabIndex={0} aria-label={t("family.tree")}>
        <div className="tree">
          {trees.map((n) => (<ul key={n.m.id}><TreeNode n={n} active={picked?.id ?? null} onPick={setPicked} /></ul>))}
        </div>
      </div>
      <p className="inv-muted mt-6 text-center text-[0.9rem]">{t("family.tap")}</p>
      {picked && (
        <div className="inv-card mx-auto mt-6 max-w-md p-6 text-center" role="status">
          {picked.photo && <Photo id={picked.photo} className="mx-auto mb-4 size-24 rounded-full" seed={3} sizes="96px" />}
          <p className="inv-h3">{L(picked.name)}</p>
          <p className="inv-eyebrow mt-1">{L(picked.relation)}</p>
          {L(picked.blurb) && <p className="inv-muted mt-3 text-[0.98rem] leading-[1.75]">{L(picked.blurb)}</p>}
        </div>
      )}
    </div>
  );
}

export default function FamilySection({ section }: { section: SectionConfig }) {
  const { has, view } = useInvitation();
  const copy = useCopy(section, { eyebrow: "family.title", title: "family.blessings" });
  const f = view.doc.family;
  if (!f.members.length && !f.party.length) return null;
  const variant = section.variant === "tree" && !has("family_tree") ? "editorial" : section.variant;
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} className="!mb-14" />
      {variant === "tree" ? <Tree /> : variant === "list" ? <List /> : <Editorial />}
    </Shell>
  );
}
