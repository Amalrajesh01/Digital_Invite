import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { forbidden, notFound, unauthorized } from "@/lib/errors";
import { assertCanUse } from "@/domain/packages/entitlements";
import type { FeatureKey } from "@/domain/packages/features";
import { getEntitlements } from "@/domain/packages/service";

/**
 * Who is acting. Dashboards are only ever used by `admin` or `client` actors.
 * Guests never have an Actor — they are identified by an unguessable invitation token
 * (see src/domain/guests/invites.ts) and can only reach their own wedding's public surface.
 */
export type AdminActor = { kind: "admin"; userId: string; email: string; name: string };
export type ClientActor = {
  kind: "client";
  userId: string;
  email: string;
  name: string;
  memberships: { weddingId: string; role: "OWNER" | "EDITOR" }[];
};
export type SystemActor = { kind: "system" };
export type Actor = AdminActor | ClientActor | SystemActor;
export type UserActor = AdminActor | ClientActor;

export async function loadActorForUser(userId: string): Promise<UserActor | null> {
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u || u.disabledAt) return null;
  if (u.role === "SUPER_ADMIN") return { kind: "admin", userId: u.id, email: u.email, name: u.name };
  const memberships = await db
    .select({ weddingId: schema.weddingUsers.weddingId, role: schema.weddingUsers.role })
    .from(schema.weddingUsers)
    .where(eq(schema.weddingUsers.userId, u.id));
  return { kind: "client", userId: u.id, email: u.email, name: u.name, memberships };
}

export function isAdmin(a: Actor | null | undefined): a is AdminActor {
  return a?.kind === "admin";
}

export function requireUser(a: Actor | null | undefined): UserActor {
  if (!a || a.kind === "system") throw unauthorized();
  return a;
}

export function requireAdmin(a: Actor | null | undefined): AdminActor {
  if (!a || a.kind === "system") throw unauthorized();
  if (a.kind !== "admin") throw forbidden("Only the platform owner can do this.");
  return a;
}

/** Does this actor belong to this wedding's tenant? (Tenant isolation lives here.) */
export function isMemberOf(actor: Actor, weddingId: string): boolean {
  if (actor.kind === "system" || actor.kind === "admin") return true;
  return actor.memberships.some((m) => m.weddingId === weddingId);
}

export interface WeddingScope {
  weddingId: string;
  weddingSlug: string;
  actor: Actor;
  entitlements: Awaited<ReturnType<typeof getEntitlements>>;
}

/**
 * The single gate every tenant-owned operation passes through.
 *  - Super Admin: any wedding.
 *  - Client: only weddings they are a member of, and only if the package includes the client dashboard.
 * Optionally also requires a package feature (server-side — never trust the browser).
 */
export async function requireWeddingAccess(
  actor: Actor | null | undefined,
  weddingId: string,
  opts: { feature?: FeatureKey; adminOnly?: boolean } = {},
): Promise<WeddingScope> {
  const a = actor ?? null;
  if (!a) throw unauthorized();
  if (opts.adminOnly && a.kind === "client") throw forbidden("Only the platform owner can do this.");
  const db = await getDb();
  const [w] = await db.select({ id: schema.weddings.id, slug: schema.weddings.slug }).from(schema.weddings).where(eq(schema.weddings.id, weddingId));
  // Same answer for "does not exist" and "not yours" so tenants cannot probe each other.
  if (!w || !isMemberOf(a, weddingId)) throw notFound("We could not find that wedding.");
  const entitlements = await getEntitlements(weddingId);
  if (a.kind === "client") assertCanUse(entitlements, "client_dashboard");
  if (opts.feature) assertCanUse(entitlements, opts.feature);
  return { weddingId: w.id, weddingSlug: w.slug, actor: a, entitlements };
}
