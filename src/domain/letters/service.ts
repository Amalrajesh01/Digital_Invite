import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db/client";
import { forbidden, invalid } from "@/lib/errors";
import { rateLimit } from "@/domain/platform/rate-limit";
import type { Actor } from "@/domain/auth/access";
import type { LoveDoc } from "@/domain/doc/schema";
import { audit } from "@/domain/audit/audit";
import { LETTERS, letterBySlug, letterCard, type LetterCard } from "./index";

/** Which experiences are switched on in the public gallery. A letter with no row is on; the studio can turn any of them off. */
async function disabledSlugs(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.select().from(schema.letterSettings).where(eq(schema.letterSettings.enabled, false));
  return new Set(rows.map((r) => r.slug));
}

export async function isLetterEnabled(slug: string): Promise<boolean> {
  return !!letterBySlug(slug) && !(await disabledSlugs()).has(slug);
}

/** What the public site may show: every experience that exists and is switched on. Never a hard-coded list or count. */
export async function listPublicLetters(): Promise<LetterCard[]> {
  const off = await disabledSlugs().catch(() => new Set<string>());
  return LETTERS.filter((l) => !off.has(l.slug)).map(letterCard);
}

export async function listLettersForAdmin(actor: Actor | null) {
  if (!actor || actor.kind !== "admin") throw forbidden("Only the platform owner can do this.");
  const off = await disabledSlugs();
  return LETTERS.map((l) => ({ ...letterCard(l), purpose: l.purpose, enabled: !off.has(l.slug) }));
}

export async function setLetterEnabled(actor: Actor | null, slug: string, enabled: boolean) {
  if (!actor || actor.kind !== "admin") throw forbidden("Only the platform owner can do this.");
  if (!letterBySlug(slug)) throw invalid("That experience does not exist.");
  const db = await getDb();
  await db.insert(schema.letterSettings).values({ slug, enabled }).onConflictDoUpdate({ target: schema.letterSettings.slug, set: { enabled, updatedAt: new Date() } });
  await audit(actor, enabled ? "letter.enabled" : "letter.disabled", { entityType: "letter", metadata: { slug } });
}

// ── what a recipient answers ───────────────────────────────────────────────────────────────────────────
const Reply = z.object({
  choice: z.string().min(1).max(24),
  label: z.string().max(200).default(""),
  note: z.string().max(500).optional(),
  when: z.string().max(120).optional(),
  answers: z.array(z.object({ q: z.string().max(200), a: z.string().max(200) })).max(12).optional(),
});

/**
 * One answer from the person a letter was made for. It is accepted only when the letter really asks a question, the sender left
 * collection on, and the choice is one the letter offered. It is stored for the sender to read in their own private link — nobody
 * is notified, nothing is repeated — and the recipient's answers along the way are kept only if the sender asked for them.
 */
export async function submitLetterReply(weddingId: string, ip: string, love: LoveDoc, input: unknown) {
  await rateLimit(`letter-reply:${weddingId}`, 12, 3600);
  await rateLimit(`letter-reply-ip:${ip}`, 40, 3600);
  const f = love.forever;
  const spec = love.experience === "forever" ? letterBySlug(f.scenario) : undefined;
  if (!spec || f.replies !== "collect") throw invalid("This letter is not collecting answers.");
  const body = Reply.safeParse(input);
  if (!body.success) throw invalid("That answer could not be sent.");
  const offered = new Set(spec.beats.flatMap((b) => (b.type === "ask" ? b.choices.map((c) => c.key) : [])));
  if (!offered.has(body.data.choice)) throw invalid("That answer is not one this letter offered.");
  const db = await getDb();
  await db.insert(schema.giftReplies).values({
    weddingId, choice: body.data.choice, label: body.data.label.trim(), note: (body.data.note ?? "").trim(), whenText: (body.data.when ?? "").trim(),
    answers: f.shareAnswers ? (body.data.answers ?? []) : [],
  });
  return { received: true };
}

export async function listRepliesForWedding(weddingId: string) {
  const db = await getDb();
  return db.select().from(schema.giftReplies).where(eq(schema.giftReplies.weddingId, weddingId)).orderBy(desc(schema.giftReplies.createdAt)).limit(100);
}
