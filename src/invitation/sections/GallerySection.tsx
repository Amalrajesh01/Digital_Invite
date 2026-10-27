"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SectionConfig } from "@/domain/doc/schema";
import type { ResolvedMedia } from "@/domain/media/service";
import { useInvitation } from "../engine/context";
import { Reveal } from "../engine/motion";
import { ArtFallback } from "../engine/Photo";
import { roman, splitCaption } from "../engine/format";
import { Shell, SectionHead, useCopy } from "./shared";

type Item = ResolvedMedia & { by?: string };
type Open = (i: number) => void;

/**
 * The fullscreen viewer. Opening zooms the photograph out of its thumbnail (one uniform scale, so nothing is ever stretched); a swipe
 * or an arrow key moves to the next, a swipe down or Esc closes it, and the page behind it never moves: focus returns to the
 * thumbnail that was tapped, so the guest is exactly where they were. Neighbours are fetched ahead of time.
 */
export function Lightbox({ items, index, onClose, onIndex, origin }: { items: Item[]; index: number | null; onClose: () => void; onIndex: (i: number) => void; origin?: DOMRect | null }) {
  const { L, t } = useInvitation();
  const ref = useRef<HTMLDialogElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [dir, setDir] = useState<"n" | "p" | "0">("0");
  const fresh = useRef(true);
  const [bad, setBad] = useState<string | null>(null);
  const n = items.length;
  if (index == null && dir !== "0") setDir("0"); // the next opening zooms out of its thumbnail instead of sliding

  // the native dialog traps focus and returns it on close; the class keeps the page behind it from scrolling
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (index != null && !d.open) { fresh.current = true; d.showModal(); }
    if (index == null && d.open) d.close();
    document.documentElement.classList.toggle("inv-lb-open", index != null);
    return () => document.documentElement.classList.remove("inv-lb-open");
  }, [index]);

  const step = useCallback((delta: number) => {
    if (index == null || n < 2) return;
    setDir(delta > 0 ? "n" : "p");
    onIndex((index + delta + n) % n);
  }, [index, n, onIndex]);

  useEffect(() => {
    if (index == null) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Home") { setDir("p"); onIndex(0); }
      else if (e.key === "End") { setDir("n"); onIndex(n - 1); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [index, n, onIndex, step]);

  // the neighbours are fetched while this one is looked at, so a swipe never shows an empty frame
  useEffect(() => {
    if (index == null || n < 2) return;
    for (const d of [1, -1]) new Image().src = items[(index + d + n) % n].url;
  }, [index, items, n]);

  // zoom out of the thumbnail the first time a photograph is shown (skipped for reduced motion)
  const play = useCallback((img: HTMLImageElement) => {
    if (!fresh.current) return;
    fresh.current = false;
    if (!origin || !origin.width || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = img.getBoundingClientRect();
    if (!to.width) return;
    const dx = origin.left + origin.width / 2 - (to.left + to.width / 2);
    const dy = origin.top + origin.height / 2 - (to.top + to.height / 2);
    img.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${origin.width / to.width})`, opacity: 0.4 }, { transform: "none", opacity: 1 }], { duration: 460, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" });
  }, [origin]);
  useLayoutEffect(() => {
    const img = imgRef.current;
    if (index != null && img?.complete && img.naturalWidth) play(img);
  }, [index, play]);

  const item = index != null ? items[index] : null;
  const cap = item ? splitCaption(L(item.caption)) : null;
  const failed = !!item && bad === item.id;

  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onMove = (e: React.PointerEvent) => {
    const s = drag.current;
    const img = imgRef.current;
    if (!s || !img) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    img.style.transition = "none";
    img.style.transform = Math.abs(dy) > Math.abs(dx) * 1.3 ? `translateY(${dy}px)` : `translateX(${dx}px)`;
    img.style.opacity = String(Math.max(0.35, 1 - Math.hypot(dx, dy) / 520));
  };
  const onUp = (e: React.PointerEvent) => {
    const s = drag.current;
    drag.current = null;
    const img = imgRef.current;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (img) { img.style.transition = "transform .25s var(--ease), opacity .25s"; img.style.transform = ""; img.style.opacity = ""; }
    if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.3) onClose();
    else if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  };

  return (
    <dialog ref={ref} onClose={onClose} aria-label={t("gallery.open")} className="gl-lb m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-black/95 p-0 text-white backdrop:bg-black">
      {item && (
        <div className="relative flex h-full w-full flex-col items-center justify-center px-2 pb-24 pt-14 md:px-16" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { drag.current = null; }}>
          {failed ? (
            <p className="max-w-xs text-center text-white/70">{t("gallery.missing")}</p>
          ) : (
            <img ref={imgRef} key={item.id} data-dir={dir}src={item.url} srcSet={item.srcSet} sizes="100vw" alt={L(item.alt)} className="gl-lb-img max-h-full max-w-full select-none object-contain" draggable={false} onLoad={(e) => play(e.currentTarget)} onError={() => setBad(item.id)} />
          )}
          {cap && (cap.title || item.by) && (
            <div className="pointer-events-none absolute inset-x-0 bottom-5 grid gap-1 px-6 text-center">
              {cap.title && <p className="gl-lb-title">{cap.title}{item.by ? ` — ${item.by}` : ""}</p>}
              {cap.line && <p className="text-[0.95rem] text-white/75">{cap.line}</p>}
            </div>
          )}
          <p className="absolute left-4 top-4 text-sm tabular-nums text-white/60" aria-live="polite">{t("gallery.counter", { n: (index ?? 0) + 1, total: n })}</p>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="size-5" /></button>
          {n > 1 && (
            <>
              <button type="button" onClick={() => step(-1)} aria-label={t("gallery.prev")} className="gl-lb-nav absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20"><ChevronLeft /></button>
              <button type="button" onClick={() => step(1)} aria-label={t("gallery.next")} className="gl-lb-nav absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20"><ChevronRight /></button>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}

// ── pieces shared by every layout ───────────────────────────────────────────────────────────────────

/** A photograph that fades in, keeps its focal point when cropped, and draws a tasteful placeholder — never a broken-image icon — if it cannot load. */
function Pic({ item, sizes }: { item: Item; sizes: string }) {
  const { L } = useInvitation();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return <ArtFallback seed={item.id.length} />;
  const f = item.focal;
  return (
    <img
      src={item.url} srcSet={item.srcSet} sizes={sizes} alt={L(item.alt)} width={item.width} height={item.height} loading="lazy" decoding="async"
      onLoad={() => setLoaded(true)} onError={() => { setFailed(true); if (process.env.NODE_ENV !== "production") console.warn("[gallery] a photograph could not be loaded:", item.url); }}
      ref={(el) => { if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true); }}
      className={cn("gl-img", loaded && "in")} style={f ? { objectPosition: `${f.x}% ${f.y}%` } : undefined}
    />
  );
}

/** The tappable photograph: it opens the viewer, and the viewer zooms out of it. */
function Tile({ item, i, onOpen, ratio, sizes, className }: { item: Item; i: number; onOpen: Open; ratio: string; sizes: string; className?: string }) {
  const { L, t } = useInvitation();
  return (
    <button type="button" data-lb={i} onClick={() => onOpen(i)} aria-label={`${t("gallery.open")}${L(item.alt) ? `: ${L(item.alt)}` : ""}`} className={cn("gl-tile", className)} style={{ "--ar": ratio } as CSSProperties}>
      <span className="gl-fill" style={item.blur ? { backgroundImage: `url(${item.blur})` } : undefined}><Pic item={item} sizes={sizes} /></span>
    </button>
  );
}

/** “Title — a line”: the title is the chapter, the line is what is said of it. */
function Cap({ item, line = true, className }: { item: Item; line?: boolean; className?: string }) {
  const { L } = useInvitation();
  const { title, line: sub } = splitCaption(L(item.caption));
  if (!title) return null;
  return (
    <figcaption className={cn("gl-cap", className)}>
      <span className="gl-cap-title">{title}</span>
      {line && sub && <span className="gl-cap-line">{sub}</span>}
    </figcaption>
  );
}

/** A few motes of gold that rise once, as the story begins — a soft way out of the opening and into the photographs, never constant noise. */
function Drift() {
  return (
    <Reveal variant="fade" className="gl-drift">
      <span aria-hidden>
        {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--x": `${(i * 37 + 9) % 100}%`, "--s": `${0.6 + ((i * 7) % 9) / 10}`, "--d": `${6.5 + ((i * 3) % 5)}s`, "--l": `${((i * 0.35) % 3).toFixed(2)}s` } as CSSProperties} />)}
      </span>
    </Reveal>
  );
}

// ── the layouts ─────────────────────────────────────────────────────────────────────────────────────

/** A · Cinematic vertical story: one large photograph at a time, its chapter beside or beneath it; the photograph settles as it is revealed. */
function Story({ items, onOpen }: { items: Item[]; onOpen: Open }) {
  const { L } = useInvitation();
  return (
    <ol className="gl-story">
      {items.map((it, i) => {
        const { title, line } = splitCaption(L(it.caption));
        return (
          <li key={it.id} className={cn("gl-chap", i % 2 === 1 && "gl-chap-flip")}>
            <Reveal variant="mask" className="gl-chap-media"><Tile item={it} i={i} onOpen={onOpen} ratio="4 / 5" sizes="(max-width: 900px) 90vw, 520px" className="gl-ken" /></Reveal>
            <Reveal delay={140} className="gl-chap-text">
              <span className="gl-no inv-num" aria-hidden>{roman(i + 1)}</span>
              {title && <h3 className="gl-chap-title">{title}</h3>}
              {line && <p className="gl-chap-line">{line}</p>}
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}

/** C · Royal portraits: each photograph in a gilded frame with a mat, and a small plaque. */
function Frames({ items, onOpen }: { items: Item[]; onOpen: Open }) {
  return (
    <ul className="gl-frames">
      {items.map((it, i) => (
        <Reveal as="li" key={it.id} delay={(i % 3) * 90} className="gl-fr">
          <figure className="gl-fr-fig">
            <div className="gl-fr-frame"><div className="gl-fr-mat"><Tile item={it} i={i} onOpen={onOpen} ratio="4 / 5" sizes="(max-width: 768px) 46vw, 300px" /></div></div>
            <Cap item={it} line={false} className="gl-fr-cap" />
          </figure>
        </Reveal>
      ))}
    </ul>
  );
}

/** D · Floating memory cards: cards with a little depth that drift very gently. */
function Cards({ items, onOpen }: { items: Item[]; onOpen: Open }) {
  return (
    <ul className="gl-cards">
      {items.map((it, i) => (
        <Reveal as="li" key={it.id} delay={(i % 3) * 90}>
          <figure className="gl-card" style={{ "--tilt": `${[-2.4, 1.8, -1.2, 2.6, -1.8, 1.2][i % 6]}deg`, "--fd": `${-((i * 1.7) % 7).toFixed(1)}s` } as CSSProperties}>
            <Tile item={it} i={i} onOpen={onOpen} ratio="4 / 5" sizes="(max-width: 768px) 46vw, 300px" />
            <Cap item={it} />
          </figure>
        </Reveal>
      ))}
    </ul>
  );
}

/** A small ornament — a short stem, two leaves and one white flower — used at two corners of a floral frame. It stays beside the photograph, never across it. */
function Sprig({ className }: { className?: string }) {
  return (
    <svg className={cn("gl-sprig", className)} viewBox="0 0 48 48" aria-hidden focusable="false">
      <path d="M6 44 C 12 36, 18 28, 25 19" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <g fill="currentColor" fillOpacity=".26" stroke="currentColor" strokeWidth=".8">
        <path d="M9 39 C 3 37, 2 30, 5 25 C 11 27, 13 33, 9 39Z" />
        <path d="M16 31 C 11 27, 12 20, 17 17 C 21 21, 21 27, 16 31Z" />
      </g>
      <g transform="translate(30 14)">
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-4.6" rx="2.8" ry="4.4" transform={`rotate(${a})`} fill="#fff" fillOpacity=".96" stroke="currentColor" strokeWidth=".7" />)}
        <circle r="2" fill="var(--c-accent)" />
      </g>
    </svg>
  );
}

/** E · Floral: arched frames with a sprig of leaves and a flower at two corners, which open as the frame is revealed. */
function Floral({ items, onOpen }: { items: Item[]; onOpen: Open }) {
  return (
    <ul className="gl-flo">
      {items.map((it, i) => (
        <Reveal as="li" key={it.id} delay={(i % 3) * 90}>
          <figure className="gl-flo-fig">
            <div className="gl-flo-frame"><Tile item={it} i={i} onOpen={onOpen} ratio="4 / 5" sizes="(max-width: 768px) 46vw, 300px" /><Sprig className="a" /><Sprig className="b" /></div>
            <Cap item={it} />
          </figure>
        </Reveal>
      ))}
    </ul>
  );
}

/** F · Minimal: a strict grid, hairline captions, almost no motion. */
function Minimal({ items, onOpen }: { items: Item[]; onOpen: Open }) {
  return (
    <ul className="gl-min">
      {items.map((it, i) => (
        <Reveal as="li" key={it.id} variant="fade" delay={(i % 3) * 70}>
          <figure className="m-0"><Tile item={it} i={i} onOpen={onOpen} ratio="4 / 5" sizes="(max-width: 768px) 46vw, 300px" /><Cap item={it} line={false} /></figure>
        </Reveal>
      ))}
    </ul>
  );
}

/** G · Horizontal cinematic reel: large frames to swipe through, with a progress line and a counter. */
function Reel({ items, onOpen }: { items: Item[]; onOpen: Open }) {
  const { t } = useInvitation();
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const raf = useRef(0);
  const sync = () => {
    raf.current = 0;
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    bar.current?.style.setProperty("--p", String(max > 0 ? el.scrollLeft / max : 0));
    const first = el.firstElementChild as HTMLElement | null;
    setAt(Math.min(items.length - 1, Math.round(el.scrollLeft / Math.max(1, (first?.offsetWidth ?? 1) + 14))));
  };
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);
  const go = (d: number) => track.current?.scrollBy({ left: d * (track.current.clientWidth * 0.7), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return (
    <div className="gl-reel-wrap">
      <div ref={track} className="gl-reel" role="region" tabIndex={0} aria-label={t("gallery.title")} onScroll={() => { if (!raf.current) raf.current = requestAnimationFrame(sync); }}>
        {items.map((it, i) => (
          <figure key={it.id} className="gl-reel-i"><Tile item={it} i={i} onOpen={onOpen} ratio="4 / 5" sizes="(max-width: 768px) 78vw, 384px" /><Cap item={it} /></figure>
        ))}
      </div>
      <div className="gl-reel-bar">
        <span className="gl-reel-count inv-num" aria-hidden>{String(at + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
        <div ref={bar} className="gl-reel-track" aria-hidden />
        <span className="gl-reel-hint">{t("gallery.swipe")}</span>
        <button type="button" className="gl-reel-btn" onClick={() => go(-1)} aria-label={t("gallery.prev")}><ChevronLeft className="size-4" /></button>
        <button type="button" className="gl-reel-btn" onClick={() => go(1)} aria-label={t("gallery.next")}><ChevronRight className="size-4" /></button>
      </div>
    </div>
  );
}

/** H · Magazine: a large photograph, a pair, a wide one — sized like a spread, captioned like an article. */
const MAG: [mobile: string, desktop: string][] = [["4 / 5", "3 / 2"], ["4 / 5", "3 / 4"], ["4 / 5", "3 / 4"], ["3 / 2", "3 / 2"]];
function Magazine({ items, onOpen }: { items: Item[]; onOpen: Open }) {
  return (
    <ul className="gl-mag">
      {items.map((it, i) => {
        const [m, d] = MAG[i % 4];
        return (
          <Reveal as="li" key={it.id} delay={(i % 2) * 90}>
            <figure className="m-0" style={{ "--ar-m": m, "--ar-d": d } as CSSProperties}><Tile item={it} i={i} onOpen={onOpen} ratio={m} sizes="(max-width: 768px) 92vw, 640px" /><Cap item={it} className="gl-mag-cap" /></figure>
          </Reveal>
        );
      })}
    </ul>
  );
}

/**
 * Editorial spreads: five photographs per spread on a 12-column grid, deliberately different in size and
 * proportion, two of them overlapping their neighbours. The second spread is a mirror image of the first.
 * On a phone it relaxes into a staggered two-column layout.
 */
const CELLS: { c: [number, number]; r: [number, number]; frame?: boolean; ratio: string }[] = [
  { c: [1, 7], r: [1, 11], ratio: "3 / 4" },
  { c: [6, 10], r: [3, 8], frame: true, ratio: "1 / 1" },
  { c: [10, 13], r: [1, 6], ratio: "3 / 4" },
  { c: [8, 13], r: [8, 13], ratio: "5 / 4" },
  { c: [2, 7], r: [10, 15], frame: true, ratio: "4 / 3" },
];

function Spreads({ items, onOpen }: { items: Item[]; onOpen: Open }) {
  const spreads: Item[][] = [];
  for (let i = 0; i < items.length; i += CELLS.length) spreads.push(items.slice(i, i + CELLS.length));
  return (
    <div className="spreads">
      {spreads.map((group, si) => (
        <div key={si} className="spread">
          {group.map((it, k) => {
            const cell = CELLS[k];
            const mirror = si % 2 === 1;
            const [c0, c1] = mirror ? [14 - cell.c[1], 14 - cell.c[0]] : cell.c;
            const vars = { "--c": `${c0} / ${c1}`, "--r": `${cell.r[0]} / ${cell.r[1]}`, "--ratio": cell.ratio } as CSSProperties;
            return (
              <div key={it.id} className={cn("spread-cell", cell.frame && "spread-frame")} style={vars}>
                <Reveal delay={k * 90} className="h-full">
                  <Thumb item={it} i={si * CELLS.length + k} onOpen={onOpen} className="h-full" sizes="(max-width: 768px) 50vw, 40vw" />
                </Reveal>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Thumb({ item, i, onOpen, className, sizes, style }: { item: Item; i: number; onOpen: Open; className?: string; sizes: string; style?: CSSProperties }) {
  const { L, t } = useInvitation();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const f = item.focal;
  return (
    <button type="button" data-lb={i} onClick={() => onOpen(i)} aria-label={`${t("gallery.open")}${L(item.alt) ? `: ${L(item.alt)}` : ""}`} className={cn("group relative block w-full overflow-hidden", className)} style={{ ...(item.blur ? { backgroundImage: `url(${item.blur})`, backgroundSize: "cover" } : { background: "var(--c-border)" }), borderRadius: "var(--r)", ...style }}>
      {failed ? <ArtFallback seed={item.id.length} /> : (
        <img src={item.url} srcSet={item.srcSet} sizes={sizes} alt={L(item.alt)} width={item.width} height={item.height} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} ref={(el) => { if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true); }} className={cn("h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]", loaded ? "opacity-100" : "opacity-0")} style={f ? { objectPosition: `${f.x}% ${f.y}%` } : undefined} />
      )}
      {L(item.caption) && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-8 text-left text-[0.82rem] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{splitCaption(L(item.caption)).title}</span>}
    </button>
  );
}

/** The layouts that tell the child’s story (and so begin with the drift of gold). */
const STORY_LAYOUTS = new Set(["story", "frames", "cards", "floral", "minimal", "reel", "magazine"]);

export default function GallerySection({ section }: { section: SectionConfig }) {
  const { view, L, t, has } = useInvitation();
  const copy = useCopy(section, { title: "gallery.title" });
  const advanced = has("advanced_gallery");
  const albums = useMemo(() => view.gallery.filter((a) => advanced || a.kind === "OFFICIAL" || a.kind === "EVENT"), [view.gallery, advanced]);
  const [albumId, setAlbumId] = useState<string>("all");
  const [open, setOpen] = useState<number | null>(null);
  // the thumbnail that was tapped, so the viewer can zoom out of it
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const openAt = useCallback<Open>((i) => {
    const el = root.current?.querySelector<HTMLElement>(`[data-lb="${i}"]`);
    setOrigin(el?.getBoundingClientRect() ?? null);
    setOpen(i);
  }, []);
  if (!albums.length) return null;
  const shown: Item[] = albumId === "all" ? albums.flatMap((a) => a.items) : albums.find((a) => a.id === albumId)?.items ?? [];
  const variant = section.variant;
  const onOpen = openAt;
  return (
    <Shell section={section}>
      <div ref={root} className="gl-wrap" data-layout={variant}>
        {STORY_LAYOUTS.has(variant) && section.settings.drift !== false && <Drift />}
        <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} className="!mb-8" />
        {albums.length > 1 && (
          <div className="inv-tabs mb-10" role="tablist" aria-label={t("gallery.title")}>
            <button role="tab" aria-selected={albumId === "all"} className="inv-tab" onClick={() => setAlbumId("all")}>{t("gallery.all")}</button>
            {albums.map((a) => (<button key={a.id} role="tab" aria-selected={albumId === a.id} className="inv-tab" onClick={() => setAlbumId(a.id)}>{L(a.title) || t("gallery.title")}</button>))}
          </div>
        )}

        {variant === "story" ? <Story items={shown} onOpen={onOpen} />
          : variant === "frames" ? <Frames items={shown} onOpen={onOpen} />
          : variant === "cards" ? <Cards items={shown} onOpen={onOpen} />
          : variant === "floral" ? <Floral items={shown} onOpen={onOpen} />
          : variant === "minimal" ? <Minimal items={shown} onOpen={onOpen} />
          : variant === "reel" ? <Reel items={shown} onOpen={onOpen} />
          : variant === "magazine" ? <Magazine items={shown} onOpen={onOpen} />
          : variant === "editorial" ? <Spreads items={shown} onOpen={onOpen} />
          : variant === "polaroid" ? (
            <ul className="snaps">
              {shown.map((it, i) => (
                <Reveal as="li" key={it.id} delay={(i % 3) * 80} className="snap">
                  <button type="button" data-lb={i} onClick={() => onOpen(i)} aria-label={`${t("gallery.open")}${L(it.alt) ? `: ${L(it.alt)}` : ""}`} className="snap-card" style={{ "--tilt": `${[-3.2, 2.4, -1.4, 3, -2.2, 1.6][i % 6]}deg` } as CSSProperties}>
                    <img src={it.url} srcSet={it.srcSet} sizes="(max-width: 768px) 46vw, 24vw" alt={L(it.alt)} width={it.width} height={it.height} loading="lazy" decoding="async" style={it.focal ? { objectPosition: `${it.focal.x}% ${it.focal.y}%` } : undefined} />
                    <span className="snap-cap">{splitCaption(L(it.caption)).title}</span>
                    <i className="tape" aria-hidden />
                  </button>
                </Reveal>
              ))}
            </ul>
          ) : variant === "filmstrip" ? (
            <div className="filmstrip" tabIndex={0} aria-label={t("gallery.title")}>
              {shown.map((it, i) => (
                <button key={it.id} type="button" data-lb={i} className="film-frame" onClick={() => onOpen(i)} aria-label={`${t("gallery.open")}${L(it.alt) ? `: ${L(it.alt)}` : ""}`}>
                  <img src={it.url} srcSet={it.srcSet} sizes="(max-width: 768px) 70vw, 420px" alt={L(it.alt)} loading="lazy" decoding="async" style={it.focal ? { objectPosition: `${it.focal.x}% ${it.focal.y}%` } : undefined} />
                  <span className="film-no inv-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
          ) : variant === "carousel" ? (
            <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:px-0" tabIndex={0} aria-label={t("gallery.title")}>
              {shown.map((it, i) => (<div key={it.id} className="w-[82vw] shrink-0 snap-center md:w-[34rem]"><Thumb item={it} i={i} onOpen={onOpen} className="aspect-[4/5] md:aspect-[4/3]" sizes="(max-width: 768px) 82vw, 544px" /></div>))}
            </div>
          ) : (
            <div className="columns-2 gap-3 md:columns-3 md:gap-4 [&>*]:mb-3 md:[&>*]:mb-4">
              {shown.map((it, i) => (
                <Reveal key={it.id} delay={(i % 3) * 60} className="break-inside-avoid">
                  <Thumb item={it} i={i} onOpen={onOpen} sizes="(max-width: 768px) 50vw, 33vw" style={{ aspectRatio: it.width && it.height ? `${it.width} / ${it.height}` : "4 / 5" }} />
                </Reveal>
              ))}
            </div>
          )}
        <Lightbox items={shown} index={open} onClose={() => setOpen(null)} onIndex={setOpen} origin={origin} />
      </div>
    </Shell>
  );
}
