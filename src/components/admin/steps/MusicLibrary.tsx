"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { attribution, categoryLabel, MUSIC_CATEGORIES, MUSIC_MOODS, searchLibrary } from "@/domain/music/library";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Browse, search, preview and pick from the bundled library. `added` = titles already in this invitation. */
export function MusicLibraryPicker({ added, busy, onPick }: { added: Set<string>; busy: boolean; onPick: (id: string, primary: boolean) => void }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [mood, setMood] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const list = useMemo(() => searchLibrary({ q, category, mood }), [q, category, mood]);
  const pending = MUSIC_CATEGORIES.filter((c) => "pending" in c && (!category || category === c.key));

  useEffect(() => () => audio.current?.pause(), []);
  const toggle = (id: string) => {
    const a = (audio.current ??= new Audio());
    a.onended = () => setPlaying(null);
    a.onerror = () => setPlaying(null);
    if (playing === id) {
      a.pause();
      setPlaying(null);
      return;
    }
    a.src = `/music/${id}`;
    a.play().then(() => setPlaying(id)).catch(() => setPlaying(null));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
        <TextField label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, instrument, feeling…" />
        <SelectField label="Kind of music" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All kinds</option>
          {MUSIC_CATEGORIES.filter((c) => !("pending" in c)).map((c) => (<option key={c.key} value={c.key}>{c.label}</option>))}
        </SelectField>
        <SelectField label="Mood" value={mood} onChange={(e) => setMood(e.target.value)}>
          <option value="">Any mood</option>
          {MUSIC_MOODS.map((m) => (<option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>))}
        </SelectField>
      </div>
      {list.length === 0 ? (
        <p className="py-6 text-center text-muted">Nothing matches. Try a broader search.</p>
      ) : (
        <ul className="divide-y divide-rule rounded-md border border-rule">
          {list.map((t) => {
            const have = added.has(`${t.title}|${attribution(t)}`);
            return (
              <li key={t.id} className="flex flex-wrap items-center gap-3 p-3">
                <button type="button" onClick={() => toggle(t.id)} aria-label={`${playing === t.id ? "Pause" : "Preview"} ${t.title}`} className="grid size-10 shrink-0 place-items-center rounded-full bg-paper-2 text-ink hover:bg-brass-soft">
                  {playing === t.id ? <Pause className="size-4" /> : <Play className="size-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{t.title} <span className="tnum font-normal text-muted">· {mmss(t.seconds)}</span></p>
                  <p className="truncate text-[13px] text-muted">{categoryLabel(t.category)} · {t.moods.join(", ")}</p>
                  <p className="text-[13px] text-ink-2">{t.note}</p>
                  <p className="text-[12px] text-muted">{attribution(t)}{t.shortened ? " · shortened" : ""}</p>
                </div>
                {have ? (
                  <span className="flex items-center gap-1.5 text-[13px] text-ok"><Check className="size-4" />Added</span>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy} onClick={() => onPick(t.id, true)}>Use as main song</Button>
                    <Button size="sm" variant="quiet" disabled={busy} icon={<Plus className="size-4" />} onClick={() => onPick(t.id, false)}>Add</Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {pending.length > 0 && (
        <div className="space-y-1 rounded-md bg-paper-2 p-3 text-[13px] text-muted">
          {pending.map((c) => (<p key={c.key}><strong className="text-ink-2">{c.label}:</strong> none yet. {"pending" in c ? c.pending : ""}</p>))}
        </div>
      )}
    </div>
  );
}
