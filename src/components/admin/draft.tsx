"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { InvitationDoc } from "@/domain/doc/schema";
import type { FeatureKey } from "@/domain/packages/features";
import type { MediaRow } from "@/app/actions/media";
import { listMediaAction } from "@/app/actions/media";
import { saveDraftAction, saveSettingsAction } from "@/app/actions/wedding";
import type { SettingsPatch } from "@/domain/wedding/service";
import { LocaleProvider } from "./forms";

export interface WeddingSettings {
  title: string;
  slug: string;
  weddingDate: string | null;
  timezone: string;
  defaultLocale: string;
  secondaryLocale: string | null;
  accessMode: "PUBLIC" | "PERSONALIZED_ONLY";
  autoLifecycle: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  templateId: string | null;
  themeId: string | null;
  themeOverrides: Record<string, unknown>;
  packageKey: "ESSENTIAL" | "SIGNATURE" | "LUXURY";
  customerClass: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export interface DraftCtx {
  weddingId: string;
  role: "admin" | "client";
  doc: InvitationDoc;
  update: (fn: (d: InvitationDoc) => void) => void;
  settings: WeddingSettings;
  updateSettings: (patch: Partial<WeddingSettings>) => void;
  saveState: SaveState;
  saveError: string | null;
  lastSaved: Date | null;
  flush: () => Promise<boolean>;
  features: FeatureKey[];
  has: (f: FeatureKey) => boolean;
  media: Record<string, MediaRow>;
  setMediaRows: (rows: MediaRow[]) => void;
  refreshMedia: () => Promise<void>;
  groups: { key: string; name: string }[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  replaceDoc: (d: InvitationDoc) => void;
}

const Ctx = createContext<DraftCtx | null>(null);
export const useDraft = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDraft outside <DraftProvider>");
  return c;
};

/**
 * Holds the wedding's draft in the browser and saves it continuously (debounced).
 * Nothing the couple's designer types is ever lost: edits flush on pause, on blur/hide and before navigating.
 */
export function DraftProvider({ weddingId, role, initialDoc, initialSettings, features, groups, initialMedia, children }: {
  weddingId: string; role: "admin" | "client"; initialDoc: InvitationDoc; initialSettings: WeddingSettings; features: FeatureKey[]; groups: { key: string; name: string }[]; initialMedia?: MediaRow[]; children: React.ReactNode;
}) {
  const [doc, setDoc] = useState(initialDoc);
  const [settings, setSettings] = useState(initialSettings);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [mediaRows, setMediaRowsState] = useState<MediaRow[]>(initialMedia ?? []);
  const docRef = useRef(doc);
  const setRef = useRef(settings);
  const dirtyDoc = useRef(false);
  const dirtySet = useRef<Partial<WeddingSettings> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef<Promise<boolean> | null>(null);
  const undoStack = useRef<InvitationDoc[]>([]);
  const redoStack = useRef<InvitationDoc[]>([]);
  const lastPush = useRef(0);
  const [, bump] = useState(0);

  const persist = useCallback(async (): Promise<boolean> => {
    if (saving.current) await saving.current;
    if (!dirtyDoc.current && !dirtySet.current) return true;
    const run = (async () => {
      setSaveState("saving");
      try {
        if (dirtyDoc.current) {
          dirtyDoc.current = false;
          const r = await saveDraftAction(weddingId, docRef.current);
          if (!r.ok) {
            dirtyDoc.current = true;
            throw new Error(r.error.message);
          }
        }
        if (dirtySet.current) {
          const patch = dirtySet.current;
          dirtySet.current = null;
          const r = await saveSettingsAction(weddingId, patch as SettingsPatch);
          if (!r.ok) {
            dirtySet.current = { ...patch, ...(dirtySet.current ?? {}) };
            throw new Error(r.error.message);
          }
        }
        setSaveState("saved");
        setSaveError(null);
        setLastSaved(new Date());
        return true;
      } catch (e) {
        setSaveState("error");
        setSaveError(e instanceof Error ? e.message : "Could not save.");
        return false;
      }
    })();
    saving.current = run;
    const ok = await run;
    saving.current = null;
    return ok;
  }, [weddingId]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setSaveState((s) => (s === "error" ? s : "saving"));
    timer.current = setTimeout(() => void persist(), 900);
  }, [persist]);

  const update = useCallback(
    (fn: (d: InvitationDoc) => void) => {
      // Undo history: consecutive keystrokes within a second collapse into a single step.
      const now = Date.now();
      if (now - lastPush.current > 1000) {
        undoStack.current.push(docRef.current);
        if (undoStack.current.length > 60) undoStack.current.shift();
        redoStack.current = [];
        bump((n) => n + 1);
      }
      lastPush.current = now;
      setDoc((cur) => {
        const next = structuredClone(cur);
        fn(next);
        docRef.current = next;
        return next;
      });
      dirtyDoc.current = true;
      schedule();
    },
    [schedule],
  );

  const replaceDoc = useCallback(
    (d: InvitationDoc) => {
      docRef.current = d;
      setDoc(d);
      dirtyDoc.current = true;
      schedule();
    },
    [schedule],
  );
  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(docRef.current);
    lastPush.current = 0;
    replaceDoc(prev);
    bump((n) => n + 1);
  }, [replaceDoc]);
  const redo = useCallback(() => {
    const nxt = redoStack.current.pop();
    if (!nxt) return;
    undoStack.current.push(docRef.current);
    lastPush.current = 0;
    replaceDoc(nxt);
    bump((n) => n + 1);
  }, [replaceDoc]);

  const updateSettings = useCallback(
    (patch: Partial<WeddingSettings>) => {
      setSettings((cur) => {
        const next = { ...cur, ...patch };
        setRef.current = next;
        return next;
      });
      dirtySet.current = { ...(dirtySet.current ?? {}), ...patch };
      schedule();
    },
    [schedule],
  );

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    return persist();
  }, [persist]);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && void flush();
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirtyDoc.current || dirtySet.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [flush]);

  const refreshMedia = useCallback(async () => {
    const r = await listMediaAction(weddingId);
    if (r.ok) setMediaRowsState(r.data);
  }, [weddingId]);
  useEffect(() => {
    if (!initialMedia) void refreshMedia();
  }, [initialMedia, refreshMedia]);

  const media = useMemo(() => Object.fromEntries(mediaRows.map((m) => [m.id, m])), [mediaRows]);
  const value: DraftCtx = {
    weddingId, role, doc, update, settings, updateSettings, saveState, saveError, lastSaved, flush, features, has: (f) => features.includes(f),
    media, setMediaRows: setMediaRowsState, refreshMedia, groups,
    undo, redo, canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0, replaceDoc,
  };
  return (
    <Ctx.Provider value={value}>
      <LocaleProvider value={{ secondary: settings.secondaryLocale }}>{children}</LocaleProvider>
    </Ctx.Provider>
  );
}

export function SaveIndicator() {
  const { saveState, saveError, lastSaved, flush } = useDraft();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);
  if (saveState === "error")
    return (
      <span role="alert" className="flex items-center gap-2 text-[13px] text-bad">
        <span aria-hidden className="size-2 rounded-full bg-bad" />
        {saveError ?? "Could not save"}
        <button type="button" className="underline underline-offset-2" onClick={() => void flush()}>Retry</button>
      </span>
    );
  const label = saveState === "saving" ? "Saving…" : lastSaved ? `Saved ${Math.max(1, Math.round((Date.now() - lastSaved.getTime()) / 1000)) < 60 ? "just now" : Math.round((Date.now() - lastSaved.getTime()) / 60000) + " min ago"}` : "All changes save automatically";
  return (
    <span role="status" aria-live="polite" className="flex items-center gap-2 text-[13px] text-muted">
      <span aria-hidden className={saveState === "saving" ? "size-2 animate-pulse rounded-full bg-warn" : "size-2 rounded-full bg-ok"} />
      {label}
    </span>
  );
}
