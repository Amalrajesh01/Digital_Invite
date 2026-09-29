import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import type { LocalizedText } from "@/domain/doc/schema";

/**
 * A guest has no account. Their unguessable invitation token (128+ bits) is the credential,
 * scoped to exactly one wedding. Everything a guest can do goes through a GuestContext.
 */
export interface GuestContext {
  weddingId: string;
  weddingSlug: string;
  guestId: string;
  name: string;
  seats: number;
  groupKey: string | null;
  relationship: string;
  customGreeting: LocalizedText;
  preferredLocale: string | null;
  token: string;
}

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

export async function resolveGuestContext(slug: string, token: string | null | undefined): Promise<GuestContext | null> {
  if (!token || !TOKEN_RE.test(token)) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      weddingId: schema.weddings.id,
      slug: schema.weddings.slug,
      guestId: schema.guests.id,
      name: schema.guests.name,
      seats: schema.guests.seats,
      groupKey: schema.guestGroups.key,
      relationship: schema.guests.relationship,
      customGreeting: schema.guests.customGreeting,
      preferredLocale: schema.guests.preferredLocale,
    })
    .from(schema.guestInvites)
    .innerJoin(schema.guests, eq(schema.guests.id, schema.guestInvites.guestId))
    .innerJoin(schema.weddings, eq(schema.weddings.id, schema.guestInvites.weddingId))
    .leftJoin(schema.guestGroups, eq(schema.guestGroups.id, schema.guests.groupId))
    .where(
      and(
        eq(schema.guestInvites.token, token),
        isNull(schema.guestInvites.revokedAt),
        isNull(schema.guests.archivedAt),
        sql`lower(${schema.weddings.slug}) = ${slug.toLowerCase()}`,
      ),
    );
  if (!row) return null;
  return {
    weddingId: row.weddingId,
    weddingSlug: row.slug,
    guestId: row.guestId,
    name: row.name,
    seats: row.seats,
    groupKey: row.groupKey ?? null,
    relationship: row.relationship,
    customGreeting: row.customGreeting,
    preferredLocale: row.preferredLocale,
    token,
  };
}

/** Record that the guest opened their invitation (first/last open, count). */
export async function touchGuestOpen(guestId: string): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.guests)
    .set({
      openCount: sql`${schema.guests.openCount} + 1`,
      lastOpenedAt: new Date(),
      firstOpenedAt: sql`coalesce(${schema.guests.firstOpenedAt}, now())`,
      invitationStatus: sql`case when ${schema.guests.invitationStatus} in ('NOT_SENT','SENT') then 'OPENED' else ${schema.guests.invitationStatus} end`,
    })
    .where(eq(schema.guests.id, guestId));
}
