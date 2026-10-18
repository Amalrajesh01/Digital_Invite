import type { InvitationDoc, SectionConfig } from "@/domain/doc/schema";

/**
 * "Still the sample": a template starts as its sample invitation, so the sample's names, places and photographs are in the
 * document until the person replaces them. These helpers find what is left, live, as they edit. Browser-safe.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Which section to open for a part of the document. */
const AREA_SECTION: Record<string, SectionConfig["type"]> = { couple: "couple", family: "family", story: "story", events: "events", venues: "venue", ceremonies: "ceremonies", menu: "menu", occasion: "about" };

export interface SampleHit { token: string; areas: { label: string; sectionType?: SectionConfig["type"]; /** the fixed 'Link preview & message' entry, which is not a section */ share?: boolean }[] }

const LABEL: Record<string, string> = { couple: "The couple", family: "Family", story: "Our story", events: "Events", venues: "Venue", ceremonies: "Ceremonies", menu: "Menu", occasion: "About", seo: "Link preview", opening: "Opening", rsvp: "Reply form", whatsapp: "WhatsApp", contacts: "Contacts" };

export function sampleHits(doc: InvitationDoc, tokens: string[]): SampleHit[] {
  if (!tokens.length) return [];
  const lower = tokens.map((t) => t.toLowerCase());
  const found = new Map<string, Map<string, SectionConfig["type"] | undefined>>();
  const shareAreas = new Set<string>();
  const walk = (node: unknown, area: string, type?: SectionConfig["type"]) => {
    if (typeof node === "string") {
      const s = node.toLowerCase();
      lower.forEach((t, i) => {
        if (!s.includes(t)) return;
        const m = found.get(tokens[i]) ?? new Map();
        m.set(area, type);
        found.set(tokens[i], m);
      });
    } else if (Array.isArray(node)) node.forEach((n) => walk(n, area, type));
    else if (node && typeof node === "object") Object.values(node).forEach((v) => walk(v, area, type));
  };
  for (const [k, v] of Object.entries(doc)) {
    if (k === "sections") for (const s of doc.sections) walk(s.content, s.type, s.type);
    else { if (k === "seo") shareAreas.add(LABEL.seo); walk(v, LABEL[k] ?? k, AREA_SECTION[k]); }
  }
  return [...found.entries()].map(([token, areas]) => ({ token, areas: [...areas.entries()].map(([label, sectionType]) => ({ label: LABEL[label] ?? label, sectionType, share: shareAreas.has(label) })) }));
}

/** The sample's photographs that this document still shows. */
export function samplePhotosUsed(doc: unknown, samplePhotos: string[]): string[] {
  const set = new Set(samplePhotos);
  const used = new Set<string>();
  const walk = (n: unknown) => {
    if (typeof n === "string") { if (UUID.test(n) && set.has(n)) used.add(n); }
    else if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === "object") Object.values(n).forEach(walk);
  };
  walk(doc);
  return [...used];
}
