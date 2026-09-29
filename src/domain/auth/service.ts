import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { conflict, expired, forbidden, invalid, notFound, unauthorized } from "@/lib/errors";
import { type Actor, type UserActor, loadActorForUser, requireAdmin } from "./access";
import { hashPassword, passwordProblem, verifyPassword } from "./password";
import { rateLimit } from "@/domain/platform/rate-limit";
import { audit } from "@/domain/audit/audit";

export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const MAGIC_LINK_TTL_MS = 30 * 60 * 1000;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const normEmail = (e: string) => e.trim().toLowerCase();

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "CLIENT";
  phone: string | null;
  disabledAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

// ── users ──────────────────────────────────────────────────────────────────
export async function createUser(input: { email: string; name: string; role: "SUPER_ADMIN" | "CLIENT"; password?: string; phone?: string }) {
  const email = normEmail(input.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw invalid("Enter a valid email address.", { email: "Enter a valid email address." });
  if (input.password) {
    const p = passwordProblem(input.password);
    if (p) throw invalid(p, { password: p });
  }
  const db = await getDb();
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(sql`lower(${schema.users.email}) = ${email}`);
  if (exists) throw conflict("An account with this email already exists.");
  const [u] = await db
    .insert(schema.users)
    .values({
      email,
      name: input.name.trim(),
      role: input.role,
      phone: input.phone?.trim() || null,
      passwordHash: input.password ? await hashPassword(input.password) : null,
    })
    .returning();
  return u;
}

/** Idempotent bootstrap used by the seed script. */
export async function ensureSuperAdmin(email: string, password: string, name = "Platform Owner") {
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(sql`lower(${schema.users.email}) = ${normEmail(email)}`);
  if (u) return u;
  return createUser({ email, name, role: "SUPER_ADMIN", password });
}

export async function listClients(actor: Actor) {
  requireAdmin(actor);
  const db = await getDb();
  const users = await db.select().from(schema.users).where(eq(schema.users.role, "CLIENT")).orderBy(schema.users.createdAt);
  const links = await db
    .select({ userId: schema.weddingUsers.userId, weddingId: schema.weddingUsers.weddingId, title: schema.weddings.title, slug: schema.weddings.slug })
    .from(schema.weddingUsers)
    .innerJoin(schema.weddings, eq(schema.weddings.id, schema.weddingUsers.weddingId));
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    disabledAt: u.disabledAt,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    weddings: links.filter((l) => l.userId === u.id),
  }));
}

export async function assignClientToWedding(actor: Actor | null, input: { weddingId: string; email: string; name: string; phone?: string; role?: "OWNER" | "EDITOR" }) {
  const admin = requireAdmin(actor);
  const db = await getDb();
  const [w] = await db.select({ id: schema.weddings.id }).from(schema.weddings).where(eq(schema.weddings.id, input.weddingId));
  if (!w) throw notFound("Wedding not found.");
  const email = normEmail(input.email);
  let [user] = await db.select().from(schema.users).where(sql`lower(${schema.users.email}) = ${email}`);
  if (user && user.role === "SUPER_ADMIN") throw conflict("That email belongs to a platform administrator.");
  if (!user) user = await createUser({ email, name: input.name, role: "CLIENT", phone: input.phone });
  await db
    .insert(schema.weddingUsers)
    .values({ userId: user.id, weddingId: input.weddingId, role: input.role ?? "OWNER" })
    .onConflictDoNothing();
  await audit(admin, "client.assigned", { weddingId: input.weddingId, entityType: "user", entityId: user.id, metadata: { email } });
  return user;
}

export async function removeClientFromWedding(actor: Actor | null, weddingId: string, userId: string) {
  const admin = requireAdmin(actor);
  const db = await getDb();
  await db.delete(schema.weddingUsers).where(and(eq(schema.weddingUsers.weddingId, weddingId), eq(schema.weddingUsers.userId, userId)));
  await audit(admin, "client.removed", { weddingId, entityType: "user", entityId: userId });
}

export async function setUserDisabled(actor: Actor | null, userId: string, disabled: boolean) {
  const admin = requireAdmin(actor);
  if (admin.userId === userId) throw forbidden("You cannot disable your own account.");
  const db = await getDb();
  await db.update(schema.users).set({ disabledAt: disabled ? new Date() : null, updatedAt: new Date() }).where(eq(schema.users.id, userId));
  if (disabled) await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  await audit(admin, disabled ? "user.disabled" : "user.enabled", { entityType: "user", entityId: userId });
}

// ── sessions ───────────────────────────────────────────────────────────────
async function createSession(userId: string, userAgent?: string | null) {
  const token = randomBytes(32).toString("base64url");
  const db = await getDb();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(schema.sessions).values({ id: sha256(token), userId, expiresAt, userAgent: userAgent?.slice(0, 200) ?? null });
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, userId));
  return { token, expiresAt };
}

export async function login(email: string, password: string, meta: { ip?: string; userAgent?: string | null } = {}) {
  const e = normEmail(email);
  await rateLimit(`login:${e}`, 8, 15 * 60);
  if (meta.ip) await rateLimit(`login-ip:${meta.ip}`, 30, 15 * 60);
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(sql`lower(${schema.users.email}) = ${e}`);
  const ok = await verifyPassword(password, u?.passwordHash);
  if (!u || !ok || u.disabledAt) throw unauthorized("That email and password do not match.");
  const session = await createSession(u.id, meta.userAgent);
  await audit(await loadActorForUser(u.id), "auth.login", { entityType: "user", entityId: u.id });
  return { ...session, userId: u.id, role: u.role };
}

export async function getActorFromSessionToken(token: string | undefined | null): Promise<UserActor | null> {
  if (!token) return null;
  const db = await getDb();
  const [s] = await db
    .select({ userId: schema.sessions.userId })
    .from(schema.sessions)
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, new Date())));
  if (!s) return null;
  return loadActorForUser(s.userId);
}

export async function destroySession(token: string | undefined | null) {
  if (!token) return;
  const db = await getDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
}

export async function destroyAllSessions(userId: string) {
  const db = await getDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

export async function changePassword(userId: string, current: string | null, next: string) {
  const p = passwordProblem(next);
  if (p) throw invalid(p, { password: p });
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u) throw notFound();
  // A password can only be set without the old one if the account has none yet (e.g. created by a magic link).
  if (u.passwordHash && (current === null || !(await verifyPassword(current, u.passwordHash)))) throw unauthorized("Your current password is not correct.");
  await db.update(schema.users).set({ passwordHash: await hashPassword(next), updatedAt: new Date() }).where(eq(schema.users.id, userId));
  await destroyAllSessions(userId);
}

// ── magic links (passwordless client login) ────────────────────────────────
export async function createMagicLink(actor: Actor | null, userId: string) {
  requireAdmin(actor);
  return issueMagicToken(userId);
}

async function issueMagicToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const db = await getDb();
  await db.insert(schema.magicLinks).values({ tokenHash: sha256(token), userId, expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS) });
  return token;
}

/** Client asks for a sign-in link by email. Always resolves quietly so accounts cannot be enumerated. */
export async function requestMagicLink(email: string, ip?: string): Promise<{ token: string; userId: string; email: string; name: string } | null> {
  const e = normEmail(email);
  await rateLimit(`magic:${e}`, 5, 15 * 60);
  if (ip) await rateLimit(`magic-ip:${ip}`, 20, 15 * 60);
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(sql`lower(${schema.users.email}) = ${e}`);
  if (!u || u.disabledAt || u.role !== "CLIENT") return null;
  return { token: await issueMagicToken(u.id), userId: u.id, email: u.email, name: u.name };
}

export async function consumeMagicLink(token: string, meta: { userAgent?: string | null } = {}) {
  const db = await getDb();
  const [row] = await db
    .update(schema.magicLinks)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.magicLinks.tokenHash, sha256(token)), isNull(schema.magicLinks.usedAt)))
    .returning();
  if (!row) throw expired("This sign-in link has already been used or is not valid.");
  if (row.expiresAt.getTime() < Date.now()) throw expired("This sign-in link has expired. Please request a new one.");
  const actor = await loadActorForUser(row.userId);
  if (!actor) throw unauthorized("This account is not available.");
  const session = await createSession(row.userId, meta.userAgent);
  await audit(actor, "auth.magic_login", { entityType: "user", entityId: row.userId });
  return { ...session, userId: row.userId, role: actor.kind === "admin" ? ("SUPER_ADMIN" as const) : ("CLIENT" as const) };
}
