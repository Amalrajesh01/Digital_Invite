"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { InvitationView } from "@/domain/wedding/public";
import type { LocalizedText } from "@/domain/doc/schema";
import type { ResolvedMedia } from "@/domain/media/service";
import { canUse } from "@/domain/packages/entitlements";
import type { FeatureKey } from "@/domain/packages/features";
import { makeTranslator, type StringKey } from "../i18n/strings";

export interface MusicApi {
  ready: boolean;
  playing: boolean;
  muted: boolean;
  progress: number;
  duration: number;
  trackIndex: number;
  tracks: InvitationView["tracks"];
  current: InvitationView["tracks"][number] | null;
  play: (index?: number) => void;
  pause: () => void;
  toggle: () => void;
  toggleMute: () => void;
  seek: (ratio: number) => void;
  next: () => void;
  prev: () => void;
}

export interface InvitationCtx {
  view: InvitationView;
  slug: string;
  locale: string;
  setLocale: (l: string) => void;
  multilingual: boolean;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  /** Resolve a localized content string for the active language (with English fallback). */
  L: (text: LocalizedText | undefined | null) => string;
  media: (id?: string | null) => ResolvedMedia | undefined;
  has: (f: FeatureKey) => boolean;
  reducedMotion: boolean;
  music: MusicApi;
  token: string | null;
  isPreview: boolean;
  /** POST JSON to this wedding's public API (adds the guest token). */
  post: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  get: <T = unknown>(path: string) => Promise<T>;
  openShare: () => void;
  gateOpen: boolean;
  setGateOpen: (v: boolean) => void;
  entered: boolean;
  setEntered: (v: boolean) => void;
  /** True once the two illustrated figures have finished their walk and stand together at the end of the page. */
  journeyTogether: boolean;
  setJourneyTogether: (v: boolean) => void;
}

const Ctx = createContext<InvitationCtx | null>(null);
export const useInvitation = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useInvitation outside <InvitationProvider>");
  return c;
};

class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
export { ApiError };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError("NETWORK", "network");
  }
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; data?: T; error?: { code: string; message: string } };
  if (!res.ok || json.ok === false) throw new ApiError(json.error?.code ?? "INTERNAL", json.error?.message ?? "error");
  return (json.data ?? (json as unknown as T)) as T;
}

function useMusic(view: InvitationView): MusicApi {
  const tracks = view.tracks;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(() => Math.max(0, tracks.findIndex((t) => t.isPrimary)));
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const current = tracks[index] ?? null;

  useEffect(() => {
    if (!tracks.length) return;
    const a = new Audio();
    a.preload = "none";
    a.loop = tracks.length === 1;
    audioRef.current = a;
    const onTime = () => setProgress(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, [tracks]);

  const load = useCallback(
    (i: number) => {
      const a = audioRef.current;
      const t = tracks[i];
      if (!a || !t) return;
      if (!a.src.endsWith(t.url)) a.src = t.url;
      setIndex(i);
    },
    [tracks],
  );

  // Autoplay is never attempted: playback starts only inside a user gesture (the gate tap or the player button).
  const play = useCallback(
    (i?: number) => {
      const a = audioRef.current;
      if (!a || !tracks.length) return;
      const target = i ?? index;
      load(target);
      a.loop = tracks.length === 1;
      void a.play().catch(() => setPlaying(false));
    },
    [index, load, tracks],
  );
  const pause = useCallback(() => audioRef.current?.pause(), []);
  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) play();
    else a.pause();
  }, [play]);
  const toggleMute = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setMuted(a.muted);
  }, []);
  const seek = useCallback((r: number) => {
    const a = audioRef.current;
    if (a && a.duration) a.currentTime = r * a.duration;
  }, []);
  const next = useCallback(() => play((index + 1) % Math.max(1, tracks.length)), [index, play, tracks.length]);
  const prev = useCallback(() => play((index - 1 + tracks.length) % Math.max(1, tracks.length)), [index, play, tracks.length]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnd = () => {
      if (tracks.length > 1) play((index + 1) % tracks.length);
    };
    a.addEventListener("ended", onEnd);
    return () => a.removeEventListener("ended", onEnd);
  }, [index, play, tracks.length]);

  return { ready: tracks.length > 0, playing, muted, progress, duration, trackIndex: index, tracks, current, play, pause, toggle, toggleMute, seek, next, prev };
}

export function InvitationProvider({ view, children, initialLocale, onOpenShare }: { view: InvitationView; children: React.ReactNode; initialLocale: string; onOpenShare: () => void }) {
  const secondary = view.wedding.secondaryLocale;
  const multilingual = !!secondary && view.entitlements.features.includes("multilingual");
  const [locale, setLocaleState] = useState(() => (multilingual && (initialLocale === secondary || initialLocale === view.wedding.defaultLocale) ? initialLocale : view.wedding.defaultLocale));
  const [reducedMotion, setReducedMotion] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [journeyTogether, setJourneyTogether] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const on = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const setLocale = useCallback(
    (l: string) => {
      setLocaleState(l);
      try {
        document.cookie = `inv_lang=${l}; path=/; max-age=31536000; samesite=lax`;
        document.documentElement.lang = l;
      } catch {}
    },
    [],
  );
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useMemo(() => makeTranslator(locale, view.doc.i18n.overrides), [locale, view.doc.i18n.overrides]);
  const L = useCallback(
    (text: LocalizedText | undefined | null) => {
      if (!text) return "";
      const direct = text[locale];
      if (direct && direct.trim()) return direct;
      const fb = text[view.wedding.defaultLocale] ?? text.en;
      if (fb && fb.trim()) return fb;
      return Object.values(text).find((v) => v && v.trim()) ?? "";
    },
    [locale, view.wedding.defaultLocale],
  );
  const media = useCallback((id?: string | null) => (id ? view.media[id] : undefined), [view.media]);
  const has = useCallback((f: FeatureKey) => canUse(view.entitlements, f), [view.entitlements]);
  const music = useMusic(view);
  const token = view.guest?.token ?? null;
  const slug = view.wedding.slug;
  const isPreview = view.mode === "preview";

  const post = useCallback(
    <T,>(path: string, body?: unknown) =>
      request<T>(`/api/public/${slug}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-invite-token": token } : {}) },
        body: JSON.stringify(body ?? {}),
      }),
    [slug, token],
  );
  const get = useCallback(
    <T,>(path: string) => request<T>(`/api/public/${slug}${path}`, { headers: token ? { "x-invite-token": token } : {}, cache: "no-store" }),
    [slug, token],
  );

  const value: InvitationCtx = {
    view, slug, locale, setLocale, multilingual, t, L, media, has, reducedMotion, music, token, isPreview, post, get,
    openShare: onOpenShare, gateOpen, setGateOpen, entered, setEntered, journeyTogether, setJourneyTogether,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
