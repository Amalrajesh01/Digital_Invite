"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { TextField } from "@/components/ui/Field";
import { newId } from "@/lib/id";
import { FormCard, Grid, Hint, LText, ListEditor } from "@/components/admin/forms";
import { MediaField } from "@/components/admin/MediaField";
import { useDraft } from "@/components/admin/draft";

export function GamesSetup() {
  const { doc, update, has, media } = useDraft();
  const g = doc.games;
  const basic = has("games_basic");
  const adv = has("games_advanced");
  const [tab, setTab] = useState("trivia");
  const tabs = [
    ["trivia", "Couple quiz & trivia", basic || has("couple_extras")], ["bingo", "Wedding bingo", basic], ["wheel", "Prediction wheel", adv], ["scratch", "Scratch card", adv], ["fortune", "Fortune cookie", adv],
    ["diff", "Spot the difference", adv], ["song", "Guess the song", adv], ["crossword", "Crossword", adv], ["scavenger", "Scavenger hunt", has("scavenger_hunt")],
  ] as const;
  const boardRef = useRef<HTMLDivElement>(null);
  const bImg = g.findDiff.b ? media[g.findDiff.b] : undefined;

  return (
    <div className="space-y-5">
      <div role="tablist" className="flex flex-wrap gap-1.5">{tabs.filter((t) => t[2]).map(([k, l]) => (<button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("btn btn-sm", tab === k ? "btn-primary" : "btn-quiet")}>{l}</button>))}</div>

      {tab === "trivia" && (
        <FormCard title="Quiz questions" description="Used for ‘How well do you know us?’ Guests score 10 points per correct answer. Answers are checked on the server, so scores can’t be faked.">
          <ListEditor items={g.trivia.questions} onChange={(items) => update((d) => void (d.games.trivia.questions = items))} keyOf={(q) => q.id} title={(q) => q.q.en || "New question"} make={() => ({ id: newId(), q: {}, options: [{}, {}, {}, {}], answer: 0 }) as never} addLabel="Add a question" defaultOpen
            render={(q, _i, up) => (<><LText label="Question" required value={q.q} onChange={(v) => up({ q: v })} /><div className="space-y-3"><p className="text-[13.5px] font-medium text-ink-2">Answers — select the correct one</p>{q.options.map((o, oi) => (<div key={oi} className="flex items-start gap-3"><input type="radio" name={`correct-${q.id}`} aria-label={`Answer ${oi + 1} is correct`} className="mt-3 size-[18px] accent-[var(--accent)]" checked={q.answer === oi} onChange={() => up({ answer: oi })} /><div className="flex-1"><LText label={`Answer ${oi + 1}`} value={o} onChange={(v) => up({ options: q.options.map((x, j) => (j === oi ? v : x)) })} /></div></div>))}</div></>)} />
        </FormCard>
      )}

      {tab === "bingo" && (
        <FormCard title="Bingo squares" description="Nine squares make a 3×3 card; sixteen make 4×4. Guests tick moments they spot during the celebration.">
          <ListEditor items={g.bingo.squares} onChange={(items) => update((d) => void (d.games.bingo.squares = items))} keyOf={(s) => s.id} title={(s) => s.text.en || "Square"} make={() => ({ id: newId(), text: {} }) as never} addLabel="Add a square" max={25} defaultOpen render={(s, _i, up) => <LText label="What guests look for" value={s.text} onChange={(v) => up({ text: v })} />} />
          {![9, 16, 25].includes(g.bingo.squares.length) && <Hint>Use exactly 9, 16 or 25 squares for a complete card (you have {g.bingo.squares.length}).</Hint>}
        </FormCard>
      )}

      {(tab === "wheel" || tab === "scratch") && (
        <FormCard title={tab === "wheel" ? "Wheel prizes" : "Scratch-card prizes"} description="Chosen at random on the server. Each guest plays once — so they can’t keep spinning for a better result.">
          <ListEditor items={tab === "wheel" ? g.wheel.prizes : g.scratch.prizes} onChange={(items) => update((d) => void (tab === "wheel" ? (d.games.wheel.prizes = items) : (d.games.scratch.prizes = items)))} keyOf={(p) => p.id} title={(p) => p.label.en || "Prize"} make={() => ({ id: newId(), label: {}, detail: {} }) as never} addLabel="Add a prize" defaultOpen render={(p, _i, up) => (<><LText label="Prize" value={p.label} onChange={(v) => up({ label: v })} /><LText label="How to claim it" value={p.detail} onChange={(v) => up({ detail: v })} /></>)} />
        </FormCard>
      )}

      {tab === "fortune" && (
        <FormCard title="Fortune messages" description="Each guest cracks a cookie and gets one of these at random.">
          <ListEditor items={g.fortune.messages} onChange={(items) => update((d) => void (d.games.fortune.messages = items))} keyOf={(m) => m.id} title={(m) => m.text.en || "Message"} make={() => ({ id: newId(), text: {} }) as never} addLabel="Add a fortune" defaultOpen render={(m, _i, up) => <LText label="Fortune" value={m.text} onChange={(v) => up({ text: v })} />} />
        </FormCard>
      )}

      {tab === "diff" && (
        <FormCard title="Spot the difference" description="Upload two almost-identical pictures, then click the places on the second picture where they differ.">
          <Grid><MediaField label="Picture A (original)" value={g.findDiff.a} category="OTHER" onChange={(id) => update((d) => void (d.games.findDiff.a = id))} /><MediaField label="Picture B (with differences)" value={g.findDiff.b} category="OTHER" onChange={(id) => update((d) => void (d.games.findDiff.b = id))} /></Grid>
          {bImg && (
            <div>
              <p className="mb-2 text-[13.5px] font-medium text-ink-2">Click each difference on picture B ({g.findDiff.spots.length} marked)</p>
              <div ref={boardRef} className="relative cursor-crosshair overflow-hidden rounded-md border border-rule" onClick={(e) => { const r = boardRef.current!.getBoundingClientRect(); update((d) => void d.games.findDiff.spots.push({ id: newId(), x: Math.round(((e.clientX - r.left) / r.width) * 1000) / 10, y: Math.round(((e.clientY - r.top) / r.height) * 1000) / 10, r: 8 })); }}>
                <img src={bImg.url} alt="" className="w-full" />
                {g.findDiff.spots.map((s, i) => (<button key={s.id} type="button" aria-label={`Remove difference ${i + 1}`} onClick={(e) => { e.stopPropagation(); update((d) => void (d.games.findDiff.spots = d.games.findDiff.spots.filter((x) => x.id !== s.id))); }} className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-accent bg-accent/20 text-[11px] font-bold text-accent" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.r * 2}%`, aspectRatio: "1" }}>{i + 1}</button>))}
              </div>
              <p className="mt-2 text-[12.5px] text-muted">Click a numbered circle to remove it.</p>
            </div>
          )}
        </FormCard>
      )}

      {tab === "song" && (
        <FormCard title="Guess the song" description="Upload short clips (10–20 seconds) and offer three answers. Guests hear the clip and choose.">
          <ListEditor items={g.guessSong.rounds} onChange={(items) => update((d) => void (d.games.guessSong.rounds = items))} keyOf={(r) => r.id} title={(r) => r.clue.en || "Round"} make={() => ({ id: newId(), clue: {}, audio: undefined, options: [{}, {}, {}], answer: 0 }) as never} addLabel="Add a round" defaultOpen
            render={(r, _i, up) => (<><LText label="Question" value={r.clue} onChange={(v) => up({ clue: v })} placeholder="Which song is this?" /><MediaField label="Audio clip" kinds={["AUDIO"]} category="MUSIC" value={r.audio} onChange={(id) => up({ audio: id })} />{r.options.map((o, oi) => (<div key={oi} className="flex items-start gap-3"><input type="radio" name={`song-${r.id}`} aria-label={`Answer ${oi + 1} is correct`} className="mt-3 size-[18px] accent-[var(--accent)]" checked={r.answer === oi} onChange={() => up({ answer: oi })} /><div className="flex-1"><LText label={`Answer ${oi + 1}`} value={o} onChange={(v) => up({ options: r.options.map((x, j) => (j === oi ? v : x)) })} /></div></div>))}</>)} />
        </FormCard>
      )}

      {tab === "crossword" && (
        <FormCard title="Couple crossword" description="Add words and clues — the crossword grid is built automatically. Use letters only (A–Z).">
          <ListEditor items={g.crossword.words} onChange={(items) => update((d) => void (d.games.crossword.words = items))} keyOf={(w) => w.id} title={(w) => w.answer || "Word"} make={() => ({ id: newId(), answer: "", clue: {} }) as never} addLabel="Add a word" defaultOpen max={12}
            render={(w, _i, up) => (<><TextField label="Answer" value={w.answer} onChange={(e) => up({ answer: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} maxLength={14} /><LText label="Clue" value={w.clue} onChange={(v) => up({ clue: v })} /></>)} />
          <Hint>Words that share letters connect into the grid. Aim for 6–10 words, some with common letters such as A, S and M.</Hint>
        </FormCard>
      )}

      {tab === "scavenger" && (
        <FormCard title="Scavenger-hunt challenges" description="Guests tick the challenges they complete and submit their points. Encourage them to share the photos in the ‘Share your photos’ section.">
          <ListEditor items={g.scavenger.tasks} onChange={(items) => update((d) => void (d.games.scavenger.tasks = items))} keyOf={(t) => t.id} title={(t) => t.title.en || "Challenge"} make={() => ({ id: newId(), title: {}, hint: {}, points: 10 }) as never} addLabel="Add a challenge" defaultOpen
            render={(t, _i, up) => (<><LText label="Challenge" value={t.title} onChange={(v) => up({ title: v })} /><LText label="Hint (optional)" value={t.hint} onChange={(v) => up({ hint: v })} /><TextField label="Points" type="number" min={1} max={100} value={t.points} onChange={(e) => up({ points: Math.max(1, Math.min(100, Number(e.target.value) || 10)) })} className="w-32" /></>)} />
        </FormCard>
      )}
    </div>
  );
}
