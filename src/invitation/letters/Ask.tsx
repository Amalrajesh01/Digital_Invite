"use client";
import { useRef, useState } from "react";
import type { AskChoice, Beat as B } from "@/domain/letters/types";
import { cn } from "@/lib/cn";
import { useFL } from "./runtime";
import { Beat, Btn, Eyebrow, Head, Heart, Para, Quiet } from "./parts";

type Ask = Extract<B, { type: "ask" }>;

/** Where a playful “No” hops to. Transforms only, inside a box of fixed height, so nothing around it ever moves. */
const HOPS: [string, string][] = [["-44%", "-8px"], ["44%", "8px"], ["-18%", "-12px"]];

/**
 * The question, and the answers. Three rules hold everywhere: every question can be declined, in plain words, at once; nothing is
 * sent without a tap on a button that says what it does; and the person asked is told, before they answer, where the answer goes.
 * The playful moving “No” exists only where the sender switched it on and the experience is a lighthearted invitation — and even then
 * it gives up after three hops, and an ordinary “No, thank you” sits beneath it the whole time.
 */
export function AskBeat({ b }: { b: Ask }) {
  const fl = useFL();
  const [phase, setPhase] = useState<"ask" | "alt" | "sending" | "done" | "error">("ask");
  const [chosen, setChosen] = useState<AskChoice | null>(null);
  const [note, setNote] = useState("");
  const [when, setWhen] = useState("");
  const [hops, setHops] = useState(0);
  const mode = fl.reply.mode;
  const last = fl.index >= fl.total - 1;
  const sender = fl.names.anonymous ? (fl.ui === "ml" ? "അയച്ചയാൾ" : "the sender") : fl.names.sign;
  const labelOf = (c: AskChoice) => fl.txt(c.label);
  const playful = !!b.playful && fl.reply.playfulNo && !fl.reduced && mode !== "off";

  const send = async (c: AskChoice, extra: { when?: string } = {}) => {
    setChosen(c);
    setPhase("sending");
    const out = await fl.reply.send({ choice: c.key, label: labelOf(c), note: note.trim() || undefined, when: (extra.when ?? when).trim() || undefined, answers: fl.reply.shareAnswers ? fl.answers.all() : undefined });
    setPhase(out === "error" ? "error" : "done");
  };
  const pick = (c: AskChoice) => {
    if (c.kind === "alt") { setChosen(c); setPhase("alt"); return; }
    void send(c);
  };
  const wa = (c: AskChoice) => {
    const body = [labelOf(c), when.trim() && `(${when.trim()})`, note.trim() && `— ${note.trim()}`].filter(Boolean).join(" ");
    return `https://wa.me/${fl.reply.whatsapp}?text=${encodeURIComponent(body)}`;
  };

  const tell = mode === "collect" ? (fl.mode === "live" ? fl.s("replyPrivate", { name: sender }) : fl.s("replyPreview")) : mode === "whatsapp" ? fl.s("replyWhatsapp", { name: sender }) : fl.s("replyNone");

  if (phase === "done" && chosen) {
    return (
      <Beat className="fl-ask fl-ask-done" kind="ask">
        <Heart className="fl-ask-heart" />
        <Head>{chosen.kind === "yes" ? fl.s("yesDone") : chosen.kind === "no" ? fl.s("noGone") : fl.s("sent")}</Head>
        <Para>{fl.mode === "live" ? fl.s("sentBody", { name: sender }) : fl.s("replyPreview")}</Para>
        {!last && <div className="fl-after"><Btn onClick={fl.next}>{fl.s("continue")}</Btn></div>}
      </Beat>
    );
  }

  return (
    <Beat className="fl-ask" kind="ask">
      <Eyebrow>{fl.txt(b.sub)}</Eyebrow>
      <Head>{fl.txt(b.question)}</Head>
      {mode === "off" ? (
        <>
          <Para className="fl-note">{tell}</Para>
          {!last && <div className="fl-after"><Btn onClick={fl.next}>{fl.s("continue")}</Btn></div>}
        </>
      ) : phase === "alt" && chosen ? (
        <form className="fl-form" onSubmit={(e) => { e.preventDefault(); if (mode === "collect") void send(chosen); }}>
          <label>{fl.s("whenLabel")}<input value={when} onChange={(e) => setWhen(e.target.value)} maxLength={120} autoComplete="off" /></label>
          <label>{fl.s("noteLabel")}<textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} /></label>
          <div className="fl-after">
            {mode === "collect" ? <Btn type="submit">{fl.s("sendAnswer")}</Btn> : <a className="fl-btn" href={wa(chosen)} target="_blank" rel="noopener noreferrer" onClick={() => setPhase("done")}>{fl.s("sendAnswer")}</a>}
            <Quiet onClick={() => setPhase("ask")}>{fl.s("back")}</Quiet>
          </div>
        </form>
      ) : (
        <>
          <ul className="fl-answers">
            {b.choices.map((c) => (
              <li key={c.key}>
                {c.kind === "no" && playful ? (
                  <DodgeNo label={labelOf(c)} hops={hops} onHop={() => setHops((n) => n + 1)} onPick={() => (mode === "collect" ? pick(c) : setPhase("done"))} chosen={() => setChosen(c)} />
                ) : mode === "whatsapp" ? (
                  <a className={cn("fl-answer", `fl-answer-${c.kind}`)} href={wa(c)} target="_blank" rel="noopener noreferrer" onClick={() => { setChosen(c); setPhase("done"); }}>{labelOf(c)}</a>
                ) : (
                  <button type="button" disabled={phase === "sending"} className={cn("fl-answer", `fl-answer-${c.kind}`)} onClick={() => pick(c)}>{labelOf(c)}</button>
                )}
              </li>
            ))}
          </ul>
          {playful && b.choices.some((c) => c.kind === "no") && (
            <p className="fl-hop-note" role="status">{hops > 0 && <>{fl.s("noHops")} </>}<button type="button" className="fl-link" onClick={() => { const c = b.choices.find((x) => x.kind === "no")!; if (mode === "collect") pick(c); else { setChosen(c); setPhase("done"); } }}>{fl.s("noThanksSoft")}</button></p>
          )}
          {(b.open || mode === "collect" || mode === "whatsapp") && (
            <details className="fl-details">
              <summary>{fl.s("noteLabel")}</summary>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} aria-label={fl.s("noteLabel")} />
            </details>
          )}
          <p className="fl-note">{tell}</p>
          {phase === "error" && <p role="alert" className="fl-error">{fl.s("sentError")}</p>}
          {phase === "sending" && <p className="fl-note" role="status">{fl.s("sending")}</p>}
        </>
      )}
    </Beat>
  );
}

/** A decorative “No” that hops out of the way — pointer only, three times at most, and never the only way to decline. */
function DodgeNo({ label, hops, onHop, onPick, chosen }: { label: string; hops: number; onHop: () => void; onPick: () => void; chosen: () => void }) {
  const [x, y] = hops > 0 && hops <= HOPS.length ? HOPS[hops - 1] : ["0", "0"];
  const skipClick = useRef(false);
  const dodge = () => { if (hops < HOPS.length) onHop(); };
  return (
    <div className="fl-dodge" aria-live="off">
      <button type="button" className="fl-answer fl-answer-no fl-dodger" style={{ transform: `translate(${x}, ${y})` }} onPointerEnter={(e) => { if (e.pointerType === "mouse") dodge(); }} onPointerDown={(e) => { if (e.pointerType !== "mouse" && hops < HOPS.length) { skipClick.current = true; dodge(); } }} onClick={() => { if (skipClick.current) { skipClick.current = false; return; } chosen(); onPick(); }}>{label}</button>
    </div>
  );
}
