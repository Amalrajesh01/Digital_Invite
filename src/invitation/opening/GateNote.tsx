"use client";

/**
 * What a guest reads first, above the envelope: "Dear Priya," and, in a card that is the most prominent thing on the screen,
 * the message the couple wrote for them (or the heartfelt one written for their relationship). Plain text only — it is rendered
 * as text, so nothing a couple types can become markup. Used by every opening style (Gate.tsx, Scenes2.tsx).
 */
export function GateNote({ dear, message, from }: { dear: string; message?: string; from?: string }) {
  return (
    <div className="gate-letter">
      <p className="gate-dear">{dear}</p>
      {message && (
        <figure className="gate-note">
          <span className="gate-note-orn" aria-hidden>❦</span>
          <blockquote>{message}</blockquote>
          {from && <figcaption>{from}</figcaption>}
        </figure>
      )}
    </div>
  );
}
