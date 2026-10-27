"use client";
import type { ReactNode } from "react";
import { Reveal, RevealWords } from "../engine/motion";
import { SCENES, type Scene } from "./grace-art";

/**
 * The twenty baptism heroes. Each variant (`gr-…`) is one drawn scene (`grace-art.tsx`) and a layout; the words around it are the same
 * for all of them and come from the invitation: the line above the name, the child's name, the line beneath it, the date and the place.
 * A family's photograph, when there is one, fills the frame the scene leaves for it; without one the scene stands alone and nothing
 * looks missing.
 */
export interface GraceViewProps {
  variant: string;
  eyebrow: string;
  name: string;
  size: string;
  phrase: string;
  date: string;
  place: string;
  hosts: string;
  photo?: ReactNode;
  cue?: ReactNode;
  /** Text is shown at once (the studio preview and the thumbnail tool) rather than revealed on scroll. */
  still?: boolean;
}

/** Pointed-arch outline shared by the doorway, the nave window and the gold plate. */
function Defs() {
  return (
    <svg width="0" height="0" className="gh-defs" aria-hidden focusable="false">
      <defs><clipPath id="gh-pointed" clipPathUnits="objectBoundingBox"><path d="M0 1 V0.44 C0 0.22 0.3 0.07 0.5 0 C0.7 0.07 1 0.22 1 0.44 V1 Z" /></clipPath></defs>
    </svg>
  );
}

/** A line that is revealed as it scrolls into view — or simply shown, for the studio preview and the thumbnail tool. */
function Line({ still, children }: { still?: boolean; children: ReactNode }) {
  return still ? <>{children}</> : <Reveal variant="fade">{children}</Reveal>;
}

export function GraceView({ variant, eyebrow, name, size, phrase, date, place, hosts, photo, cue, still }: GraceViewProps) {
  const scene: Scene = SCENES[variant] ?? SCENES["gr-heavenly"];
  const initial = (name.trim().match(/\p{L}/u)?.[0] ?? "").toUpperCase();
  return (
    <header data-section="hero" id="s-hero" className={`hv hv-grace ${variant}`} data-layout={scene.layout} data-photo={photo ? "1" : "0"}>
      <Defs />
      <div className="gh-scene" aria-hidden>{scene.back({ photo, initial })}</div>
      <div className="gh-stack inv-wrap">
        {scene.figure && <div className="gh-fig">{scene.figure({ photo, initial })}</div>}
        <div className="gh-text">
          {eyebrow && <Line still={still}><p className="gh-eyebrow">{eyebrow}</p></Line>}
          <h1 className="gh-name" data-len={size}>{still ? name : <RevealWords as="span" text={name} className="gh-nm" delay={260} />}</h1>
          {phrase && <Line still={still}><p className="gh-phrase">{phrase}</p></Line>}
          <Line still={still}>
            <div className="gh-meta">
              {date && <span className="inv-num gh-date">{date}</span>}
              {place && <span>{place}</span>}
              {hosts && <span className="gh-hosts">{hosts}</span>}
            </div>
          </Line>
        </div>
        {cue}
      </div>
    </header>
  );
}
