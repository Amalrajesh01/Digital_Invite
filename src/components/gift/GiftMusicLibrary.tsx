"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { MUSIC_CATEGORIES, MUSIC_LIBRARY, categoryLabel, type MusicCategory } from "@/domain/music/library";
import type { LetterSpec } from "@/domain/letters/types";

/** Which of the library's categories suit each kind of sound a letter suggests. */
const SUGGEST: Record<LetterSpec["music"], MusicCategory[]> = {
  none: [], piano: ["soft-piano", "minimal-piano"], acoustic: ["acoustic", "guitar", "golden-hour"], cinematic: ["orchestral", "dramatic", "piano-strings"],
  ambient: ["ambience", "dreamlike", "nature"], celebration: ["celebration", "golden-hour", "contemporary"], reflective: ["minimal-piano", "piano-strings", "soft-piano"], minimal: ["minimal-piano", "ambience"], classical: ["classical-strings", "vintage", "harp"],
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/**
 * A licensed library (instrumentals, CC BY 4.0 — the credit travels with the song) for letters that would like a soundtrack. Nothing
 * here plays by itself: a track plays only when its play button is pressed, one at a time, and the recipient presses play in the letter.
 */
export function GiftMusicLibrary({ suggest, onPick, busy }: { suggest: LetterSpec["music"]; onPick: (id: string) => void; busy: boolean }) {
  const suggested = SUGGEST[suggest];
  const [cat, setCat] = useState<string>(suggested[0] ?? "");
  const [playing, setPlaying] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const tracks = useMemo(() => MUSIC_LIBRARY.filter((t) => !cat || t.category === cat), [cat]);
  const cats = MUSIC_CATEGORIES.filter((c) => MUSIC_LIBRARY.some((t) => t.category === c.key));
  const ordered = [...cats].sort((a, b) => Number(suggested.includes(b.key)) - Number(suggested.includes(a.key)));
  useEffect(() => () => { audio.current?.pause(); }, []);
  const toggle = (id: string) => {
    if (!audio.current) audio.current = new Audio();
    const a = audio.current;
    if (playing === id) { a.pause(); setPlaying(null); return; }
    a.src = `/music/${id}`;
    a.onended = () => setPlaying(null);
    void a.play().then(() => setPlaying(id)).catch(() => setPlaying(null));
  };
  return (
    <div className="mt-6">
      <h3 className="text-[19px] font-semibold text-ink">Or choose from our library</h3>
      <p className="mt-1 text-[14.5px] text-muted">{suggest === "none" ? "This letter is lovely in silence, but if you would like something, here are quiet options." : "Instrumentals, free to use. The composer’s credit is shown with the song."}</p>
      <div role="group" aria-label="Kinds of music" className="mt-3 flex flex-wrap gap-2">
        <button type="button" aria-pressed={cat === ""} onClick={() => setCat("")} className={cn("min-h-11 rounded-full border px-3.5 text-[13.5px] font-medium", cat === "" ? "border-ink bg-ink text-white" : "border-rule-strong bg-white text-ink-2")}>All</button>
        {ordered.map((c) => (
          <button key={c.key} type="button" aria-pressed={cat === c.key} onClick={() => setCat(c.key)} className={cn("min-h-11 rounded-full border px-3.5 text-[13.5px] font-medium", cat === c.key ? "border-ink bg-ink text-white" : "border-rule-strong bg-white text-ink-2", suggested.includes(c.key) && cat !== c.key && "border-accent text-accent")}>{c.label}</button>
        ))}
      </div>
      <ul className="mt-4 grid gap-2">
        {tracks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-xl border border-rule-strong bg-white p-3">
            <button type="button" onClick={() => toggle(t.id)} aria-label={`${playing === t.id ? "Pause" : "Preview"} ${t.title}`} className="grid size-11 shrink-0 place-items-center rounded-full bg-paper-2 text-ink">{playing === t.id ? <Pause className="size-4" /> : <Play className="size-4" />}</button>
            <span className="min-w-0 flex-1"><span className="block truncate text-[15.5px] font-semibold text-ink">{t.title}</span><span className="block truncate text-[13px] text-muted">{categoryLabel(t.category)} · {mmss(t.seconds)} · {t.note}</span></span>
            <button type="button" disabled={busy} onClick={() => { audio.current?.pause(); setPlaying(null); onPick(t.id); }} className="btn btn-quiet btn-sm shrink-0">Use this</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
