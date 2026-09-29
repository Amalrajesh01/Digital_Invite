"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Music, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Switch, TextField } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Bits";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import { deleteTrackAction, listTracksAction, saveTrackAction, type MediaRow } from "@/app/actions/media";
import { FormCard, Hint } from "../forms";
import { useDraft } from "../draft";

type Track = { id: string; assetId: string; title: string; artist: string; isPrimary: boolean; inPlaylist: boolean };

export function MusicStep() {
  const { weddingId, media, refreshMedia, has } = useDraft();
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [pending, start] = useTransition();
  const load = useCallback(async () => {
    const r = await listTracksAction(weddingId);
    if (r.ok) setTracks(r.data as Track[]);
    else toast.error(r.error.message);
    await refreshMedia();
  }, [weddingId, refreshMedia]);
  useEffect(() => void load(), [load]);

  const call = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, msg?: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (msg) toast.success(msg);
        await load();
      } else toast.error(r.error?.message ?? "That did not work.");
    });

  const add = (row: MediaRow) => {
    setPicking(false);
    const guess = row.filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    call(() => saveTrackAction(weddingId, { assetId: row.id, title: guess || "Our song", inPlaylist: false }), "Song added");
  };

  return (
    <div className="space-y-6">
      <FormCard title="Background music" description="Guests hear the main song after they tap ‘Open with music’ — browsers never allow music to start by itself, so it always begins with a deliberate tap." actions={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setPicking(true)}>Add a song</Button>}>
        {tracks === null ? (
          <p className="text-muted">Loading…</p>
        ) : tracks.length === 0 ? (
          <EmptyState mark="♪" title="No music yet" body="Upload an MP3, M4A or WAV of a song you love. Instrumental tracks work beautifully." action={<Button variant="quiet" onClick={() => setPicking(true)}>Choose a song</Button>} />
        ) : (
          <ul className="divide-y divide-rule rounded-md border border-rule">
            {tracks.map((t, i) => {
              const m = media[t.assetId];
              return (
                <li key={t.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-paper-2 text-muted"><Music className="size-4" /></span>
                    <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                      <TextField label="Title" value={t.title} onChange={(e) => setTracks((s) => s!.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} onBlur={() => call(() => saveTrackAction(weddingId, { id: t.id, title: t.title, artist: t.artist, isPrimary: t.isPrimary, inPlaylist: t.inPlaylist }))} />
                      <TextField label="Artist" value={t.artist} onChange={(e) => setTracks((s) => s!.map((x, j) => (j === i ? { ...x, artist: e.target.value } : x)))} onBlur={() => call(() => saveTrackAction(weddingId, { id: t.id, title: t.title, artist: t.artist, isPrimary: t.isPrimary, inPlaylist: t.inPlaylist }))} />
                    </div>
                    <Button variant="ghost" size="sm" className="text-bad" icon={<Trash2 className="size-4" />} aria-label="Remove song" onClick={() => call(() => deleteTrackAction(weddingId, t.id), "Removed")} />
                  </div>
                  {m && <audio controls preload="none" src={m.url} className="h-10 w-full" />}
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <label className="flex cursor-pointer items-center gap-2 text-[14px]"><input type="radio" name="primary" className="size-4 accent-[var(--accent)]" checked={t.isPrimary} onChange={() => call(() => saveTrackAction(weddingId, { id: t.id, title: t.title, artist: t.artist, isPrimary: true, inPlaylist: t.inPlaylist }), "Main song changed")} />Main song (plays first)</label>
                    <Switch label="Also in the couple’s playlist" checked={t.inPlaylist} onChange={(v) => call(() => saveTrackAction(weddingId, { id: t.id, title: t.title, artist: t.artist, isPrimary: t.isPrimary, inPlaylist: v }))} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {pending && <p className="text-[13px] text-muted">Saving…</p>}
      </FormCard>
      {!has("music") && <Hint>Music is part of every package — if you can’t add songs, ask the platform owner to enable it.</Hint>}
      <Sheet open={picking} onClose={() => setPicking(false)} title="Choose a song" description="Upload MP3, M4A, WAV or OGG. Only songs you have the right to use should be uploaded." wide>
        <MediaLibrary weddingId={weddingId} mode="pick" kinds={["AUDIO"]} categories={["MUSIC"]} defaultCategory="MUSIC" onPick={add} />
      </Sheet>
    </div>
  );
}
