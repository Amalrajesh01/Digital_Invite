import { and, asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { type Actor, requireAdmin } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { invalid, notFound } from "@/lib/errors";
import { storageFor } from "@/lib/storage";
import { TemplateConfig } from "@/domain/design/templates";
import { isCoupleEvent } from "@/domain/doc/event-types";
import { type InvitationDoc } from "@/domain/doc/schema";
import { collectAssetIds, ingestFile, type IngestInput } from "@/domain/media/service";
import { loadPlacement } from "@/domain/media/cloud";
import type { PackageKey } from "@/domain/packages/features";
import type { CustomerClass } from "@/domain/packages/catalog";
import { createWedding, getWedding, isSlugAvailable, normalizeSlug, saveDraft, slugProblem } from "./service";

/**
 * Start an invitation from a template the way a person wants to: the template's own sample, in full — every word, every
 * photograph, every list — with the names and the date already swapped for this customer's. The super admin then only
 * replaces words and pictures, adds or removes list items, hides and moves sections.
 *
 * What is copied from the sample: its wording, its lists, its photographs (re-processed into this invitation's own
 * library, flagged as sample so the editor can show what is still left to replace) and its gallery. What is never
 * copied: guests, wishes, uploads, music, and the sample's contact buttons (they point at Stack Bridge Labs).
 */
export interface FromTemplateInput {
  templateId: string;
  packageKey: PackageKey;
  /** The invitation's name, e.g. "Anjali & Sidharth". */
  title: string;
  /** Couple: the bride's name. Anyone else: the name the invitation is for (or empty). */
  nameA?: string;
  /** Couple: the groom's name. */
  nameB?: string;
  /** The day (ISO). Every date in the sample moves by the same number of days. */
  date: string;
  slug?: string;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = 86_400_000;
const days = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
const shift = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const first = (s: string) => s.trim().split(/\s+/)[0] ?? "";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Applies fn to every string value in a JSON-like tree (keys are left alone). */
function mapStrings<T>(node: T, fn: (s: string) => string): T {
  if (typeof node === "string") return fn(node) as T;
  if (Array.isArray(node)) return node.map((n) => mapStrings(n, fn)) as T;
  if (node && typeof node === "object") return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, mapStrings(v, fn)])) as T;
  return node;
}

/** Whole words only, so a short name never changes the middle of another word. */
function renamer(pairs: [from: string, to: string][]) {
  const usable = pairs.filter(([a, b]) => a.trim().length >= 2 && a !== b).sort((x, y) => y[0].length - x[0].length);
  const rx = usable.map(([a, b]) => [new RegExp(`(?<![\\p{L}\\p{N}])${esc(a)}(?![\\p{L}\\p{N}])`, "gu"), b] as const);
  return (s: string) => rx.reduce((t, [r, b]) => t.replace(r, b), s);
}

/** The names, places and dates that identify a sample — what must not survive into a customer's invitation. */
export function sampleTokens(doc: InvitationDoc, date: string | null): string[] {
  const out = new Set<string>();
  const add = (s?: string) => { const t = (s ?? "").trim(); if (t.length >= 4) out.add(t); };
  for (const p of [doc.couple.bride, doc.couple.groom]) { add(p.name.en); add(p.fullName.en); add(p.parents.en); }
  add(doc.family.brideFamilyName.en); add(doc.family.groomFamilyName.en);
  for (const m of [...doc.family.members, ...doc.family.party]) add(m.name.en);
  add(doc.occasion.honoree.name.en); add(doc.occasion.honoree.fullName.en); add(doc.occasion.title.en);
  for (const v of doc.venues) { add(v.name.en); add(v.address.en); }
  if (date && ISO.test(date)) {
    const d = new Date(`${date}T00:00:00Z`);
    add(`${d.getUTCDate()} ${d.toLocaleString("en-GB", { month: "long", timeZone: "UTC" })}`);
  }
  return [...out];
}

async function sampleOf(templateConfig: TemplateConfig) {
  if (!templateConfig.demo) return null;
  const db = await getDb();
  const [row] = await db.select().from(schema.weddings).where(and(eq(schema.weddings.slug, templateConfig.demo), eq(schema.weddings.isDemo, true)));
  return row ?? null;
}

async function bytesOf(a: { provider: string; storageKey: string }): Promise<Buffer | null> {
  const obj = await storageFor(a.provider).get(a.storageKey);
  if (!obj) return null;
  return Buffer.isBuffer(obj.body) ? obj.body : Buffer.from(await new Response(obj.body as ReadableStream).arrayBuffer());
}

/**
 * Puts the sample's photographs into the new invitation's own library. Returns old id → new id.
 * A photograph already on Cloudinary is not uploaded again: the new invitation gets its own row pointing at the same image (the rows are
 * what keep invitations apart; the pixels are shared). Replacing it later uploads a new image for that invitation only.
 */
async function cloneImages(fromWeddingId: string, toWeddingId: string, ids: Set<string>, albumMap: Map<string, string>): Promise<Map<string, string>> {
  const db = await getDb();
  const map = new Map<string, string>();
  const assets = (await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, fromWeddingId))).filter((a) => ids.has(a.id) && a.kind === "IMAGE");
  const target = await loadPlacement(toWeddingId);
  const copy = async (a: (typeof assets)[number]) => {
    try {
      const albumId = a.albumId ? albumMap.get(a.albumId) ?? null : null;
      let made: typeof a;
      if (a.provider === "cloudinary" && target.mediaStorage === "cloudinary") {
        // the template's own migration backup (its old files) is not this invitation's to keep or delete
        const metadata = Object.fromEntries(Object.entries(a.metadata).filter(([k]) => k !== "legacy"));
        [made] = await db.insert(schema.mediaAssets).values({ ...a, id: undefined, createdAt: undefined, updatedAt: undefined, metadata, weddingId: toWeddingId, albumId, source: "ADMIN", uploadedByUserId: null, moderatedBy: null, archivedAt: null }).returning();
      } else {
        const buffer = await bytesOf(a);
        if (!buffer) return;
        made = await ingestFile({
          weddingId: toWeddingId, buffer, filename: a.filename || "sample.jpg", category: a.category as IngestInput["category"], allow: ["IMAGE"], source: "ADMIN",
          title: a.title, alt: a.alt, caption: a.caption, albumId,
        });
      }
      await db.update(schema.mediaAssets).set({ focalX: a.focalX, focalY: a.focalY, sortOrder: a.sortOrder, isCover: a.isCover, metadata: { ...made.metadata, sample: true } }).where(eq(schema.mediaAssets.id, made.id));
      map.set(a.id, made.id);
    } catch {
      /* a photograph that cannot be copied is simply left to be added — the rest of the sample still arrives */
    }
  };
  for (let i = 0; i < assets.length; i += 3) await Promise.all(assets.slice(i, i + 3).map(copy));
  return map;
}

async function uniqueSlug(base: string): Promise<string | undefined> {
  const b = normalizeSlug(base);
  if (!b || slugProblem(b)) return undefined;
  for (let i = 0; i < 20; i++) {
    const s = i ? `${b}-${i + 1}` : b;
    if (!slugProblem(s) && (await isSlugAvailable(s))) return s;
  }
  return undefined;
}

export async function createFromTemplate(actor: Actor | null, input: FromTemplateInput): Promise<{ id: string; slug: string; fromSample: boolean; photos: number }> {
  const admin = requireAdmin(actor);
  if (!ISO.test(input.date)) throw invalid("Choose the date.", { date: "Required" });
  if (!input.title.trim()) throw invalid("Give the invitation a name.", { title: "Required" });
  const db = await getDb();
  const [tpl] = await db.select().from(schema.templates).where(eq(schema.templates.id, input.templateId));
  if (!tpl) throw notFound("We could not find that template.");
  const parsed = TemplateConfig.safeParse(tpl.config);
  if (!parsed.success) throw invalid("That template needs repair in Studio → Templates.");
  const config = parsed.data;
  const [theme] = config.suggestedTheme ? await db.select().from(schema.themes).where(eq(schema.themes.slug, config.suggestedTheme)) : [];

  const nameA = input.nameA?.trim() ?? "", nameB = input.nameB?.trim() ?? "";
  const couple = !config.eventType || isCoupleEvent({ eventType: config.eventType });
  const slug = await uniqueSlug(input.slug || (couple && nameA && nameB ? `${first(nameA)}-and-${first(nameB)}` : input.title));

  const w = await createWedding(admin, {
    title: input.title.trim(), slug, packageKey: input.packageKey, customerClass: `PAID_${input.packageKey}` as CustomerClass,
    templateId: tpl.id, themeId: theme?.id ?? null, weddingDate: input.date,
  });
  const cur = (await getWedding(admin, w.id)).draftDoc;
  const sample = await sampleOf(config);
  if (!sample) return { id: w.id, slug: w.slug, fromSample: false, photos: 0 };

  const src = (await getWedding(admin, sample.id)).draftDoc;
  let doc = structuredClone(src);

  // 1 · the structure this package and template give, with the sample's words in it
  const byType = new Map(src.sections.map((s) => [s.type, s]));
  doc.sections = cur.sections.map((s) => ({ ...s, content: byType.get(s.type)?.content ?? s.content }));
  doc.eventType = cur.eventType;
  doc.opening = { ...src.opening, variant: cur.opening.variant };
  doc.whatsapp = cur.whatsapp; // the sample's chat and call buttons point at Stack Bridge Labs
  doc.contacts = cur.contacts;
  doc.rsvp = { ...doc.rsvp, whatsappNumber: cur.rsvp.whatsappNumber };

  // 2 · the sample's photographs, copied into this invitation's own library
  const wanted = collectAssetIds(doc);
  const albums = await db.select().from(schema.galleryAlbums).where(eq(schema.galleryAlbums.weddingId, sample.id)).orderBy(asc(schema.galleryAlbums.sortOrder));
  const items = await db.select().from(schema.galleryItems).where(eq(schema.galleryItems.weddingId, sample.id)).orderBy(asc(schema.galleryItems.sortOrder));
  for (const it of items) wanted.add(it.assetId);
  const albumMap = new Map<string, string>();
  for (const a of albums) {
    const [row] = await db.insert(schema.galleryAlbums).values({ weddingId: w.id, title: a.title, kind: a.kind, isPublic: a.isPublic, sortOrder: a.sortOrder }).returning({ id: schema.galleryAlbums.id });
    albumMap.set(a.id, row.id);
  }
  const photoMap = await cloneImages(sample.id, w.id, wanted, albumMap);
  for (const it of items) {
    const asset = photoMap.get(it.assetId), album = albumMap.get(it.albumId);
    if (asset && album) await db.insert(schema.galleryItems).values({ weddingId: w.id, albumId: album, assetId: asset, caption: it.caption, sortOrder: it.sortOrder });
  }
  for (const a of albums) {
    const cover = a.coverAssetId ? photoMap.get(a.coverAssetId) : undefined;
    if (cover) await db.update(schema.galleryAlbums).set({ coverAssetId: cover }).where(eq(schema.galleryAlbums.id, albumMap.get(a.id)!));
  }
  // any photograph of the sample that could not be copied is dropped from the document rather than left pointing at someone else's file
  const sampleAssets = new Set((await db.select({ id: schema.mediaAssets.id }).from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, sample.id))).map((r) => r.id));

  // 3 · this customer's names, and the sample's dates moved to this customer's day
  const sa = src.couple.bride, sb = src.couple.groom, ho = src.occasion.honoree;
  const pairs: [string, string][] = couple
    ? [[sa.fullName.en ?? "", nameA || sa.fullName.en || ""], [sa.name.en ?? "", first(nameA) || sa.name.en || ""], [sb.fullName.en ?? "", nameB || sb.fullName.en || ""], [sb.name.en ?? "", first(nameB) || sb.name.en || ""]]
    : [[ho.fullName.en ?? "", nameA || ho.fullName.en || ""], [ho.name.en ?? "", first(nameA) || ho.name.en || ""], [src.occasion.title.en ?? "", input.title.trim()]];
  const rename = renamer(pairs);
  const delta = sample.weddingDate ? days(sample.weddingDate, input.date) : 0;
  doc = mapStrings(doc, (s) => {
    if (UUID.test(s)) return photoMap.get(s) ?? (sampleAssets.has(s) ? "" : s);
    if (ISO.test(s)) return delta ? shift(s, delta) : s;
    return rename(s);
  });

  // the sample's hand-tuned head zoom suits the sample's photographs, not this customer's
  doc.journey = { ...doc.journey, headZoom: { bride: 1, groom: 1 } };
  // the sample's link-preview heading, description, message and picture describe the sample (its date, its town, its couple): start on automatic
  doc.seo = { ...doc.seo, title: {}, description: {}, shareMessage: {}, ogImage: undefined };

  if (couple && nameA && nameB) {
    // the hashtag and the monogram are made of the names, so they are rebuilt rather than renamed
    const A = first(nameA), B = first(nameB), mono = `${A[0] ?? ""}${B[0] ?? ""}`.toUpperCase();
    doc.couple.hashtag = `#${A}Weds${B}`.replace(/[^\p{L}\p{N}#]/gu, "");
    doc.couple.monogram = mono;
    doc.opening.sealText = mono;
  }

  await saveDraft(admin, w.id, doc);
  await audit(admin, "wedding.created_from_template", { weddingId: w.id, entityType: "wedding", entityId: w.id, metadata: { template: tpl.slug, sample: sample.slug, photos: photoMap.size } });
  return { id: w.id, slug: w.slug, fromSample: true, photos: photoMap.size };
}

/** What the editor needs to show "still the sample": the sample's tell-tale words and which of this invitation's photographs are copies. */
export async function loadSampleInfo(actor: Actor | null, weddingId: string): Promise<{ template: string; tokens: string[]; photos: string[] } | null> {
  const admin = requireAdmin(actor);
  const db = await getDb();
  const w = await getWedding(admin, weddingId);
  const photos = (await db.select({ id: schema.mediaAssets.id, metadata: schema.mediaAssets.metadata }).from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, weddingId))).filter((r) => (r.metadata as { sample?: boolean }).sample).map((r) => r.id);
  if (!w.templateId) return null;
  const [tpl] = await db.select().from(schema.templates).where(eq(schema.templates.id, w.templateId));
  const config = tpl ? TemplateConfig.safeParse(tpl.config) : null;
  const sample = config?.success ? await sampleOf(config.data) : null;
  if (!tpl || !sample || sample.id === weddingId) return null;
  const src = (await getWedding(admin, sample.id)).draftDoc;
  // words that are still in this invitation's own names are not leftovers
  const own = new Set([w.draftDoc.couple.bride.name.en, w.draftDoc.couple.groom.name.en, w.draftDoc.occasion.honoree.name.en].filter(Boolean).map((s) => (s as string).toLowerCase()));
  return { template: tpl.name, tokens: sampleTokens(src, sample.weddingDate).filter((t) => !own.has(t.toLowerCase())), photos };
}
