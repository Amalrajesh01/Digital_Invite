import data from "./generated.json";

/**
 * Images produced from the baptism prompts (`images.ts`) and brought in with `npm run baptism:ingest`. Empty until someone does:
 * nothing in this repository can generate an image. Each entry records where the picture came from, so that a reviewer can always see
 * what made it, and when; the file itself is `assets/stock/<id>.jpg`, exactly like a licensed photograph.
 */
export interface GeneratedImage {
  alt: string;
  focal?: { x: number; y: number };
  /** The service or person that made it — never left blank. */
  tool: string;
  model?: string;
  /** ISO date it was made or ingested. */
  date: string;
  /** SHA-256 of the prompt it was made from, so that a changed prompt shows up as a stale image. */
  promptSha: string;
  width: number;
  height: number;
  /** A person has looked at it in the real template at phone size. */
  reviewed: boolean;
}

export const GENERATED = data as Record<string, GeneratedImage>;
