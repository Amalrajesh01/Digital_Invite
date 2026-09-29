"use client";
import { useEffect, useMemo, useState } from "react";
import { Award, Check, Gift, Grid3x3, Music2, Puzzle, ScanSearch, Sparkles, Target, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SectionConfig } from "@/domain/doc/schema";
import type { GameKey, PlayResult } from "@/domain/games/service";
import { useInvitation } from "../engine/context";
import { InvDialog } from "../engine/Dialog";
import { Reveal } from "../engine/motion";
import { useSharedPoll } from "../engine/poll";
import type { StringKey } from "../i18n/strings";
import { Shell, SectionHead, useCopy } from "./shared";
import { Bingo, Crossword, Fortune, FindDiff, GuessSong, Quiz, Scratch, Wheel } from "./games/Games";

interface GamesState { plays: { game: GameKey; score: number; max: number }[]; leaderboard: { rank: number; name: string; total: number; games: number }[] }

function useGamesState() {
  const { get, slug, token } = useInvitation();
  return useSharedPoll<GamesState>(`games:${slug}:${token ?? ""}`, () => get("/games"), 20000, true);
}

function Result({ r, label, onClose }: { r: PlayResult; label: string; onClose: () => void }) {
  const { t } = useInvitation();
  return (
    <div className="py-6 text-center [animation:inv-rise_.6s_var(--ease)]">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--c-accent)] text-[var(--c-inverse)]"><Check className="size-8" /></span>
      <h4 className="inv-h2 mt-6 !text-[2.4rem]">{label}</h4>
      {r.alreadyPlayed && <p className="inv-muted mt-2">{t("games.alreadyPlayed")}</p>}
      <p className="inv-num mt-4 text-[3.4rem] leading-none text-[var(--c-primary)]">{r.score}<span className="inv-muted text-[1.4rem]"> / {r.max}</span></p>
      <p className="inv-muted mt-1">{t("games.score")}</p>
      {r.detail?.label && <p className="mt-5 text-[1.1rem]">{r.detail.label}</p>}
      <button type="button" className="inv-btn mt-8" onClick={onClose}>{t("common.done")}</button>
    </div>
  );
}

export function Leaderboard({ rows }: { rows: GamesState["leaderboard"] }) {
  const { t } = useInvitation();
  if (!rows.length) return null;
  return (
    <div className="mx-auto mt-16 max-w-md">
      <p className="inv-eyebrow mb-4 flex items-center justify-center gap-2"><Trophy className="size-3.5" /> {t("games.leaderboard")}</p>
      <ol className="divide-y divide-current/12 border-y border-current/15">
        {rows.map((r) => (
          <li key={r.rank} className="flex items-center gap-4 py-3">
            <span className={cn("inv-num grid size-8 place-items-center rounded-full text-[0.95rem]", r.rank === 1 ? "bg-[var(--c-accent)] text-[var(--c-inverse)]" : "border border-current/25")}>{r.rank}</span>
            <span className="flex-1 truncate">{r.name}</span>
            <span className="inv-num text-xl">{r.total}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const META: Record<GameKey, { label: StringKey; icon: React.ComponentType<{ className?: string }> }> = {
  TRIVIA: { label: "games.trivia", icon: Target },
  COUPLE_QUIZ: { label: "games.quiz", icon: Sparkles },
  BINGO: { label: "games.bingo", icon: Grid3x3 },
  WHEEL: { label: "games.wheel", icon: Target },
  SCRATCH: { label: "games.scratch", icon: Gift },
  FORTUNE: { label: "games.fortune", icon: Sparkles },
  FIND_DIFF: { label: "games.diff", icon: ScanSearch },
  GUESS_SONG: { label: "games.song", icon: Music2 },
  CROSSWORD: { label: "games.crossword", icon: Puzzle },
  SCAVENGER: { label: "scavenger.title", icon: Award },
};

function GamePlayer({ game, name, onClose }: { game: GameKey; name: string; onClose: () => void }) {
  const { t } = useInvitation();
  const [result, setResult] = useState<PlayResult | null>(null);
  if (result) return <Result r={result} label={t(META[game].label)} onClose={onClose} />;
  switch (game) {
    case "TRIVIA": case "COUPLE_QUIZ": return <Quiz game={game} name={name} onDone={setResult} />;
    case "BINGO": return <Bingo name={name} onDone={setResult} />;
    case "WHEEL": return <Wheel name={name} onDone={setResult} />;
    case "SCRATCH": return <Scratch name={name} onDone={setResult} />;
    case "FORTUNE": return <Fortune name={name} onDone={setResult} />;
    case "FIND_DIFF": return <FindDiff name={name} onDone={setResult} />;
    case "GUESS_SONG": return <GuessSong name={name} onDone={setResult} />;
    case "CROSSWORD": return <Crossword name={name} onDone={setResult} />;
    default: return null;
  }
}

function NamePrompt({ onName }: { onName: (n: string) => void }) {
  const { t } = useInvitation();
  const [v, setV] = useState("");
  return (
    <form className="mx-auto max-w-sm space-y-4 py-4" onSubmit={(e) => { e.preventDefault(); if (v.trim()) onName(v.trim()); }}>
      <label className="inv-label" htmlFor="game-name">{t("games.name")}</label>
      <input id="game-name" className="inv-input" value={v} onChange={(e) => setV(e.target.value)} maxLength={60} autoFocus />
      <button className="inv-btn w-full" disabled={!v.trim()}>{t("games.play")}</button>
    </form>
  );
}

export function useAvailableGames() {
  const { view, has } = useInvitation();
  const g = view.doc.games;
  const quizOn = view.sections.some((s) => s.type === "quiz");
  return useMemo(() => {
    const out: GameKey[] = [];
    if (has("games_basic")) {
      if (!quizOn && g.trivia.questions.length) out.push("TRIVIA");
      if (Math.floor(Math.sqrt(g.bingo.squares.length)) >= 3) out.push("BINGO");
    }
    if (has("games_advanced")) {
      if (g.wheel.prizes.length >= 2) out.push("WHEEL");
      if (g.scratch.prizes.length) out.push("SCRATCH");
      if (g.fortune.messages.length) out.push("FORTUNE");
      if (g.findDiff.a && g.findDiff.b && g.findDiff.spots.length) out.push("FIND_DIFF");
      if (g.guessSong.rounds.length) out.push("GUESS_SONG");
      if (g.crossword.words.length >= 2) out.push("CROSSWORD");
    }
    return out;
  }, [g, has, quizOn]);
}

function GameShell({ section, keys, defaults }: { section: SectionConfig; keys: GameKey[]; defaults: { eyebrow: StringKey; title: StringKey } }) {
  const { view, t, has, isPreview } = useInvitation();
  const copy = useCopy(section, defaults);
  const state = useGamesState();
  const guest = view.guest && !view.guest.isPreview ? view.guest : null;
  const [name, setName] = useState(guest?.name ?? "");
  const [open, setOpen] = useState<GameKey | null>(null);
  useEffect(() => {
    if (guest) setName(guest.name);
  }, [guest]);
  if (!keys.length) return null;
  const played = new Map(state?.plays.map((p) => [p.game, p]));
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} />
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {keys.map((k, i) => {
          const M = META[k];
          const p = played.get(k);
          return (
            <Reveal key={k} delay={i * 70}>
              <button type="button" onClick={() => !isPreview && setOpen(k)} className="inv-card group flex w-full items-center gap-4 p-5 text-left transition-transform hover:-translate-y-0.5">
                <span className="grid size-12 shrink-0 place-items-center rounded-full border border-[var(--c-accent)] text-[var(--c-accent)]"><M.icon className="size-5" /></span>
                <span className="min-w-0 flex-1"><span className="inv-h4 block">{t(M.label)}</span><span className="inv-muted text-[0.85rem]">{p ? `${t("games.played")} · ${p.score}/${p.max}` : t("games.play")}</span></span>
                {p && <Check className="size-5 text-[var(--c-accent)]" />}
              </button>
            </Reveal>
          );
        })}
      </div>
      {has("leaderboard") && state && <Leaderboard rows={state.leaderboard} />}
      <InvDialog open={!!open} onClose={() => setOpen(null)} title={open ? t(META[open].label) : ""}>
        {open && (name ? <GamePlayer game={open} name={name} onClose={() => setOpen(null)} /> : <NamePrompt onName={setName} />)}
      </InvDialog>
    </Shell>
  );
}

export function GamesSection({ section }: { section: SectionConfig }) {
  const keys = useAvailableGames();
  return <GameShell section={section} keys={keys} defaults={{ eyebrow: "games.title", title: "games.title" }} />;
}

export function QuizSection({ section }: { section: SectionConfig }) {
  const { view } = useInvitation();
  const keys: GameKey[] = view.doc.games.trivia.questions.length ? ["COUPLE_QUIZ"] : [];
  return <GameShell section={section} keys={keys} defaults={{ eyebrow: "games.title", title: "games.quiz" }} />;
}

export function ScavengerSection({ section }: { section: SectionConfig }) {
  const { view, L, t, has } = useInvitation();
  const copy = useCopy(section, { title: "scavenger.title" });
  const tasks = view.doc.games.scavenger.tasks;
  const [done, setDone] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const guest = view.guest && !view.guest.isPreview ? view.guest : null;
  const [name, setName] = useState(guest?.name ?? "");
  if (!tasks.length) return null;
  const points = tasks.filter((x) => done.has(x.id)).reduce((n, x) => n + x.points, 0);
  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={t("scavenger.lede")} className="!mb-8" />
      <ul className="space-y-3">
        {tasks.map((task) => {
          const on = done.has(task.id);
          return (
            <li key={task.id}>
              <button type="button" aria-pressed={on} className="inv-choice" onClick={() => setDone((s) => { const n = new Set(s); if (n.has(task.id)) n.delete(task.id); else n.add(task.id); return n; })}>
                <span className="dot" />
                <span className="min-w-0 flex-1"><span className={cn("block", on && "line-through opacity-70")}>{L(task.title)}</span>{L(task.hint) && <span className="inv-muted block text-[0.85rem]">{L(task.hint)}</span>}</span>
                <span className="inv-num text-[var(--c-accent)]">+{task.points}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4"><p className="inv-num text-2xl">{points} pts</p><button type="button" className="inv-btn" disabled={!done.size} onClick={() => setOpen(true)}>{t("scavenger.submit")}</button></div>
      {has("leaderboard") && null}
      <InvDialog open={open} onClose={() => setOpen(false)} title={t("scavenger.title")}>
        {name ? <ScavengerSubmit name={name} marked={[...done]} onClose={() => setOpen(false)} /> : <NamePrompt onName={setName} />}
      </InvDialog>
    </Shell>
  );
}

function ScavengerSubmit({ name, marked, onClose }: { name: string; marked: string[]; onClose: () => void }) {
  const { post, t } = useInvitation();
  const [res, setRes] = useState<PlayResult | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let live = true;
    post<PlayResult>("/play", { game: "SCAVENGER", marked, name }).then((r) => live && setRes(r)).catch(() => live && setErr(t("error.generic")));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (err) return <p className="inv-error" role="alert">{err}</p>;
  if (!res) return <p className="inv-muted">{t("common.loading")}</p>;
  return <Result r={res} label={t("scavenger.title")} onClose={onClose} />;
}
