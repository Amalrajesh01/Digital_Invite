import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { InvitationDoc } from "@/domain/doc/schema";
import { ThemeTokens } from "@/domain/design/tokens";
import { buildRenderMeta, type RenderMeta, type WeddingRow } from "./service";
import { PUBLIC_STATUSES } from "@/domain/doc/constants";

export interface Snapshot {
  wedding: WeddingRow;
  doc: InvitationDoc;
  meta: RenderMeta;
  versionNumber: number | null;
  source: "published" | "draft";
}

export async function getWeddingBySlug(slug: string): Promise<WeddingRow | null> {
  const db = await getDb();
  const [w] = await db.select().from(schema.weddings).where(sql`lower(${schema.weddings.slug}) = ${slug.toLowerCase()}`);
  return w ?? null;
}

export async function getWeddingRow(id: string): Promise<WeddingRow | null> {
  const db = await getDb();
  const [w] = await db.select().from(schema.weddings).where(eq(schema.weddings.id, id));
  return w ?? null;
}

/** What guests see: the last *published* version. Editing a draft never alters it. */
export async function loadPublishedSnapshot(wedding: WeddingRow): Promise<Snapshot | null> {
  if (!wedding.publishedVersionId || !PUBLIC_STATUSES.includes(wedding.status) || wedding.archivedAt) return null;
  const db = await getDb();
  const [v] = await db.select().from(schema.publishedVersions).where(eq(schema.publishedVersions.id, wedding.publishedVersionId));
  if (!v) return null;
  const meta = v.renderMeta as unknown as RenderMeta;
  return {
    wedding,
    doc: InvitationDoc.parse(v.doc),
    meta: { ...meta, tokens: ThemeTokens.parse(meta.tokens) },
    versionNumber: v.version,
    source: "published",
  };
}

/** What Super Admin / client previews: the live draft. */
export async function loadDraftSnapshot(wedding: WeddingRow): Promise<Snapshot> {
  return {
    wedding,
    doc: InvitationDoc.parse(wedding.draftDoc),
    meta: await buildRenderMeta(wedding),
    versionNumber: null,
    source: "draft",
  };
}

/** Current content for server-side rules (RSVP options, capsule unlock…): published if available, else draft. */
export async function loadRulesDoc(weddingId: string): Promise<{ wedding: WeddingRow; doc: InvitationDoc }> {
  const wedding = await getWeddingRow(weddingId);
  if (!wedding) throw new Error("Wedding not found");
  const pub = await loadPublishedSnapshot(wedding);
  return { wedding, doc: pub?.doc ?? InvitationDoc.parse(wedding.draftDoc) };
}
