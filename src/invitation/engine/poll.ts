"use client";
import { useEffect, useRef, useState } from "react";
import { useInvitation } from "./context";

interface Entry<T> {
  subs: Set<(d: T | null) => void>;
  data: T | null;
  timer: ReturnType<typeof setInterval> | null;
  fetcher: () => Promise<T>;
  interval: number;
}
const shared = new Map<string, Entry<unknown>>();

/**
 * One shared poller per resource, no matter how many sections read it — so 300 guests with
 * three live sections open produce one request per guest per interval, not three.
 * Pauses while the tab is hidden. (Swappable for Supabase Realtime later without touching sections.)
 */
export function useSharedPoll<T>(key: string, fetcher: () => Promise<T>, interval: number, enabled = true) {
  const [data, setData] = useState<T | null>((shared.get(key)?.data as T | null) ?? null);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;
  useEffect(() => {
    if (!enabled) return;
    let entry = shared.get(key) as Entry<T> | undefined;
    if (!entry) {
      entry = { subs: new Set(), data: null, timer: null, fetcher: () => fetchRef.current(), interval };
      shared.set(key, entry as Entry<unknown>);
    }
    const e = entry;
    const sub = (d: T | null) => setData(d);
    e.subs.add(sub);
    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const d = await e.fetcher();
        e.data = d;
        e.subs.forEach((s) => s(d));
      } catch {
        /* keep last good data; try again next tick */
      }
    };
    if (e.data) setData(e.data);
    if (!e.timer) {
      void tick();
      e.timer = setInterval(tick, e.interval);
    }
    const onVisible = () => !document.hidden && void tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      e.subs.delete(sub);
      if (e.subs.size === 0) {
        if (e.timer) clearInterval(e.timer);
        shared.delete(key);
      }
    };
  }, [key, interval, enabled]);
  return data;
}

export interface LivePayload {
  now: { id: string } | null;
  next: { id: string } | null;
  mode: "AUTO" | "MANUAL";
  note: string | null;
  updates: { id: string; title: Record<string, string>; body: Record<string, string>; kind: string; eventId: string | null; pinned: boolean; createdAt: string }[];
  serverTime: string;
}

export function useLive(enabled = true) {
  const { get, slug, token } = useInvitation();
  return useSharedPoll<LivePayload>(`live:${slug}:${token ?? ""}`, () => get<LivePayload>("/live"), 8000, enabled);
}
