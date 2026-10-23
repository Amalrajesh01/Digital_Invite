"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Item, LetterSpec, PhotoSrc, Values } from "@/domain/letters/types";
import { itemsOf, resolveText } from "@/domain/letters/values";
import type { FlText } from "./strings";

/** A photograph, already resolved to something an <img> can use — from the sender's uploads, or from the bundled demonstration set. */

export type { PhotoSrc };
export interface ReplyPayload { choice: string; label: string; note?: string; when?: string; answers?: { q: string; a: string }[] }
export type ReplyOutcome = "sent" | "preview" | "error";

export interface PlayerProps {
  spec: LetterSpec;
  values: Values;
  names: { to: string; from: string; nick: string; sign: string; anonymous: boolean };
  ui: "en" | "ml";
  /** live: a real letter; demo: the public demonstration; preview: the sender's own preview (nothing is sent). */
  mode: "live" | "demo" | "preview";
  resolvePhoto?: (id: string) => PhotoSrc | undefined;
  onReply?: (p: ReplyPayload) => Promise<ReplyOutcome>;
  replyMode: "collect" | "whatsapp" | "off";
  whatsapp?: string | null;
  playfulNo: boolean;
  shareAnswers: boolean;
  intensity: "calm" | "standard" | "rich";
  /** The gift's own soundtrack (a song the sender uploaded). Never started by anything but a tap. */
  audio?: { ready: boolean; playing: boolean; toggle: () => void } | null;
  /** Open on this beat (screenshots and the builder's live preview); the opening gate is skipped when > 0. */
  startAt?: number;
  footer?: ReactNode;
  /** The public Forever Letters gallery, for the “make one” link. */
  makeHref?: string | null;
}

export interface FL {
  spec: LetterSpec;
  mode: PlayerProps["mode"];
  ui: "en" | "ml";
  s: FlText;
  names: PlayerProps["names"];
  /** Literal copy, or the field a reference points to — with {to}, {from} and {nick} filled in. */
  txt: (ref: string | undefined) => string;
  list: (ref: string) => Item[];
  photo: (id: string | undefined) => PhotoSrc | undefined;
  backdrop: PhotoSrc | undefined;
  next: () => void;
  prev: () => void;
  goto: (i: number) => void;
  index: number;
  total: number;
  reduced: boolean;
  fire: () => void;
  /** What the recipient chose along the way (the “which would you choose” answers become tags for a suggestion). */
  answers: { record: (q: string, a: string) => void; all: () => { q: string; a: string }[]; tags: string[]; addTag: (t: string) => void };
  reply: { mode: PlayerProps["replyMode"]; whatsapp: string | null; send: (p: ReplyPayload) => Promise<ReplyOutcome>; playfulNo: boolean; shareAnswers: boolean };
  audio: PlayerProps["audio"];
  /** Moves focus to the heading of a freshly shown beat, for keyboard and screen-reader users. */
  focusRef: React.RefObject<HTMLHeadingElement | null>;
}

const Ctx = createContext<FL | null>(null);
export const FLProvider = ({ value, children }: { value: FL; children: ReactNode }) => <Ctx.Provider value={value}>{children}</Ctx.Provider>;
export const useFL = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFL outside <ForeverPlayer>");
  return c;
};

export function useReduced(): boolean {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return r;
}

export function makeFill(names: PlayerProps["names"]) {
  return (s: string) => s.replace(/\{(to|from|nick)\}/g, (_, k: "to" | "from" | "nick") => (k === "to" ? names.to : k === "from" ? names.sign : names.nick || names.to));
}

export function buildAccessors(spec: LetterSpec, values: Values, names: PlayerProps["names"]) {
  const fill = makeFill(names);
  const txt = (ref: string | undefined) => fill(resolveText(spec, values, ref));
  const list = (ref: string): Item[] => itemsOf(spec, values, ref.replace(/^@/, "")).map((it) => Object.fromEntries(Object.entries(it).map(([k, x]) => [k, fill(x)])));
  return { txt, list };
}

/** A counter that climbs on a timer (and all at once for reduced motion). Used to reveal lines one after another. */
export function useSequence(n: number, opts: { every: number; start?: number; auto?: boolean }) {
  const { reduced } = useFL();
  const [shown, setShown] = useState(reduced || opts.auto === false ? (opts.auto === false ? Math.min(1, n) : n) : 0);
  useEffect(() => {
    if (reduced) { setShown(n); return; }
    if (opts.auto === false) return;
    setShown(0);
    let i = 0;
    let timer: number;
    const tick = () => {
      i += 1;
      setShown(i);
      if (i < n) timer = window.setTimeout(tick, opts.every);
    };
    timer = window.setTimeout(tick, opts.start ?? 500);
    return () => window.clearTimeout(timer);
  }, [n, reduced, opts.every, opts.start, opts.auto]);
  return [shown, setShown, n] as const;
}

/** Text that types itself out (or is simply there, for reduced motion). */
export function useTyped(full: string, speed = 32, run = true) {
  const { reduced } = useFL();
  const [n, setN] = useState(reduced || !run ? full.length : 0);
  useEffect(() => {
    if (reduced || !run) { setN(full.length); return; }
    setN(0);
    let i = 0;
    const id = window.setInterval(() => { i += 1; setN(i); if (i >= full.length) window.clearInterval(id); }, speed);
    return () => window.clearInterval(id);
  }, [full, speed, reduced, run]);
  return [full.slice(0, n), n >= full.length] as const;
}

/** Stable pseudo-random order (so a puzzle looks the same on every render, and no two screens share state). */
export function shuffled<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

