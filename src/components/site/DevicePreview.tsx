"use client";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Monitor, RotateCcw, Smartphone } from "lucide-react";
import { cn } from "@/lib/cn";

type Device = "phone" | "desktop";
const SIZE: Record<Device, { w: number; h: number }> = { phone: { w: 390, h: 800 }, desktop: { w: 1280, h: 800 } };
const BEZEL: Record<Device, number> = { phone: 11, desktop: 0 };
const BAR = 34; // the desktop frame’s browser bar

/**
 * A sample invitation in a device frame, with a phone / desktop toggle. The frame loads only when it scrolls near the
 * screen (an invitation carries real JavaScript), shows the photograph meanwhile, and is scaled — never squeezed — so the
 * design inside always lays out at a true phone or desktop width.
 */
export function DevicePreview({ src, title, cover }: { src: string; title: string; cover: React.ReactNode }) {
  const [device, setDevice] = useState<Device>("phone");
  const [near, setNear] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [round, setRound] = useState(0);
  const [scale, setScale] = useState(1);
  const host = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "500px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / (SIZE[device].w + BEZEL[device] * 2)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device]);

  const { w, h } = SIZE[device];
  const pad = BEZEL[device];
  const bar = device === "desktop" ? BAR : 0;
  const url = `${src}${src.includes("?") ? "&" : "?"}r=${round}`;
  return (
    <div ref={host}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Preview size" className="inline-flex rounded-full border border-rule-strong bg-white p-1">
          {([["phone", "Mobile", Smartphone], ["desktop", "Desktop", Monitor]] as const).map(([k, label, Icon]) => (
            <button key={k} role="tab" type="button" aria-selected={device === k} onClick={() => { setDevice(k); setLoaded(false); }} className={cn("inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors", device === k ? "bg-ink text-white" : "text-ink-2 hover:text-ink")}>
              <Icon className="size-4" aria-hidden /> {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setRound((n) => n + 1); setLoaded(false); }} className="btn btn-ghost btn-sm"><RotateCcw className="size-4" aria-hidden /> Replay opening</button>
          <a href={src} target="_blank" rel="noopener noreferrer" className="btn btn-quiet btn-sm"><ExternalLink className="size-4" aria-hidden /> Open full screen</a>
        </div>
      </div>

      <div ref={box} className="mx-auto w-full" style={{ maxWidth: device === "phone" ? w + pad * 2 : undefined }}>
        <div className={cn("mx-auto overflow-hidden bg-ink shadow-[0_50px_90px_-40px_rgba(11,27,53,.6)]", device === "phone" ? "rounded-[2.6rem]" : "rounded-xl")} style={{ width: w * scale + pad * 2, height: h * scale + pad * 2 + bar, padding: pad }}>
          {device === "desktop" && (
            <div className="flex items-center gap-1.5 bg-[#e9eef7] px-3" style={{ height: bar }} aria-hidden>
              <span className="size-3 rounded-full bg-[#f0b9b3]" /><span className="size-3 rounded-full bg-[#f0d9a0]" /><span className="size-3 rounded-full bg-[#b9d9bf]" />
              <span className="ml-3 h-5 flex-1 rounded-full bg-white/80" />
            </div>
          )}
          <div className="relative overflow-hidden bg-paper" style={{ width: w * scale, height: h * scale, borderRadius: device === "phone" ? "2rem" : 0 }}>
            <div className={cn("absolute inset-0 transition-opacity duration-500", loaded ? "pointer-events-none opacity-0" : "opacity-100")} aria-hidden>{cover}</div>
            {near && (
              <iframe
                key={`${device}-${round}`}
                src={url}
                title={title}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                className="absolute left-0 top-0 border-0 bg-white"
                style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}
                allow="autoplay"
              />
            )}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-[13.5px] text-muted">A real, published invitation with fictional names. Tap the envelope to open it.</p>
    </div>
  );
}
