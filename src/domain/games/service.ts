import { randomInt } from "node:crypto";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { forbidden, invalid } from "@/lib/errors";
import { getEntitlements } from "@/domain/packages/service";
import { canUse } from "@/domain/packages/entitlements";
import type { FeatureKey } from "@/domain/packages/features";
import { loadRulesDoc } from "@/domain/wedding/snapshot";
import { rateLimit } from "@/domain/platform/rate-limit";
import { tx } from "@/domain/doc/schema";
import type { Participant } from "@/domain/participation/service";

/**
 * Games are modular features. Scoring happens on the SERVER from the configured content, so a
 * guest cannot post a fake score. Personalised guests get one recorded play per game.
 */
export const GAME_KEYS = ["TRIVIA", "COUPLE_QUIZ", "BINGO", "WHEEL", "SCRATCH", "FORTUNE", "FIND_DIFF", "GUESS_SONG", "CROSSWORD", "SCAVENGER"] as const;
export type GameKey = (typeof GAME_KEYS)[number];

const GAME_FEATURE: Record<GameKey, FeatureKey> = {
  TRIVIA: "games_basic",
  COUPLE_QUIZ: "couple_extras",
  BINGO: "games_basic",
  WHEEL: "games_advanced",
  SCRATCH: "games_advanced",
  FORTUNE: "games_advanced",
  FIND_DIFF: "games_advanced",
  GUESS_SONG: "games_advanced",
  CROSSWORD: "games_advanced",
  SCAVENGER: "scavenger_hunt",
};

export const PlayInput = z.object({
  game: z.enum(GAME_KEYS),
  /** trivia / quiz / guess-song: chosen option index per question id */
  answers: z.record(z.string(), z.number().int().min(0).max(20)).optional(),
  /** bingo: indexes of marked squares · scavenger: completed task ids · find-diff: found spot ids · crossword: solved word ids */
  marked: z.array(z.string().max(40)).max(80).optional(),
});

export interface PlayResult {
  game: GameKey;
  score: number;
  max: number;
  detail?: { label?: string; note?: string; correct?: number };
  alreadyPlayed?: boolean;
}

const pick = <T>(arr: T[]): T | null => (arr.length ? arr[randomInt(arr.length)] : null);

export async function playGame(p: Participant, raw: unknown, locale = "en"): Promise<PlayResult> {
  const input = PlayInput.parse(raw);
  const ent = await getEntitlements(p.weddingId);
  if (!canUse(ent, GAME_FEATURE[input.game])) throw forbidden("This game is not part of the invitation.");
  await rateLimit(`game:${p.key}`, 60, 3600);
  const { doc } = await loadRulesDoc(p.weddingId);
  const db = await getDb();

  if (p.guestId) {
    const [prev] = await db
      .select()
      .from(schema.gamePlays)
      .where(and(eq(schema.gamePlays.weddingId, p.weddingId), eq(schema.gamePlays.guestId, p.guestId), eq(schema.gamePlays.game, input.game)));
    if (prev) {
      const stored = prev.payload as { max?: number; detail?: PlayResult["detail"] };
      return { game: input.game, score: prev.score, max: stored.max ?? prev.score, detail: stored.detail, alreadyPlayed: true };
    }
  }

  let score = 0;
  let max = 0;
  let detail: PlayResult["detail"];
  const g = doc.games;
  switch (input.game) {
    case "TRIVIA":
    case "COUPLE_QUIZ": {
      const qs = g.trivia.questions;
      if (!qs.length) throw invalid("This quiz has no questions yet.");
      let correct = 0;
      for (const q of qs) if (input.answers?.[q.id] === q.answer) correct++;
      max = qs.length * 10;
      score = correct * 10;
      detail = { correct };
      break;
    }
    case "GUESS_SONG": {
      const rs = g.guessSong.rounds;
      if (!rs.length) throw invalid("There are no songs to guess yet.");
      let correct = 0;
      for (const r of rs) if (input.answers?.[r.id] === r.answer) correct++;
      max = rs.length * 15;
      score = correct * 15;
      detail = { correct };
      break;
    }
    case "BINGO": {
      const sq = g.bingo.squares;
      const size = Math.floor(Math.sqrt(sq.length)) || 0;
      if (size < 3) throw invalid("Bingo is not set up yet.");
      const marked = new Set((input.marked ?? []).filter((id) => sq.some((s) => s.id === id)));
      const idx = (r: number, c: number) => sq[r * size + c]?.id;
      let lines = 0;
      for (let i = 0; i < size; i++) {
        if (Array.from({ length: size }, (_, c) => idx(i, c)).every((id) => id && marked.has(id))) lines++;
        if (Array.from({ length: size }, (_, r) => idx(r, i)).every((id) => id && marked.has(id))) lines++;
      }
      if (Array.from({ length: size }, (_, i) => idx(i, i)).every((id) => id && marked.has(id))) lines++;
      if (Array.from({ length: size }, (_, i) => idx(i, size - 1 - i)).every((id) => id && marked.has(id))) lines++;
      max = (size * 2 + 2) * 20;
      score = lines * 20;
      detail = { correct: lines };
      break;
    }
    case "WHEEL":
    case "SCRATCH": {
      const prizes = input.game === "WHEEL" ? g.wheel.prizes : g.scratch.prizes;
      const prize = pick(prizes);
      if (!prize) throw invalid("No prizes have been set up yet.");
      score = 5;
      max = 5;
      detail = { label: tx(prize.label, locale), note: tx(prize.detail, locale) };
      break;
    }
    case "FORTUNE": {
      const m = pick(g.fortune.messages);
      if (!m) throw invalid("No fortunes have been written yet.");
      score = 5;
      max = 5;
      detail = { label: tx(m.text, locale) };
      break;
    }
    case "FIND_DIFF": {
      const spots = g.findDiff.spots;
      if (!spots.length) throw invalid("This puzzle is not ready yet.");
      const found = new Set((input.marked ?? []).filter((id) => spots.some((s) => s.id === id)));
      max = spots.length * 10;
      score = found.size * 10;
      detail = { correct: found.size };
      break;
    }
    case "CROSSWORD": {
      const words = g.crossword.words;
      if (!words.length) throw invalid("The crossword is not ready yet.");
      const solved = new Set((input.marked ?? []).filter((id) => words.some((w) => w.id === id)));
      max = words.length * 10;
      score = solved.size * 10;
      detail = { correct: solved.size };
      break;
    }
    case "SCAVENGER": {
      const tasks = g.scavenger.tasks;
      if (!tasks.length) throw invalid("The scavenger hunt has no tasks yet.");
      const done = tasks.filter((t) => (input.marked ?? []).includes(t.id));
      max = tasks.reduce((n, t) => n + t.points, 0);
      score = done.reduce((n, t) => n + t.points, 0);
      detail = { correct: done.length };
      break;
    }
  }

  await db.insert(schema.gamePlays).values({ weddingId: p.weddingId, guestId: p.guestId, playerName: p.name, game: input.game, score, payload: { max, detail } });
  return { game: input.game, score, max, detail };
}

/** Leaderboard: each named guest's total across games (their best play per game). */
export async function leaderboard(weddingId: string, limit = 10) {
  const ent = await getEntitlements(weddingId);
  if (!canUse(ent, "leaderboard")) return [];
  const db = await getDb();
  const rows = await db
    .select({
      name: schema.gamePlays.playerName,
      guestId: schema.gamePlays.guestId,
      total: sql<number>`sum(${schema.gamePlays.score})::int`,
      games: sql<number>`count(*)::int`,
    })
    .from(schema.gamePlays)
    .where(eq(schema.gamePlays.weddingId, weddingId))
    .groupBy(schema.gamePlays.playerName, schema.gamePlays.guestId)
    .orderBy(desc(sql`sum(${schema.gamePlays.score})`))
    .limit(limit);
  return rows.map((r, i) => ({ rank: i + 1, name: r.name, total: r.total, games: r.games }));
}

export async function myPlays(weddingId: string, guestId: string) {
  const db = await getDb();
  const rows = await db.select({ game: schema.gamePlays.game, score: schema.gamePlays.score, payload: schema.gamePlays.payload }).from(schema.gamePlays).where(and(eq(schema.gamePlays.weddingId, weddingId), eq(schema.gamePlays.guestId, guestId)));
  return rows.map((r) => ({ game: r.game as GameKey, score: r.score, max: (r.payload as { max?: number }).max ?? r.score }));
}
