"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { Qr } from "@/invitation/engine/qr";

export interface WallPhoto { id: string; url: string; by: string; approvedAt: string; width: number | null; height: number | null }

const SLIDE_MS = 6500;
const POLL_MS = 7000;

export function WallScreen({ slug, title, inviteUrl, initial }: { slug: string; title: string; inviteUrl: string; initial: WallPhoto[] }) {
  const [photos, setPhotos] = useState<WallPhoto[]>(initial);
  const [i, setI] = useState(0);
  const [fresh, setFresh] = useState<string | null>(null);
  const seen = useRef(new Set(initial.map((p) => p.id)));
  const ordered = useMemo(() => [...photos].sort((a, b) => (a.approvedAt < b.approvedAt ? 1 : -1)), [photos]);

  const poll = useCallback(async () => {
    if (document.hidden) return;
    try {
      const res = await fetch(`/api/wall/${encodeURIComponent(slug)}`, { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data?: { items: (WallPhoto & { approvedAt: string })[] } };
      if (!json.ok || !json.data) return;
      const items = json.data.items;
      const newest = items.find((p) => !seen.current.has(p.id));
      items.forEach((p) => seen.current.add(p.id));
      setPhotos(items);
      if (newest) {
        // A brand-new photo jumps the queue so guests see themselves within seconds.
        setFresh(newest.id);
        setI(0);
      }
    } catch {
      /* the screen keeps showing what it has */
    }
  }, [slug]);

  useEffect(() => {
    const t = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  useEffect(() => {
    if (ordered.length < 2) return;
    const t = setInterval(() => { setFresh(null); setI((n) => (n + 1) % ordered.length); }, SLIDE_MS);
    return () => clearInterval(t);
  }, [ordered.length]);

  const current = ordered[i % Math.max(1, ordered.length)];
  const fullscreen = () => void document.documentElement.requestFullscreen?.().catch(() => undefined);

  return (
    <main className="relative grid min-h-dvh overflow-hidden text-[var(--c-on-inverse)]" style={{ background: "var(--c-inverse)", fontFamily: "var(--f-body)" }}>
      {current ? (
        <>
          {/* blurred copy fills the letterbox so any photo shape looks intentional */}
          <img key={"bg" + current.id} src={current.url} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-3xl" />
          <div className="relative grid place-items-center p-6 pb-28 sm:p-12 sm:pb-32">
            <img key={current.id} src={current.url} alt={`Photo shared by ${current.by || "a guest"}`} className="max-h-[calc(100dvh-17rem)] max-w-full rounded-[calc(var(--r)+2px)] object-contain shadow-[0_30px_80px_rgba(0,0,0,.45)] [animation:wall-in_.9s_cubic-bezier(.2,.7,.2,1)]" />
          </div>
          <p key={"by" + current.id} aria-live="polite" className="absolute inset-x-0 bottom-24 text-center text-lg opacity-90 sm:bottom-28 sm:text-2xl" style={{ fontFamily: "var(--f-heading)" }}>
            {fresh === current.id && <span className="mr-3 rounded-full bg-[var(--c-accent)] px-3 py-1 align-middle text-xs font-semibold tracking-widest text-black">JUST IN</span>}
            {current.by ? `Shared by ${current.by}` : ""}
          </p>
        </>
      ) : (
        <div className="grid place-items-center p-10 text-center">
          <div>
            <img src="/brand/mark-white.png" alt="" aria-hidden className="mx-auto size-16 object-contain opacity-70" />
            <h1 className="mt-6 text-4xl sm:text-6xl" style={{ fontFamily: "var(--f-heading)" }}>{title}</h1>
            <p className="mx-auto mt-5 max-w-xl text-xl opacity-80">Photos from the celebration will appear here as guests share them. Scan the code to add yours.</p>
          </div>
        </div>
      )}

      <footer className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 bg-gradient-to-t from-black/60 to-transparent p-5 sm:p-8">
        <div>
          <p className="text-2xl sm:text-3xl" style={{ fontFamily: "var(--f-heading)" }}>{title}</p>
          <p className="mt-0.5 text-sm opacity-75 sm:text-base">Scan the code to open the invitation and share your photos</p>
        </div>
        <div className="flex items-end gap-4">
          <button type="button" onClick={fullscreen} className="grid size-11 place-items-center rounded-full border border-white/30 bg-black/30 opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100" aria-label="Full screen"><Maximize2 className="size-5" /></button>
          <Qr text={inviteUrl} size={96} label={`Scan to open the invitation for ${title}`} className="rounded-md bg-white p-1.5" />
        </div>
      </footer>
      <style>{`@keyframes wall-in{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){img{animation:none!important}}`}</style>
    </main>
  );
}
