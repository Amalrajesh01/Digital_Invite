"use client";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";
import { newId } from "@/lib/id";
import { TRANSLATION, VERIFIED, VERSES, verseById, verseSource, verseText } from "@/domain/baptism/scripture";
import { Hint } from "../forms";
import { useDraft } from "../draft";

/**
 * The two things a baptism needs that other occasions do not: a verse quoted exactly, and a family told in the family’s own words.
 * Both only fill in fields the occasion editor already has (`occasion.prayer`, `occasion.people`) — nothing here is stored separately,
 * so a family can edit or remove anything afterwards.
 */
const WHO: { key: string; label: string; group: string; people: [relation: string][] }[] = [
  { key: "parents", label: "Parents", group: "Parents", people: [["Mother"], ["Father"]] },
  { key: "grandparents", label: "Grandparents", group: "Grandparents", people: [["Grandmother"], ["Grandfather"]] },
  { key: "godparents", label: "Godparents", group: "Godparents", people: [["Godmother"], ["Godfather"]] },
];

/** A list of verses, quoted word for word from one translation. Choosing one fills the heading, the words and the reference. */
export function VersePicker() {
  const { update } = useDraft();
  const pick = (id: string) => {
    const v = verseById(id);
    if (!v) return;
    update((d) => {
      d.occasion.prayer.text = { ...d.occasion.prayer.text, en: verseText(v) };
      d.occasion.prayer.source = { ...d.occasion.prayer.source, en: verseSource(v) };
    });
  };
  return (
    <>
      <SelectField label="Choose a verse" value="" onChange={(e) => pick(e.target.value)} hint={`Quoted word for word from the ${TRANSLATION.name} (${TRANSLATION.licence.toLowerCase()}), checked against a published text on ${VERIFIED.on}.`}>
        <option value="">Choose a verse to fill in the fields below…</option>
        {VERSES.map((v) => <option key={v.id} value={v.id}>{v.ref}{v.excerpt ? " (part)" : ""} — {v.text.split(" ").slice(0, 8).join(" ")}…</option>)}
      </SelectField>
      <Hint>Or type any verse of your own, in any translation or language, in the boxes below. We never change what you write, so please check the wording and the reference yourself — and add the reading in your second language yourself too; we do not translate scripture.</Hint>
    </>
  );
}

/** One tap adds the people most baptisms name, each with a heading and a relation the family can rewrite (“Appachan”, “Nanu”, “Mama”…). */
export function FamilyQuickAdd() {
  const { doc, update } = useDraft();
  const has = (group: string) => doc.occasion.people.some((p) => (p.group.en ?? "").toLowerCase() === group.toLowerCase());
  const add = (w: (typeof WHO)[number]) =>
    update((d) => {
      for (const [relation] of w.people) d.occasion.people.push({ id: newId(), group: { en: w.group }, name: {}, relation: { en: relation }, note: {}, photo: undefined });
    });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13.5px] text-ink-2">Quick add:</span>
      {WHO.map((w) => (
        <Button key={w.key} type="button" variant="quiet" size="sm" disabled={has(w.group)} onClick={() => add(w)}>{has(w.group) ? `${w.label} added` : `+ ${w.label}`}</Button>
      ))}
      <span className="text-[13.5px] text-ink-2">Then rewrite the headings and relations in your own words.</span>
    </div>
  );
}
