import tracks from "./tracks.json";

/**
 * The bundled music library: instrumental tracks with a verified licence that Super Admin and customers can pick from
 * without uploading anything. `tracks.json` is written by `scripts/dev/music-fetch.mjs` (the catalogue of record: licence,
 * attribution, duration); this file adds the vocabulary and the lookups.
 *
 * A picked track is *copied* into the invitation's own media (see `service.ts`) so it plays through exactly the same
 * pipeline as a customer's upload and survives any later change to this library.
 */
export const MUSIC_CATEGORIES = [
  { key: "soft-piano", label: "Soft romantic piano", blurb: "A single piano, unhurried." },
  { key: "piano-strings", label: "Emotional piano & strings", blurb: "Piano with a string bed that swells." },
  { key: "acoustic", label: "Gentle acoustic romance", blurb: "Guitars and woodwinds, warm and close." },
  { key: "orchestral", label: "Cinematic orchestral romance", blurb: "Full orchestra, stately and moving." },
  { key: "ambience", label: "Elegant instrumental ambience", blurb: "Soft pads that sit behind the words." },
  { key: "dreamlike", label: "Dreamlike ambient", blurb: "Weightless, glittering and slow." },
  { key: "classical-strings", label: "Classical string arrangement", blurb: "The repertoire, played by strings." },
  { key: "guitar", label: "Romantic guitar", blurb: "A quiet serenade." },
  { key: "harp", label: "Gentle harp", blurb: "Harps, light as air." },
  { key: "editorial", label: "Luxury editorial ambience", blurb: "Hotel-lobby cool; a magazine soundtrack." },
  { key: "golden-hour", label: "Warm golden-hour", blurb: "Sunlit and kind." },
  { key: "vintage", label: "Vintage-inspired", blurb: "Ballroom, waltz and old film." },
  { key: "minimal-piano", label: "Minimalist piano", blurb: "Few notes, all of them chosen." },
  { key: "dramatic", label: "Dramatic cinematic", blurb: "Large, slow and theatrical." },
  { key: "nature", label: "Peaceful nature ambience", blurb: "Open air and morning light." },
  { key: "celebration", label: "Elegant celebration", blurb: "A toast, not a party." },
  { key: "spiritual", label: "Spiritual & meditative", blurb: "Calm and reverent, tied to no faith." },
  { key: "contemporary", label: "Contemporary romantic", blurb: "A modern love song without words." },
  { key: "religious", label: "Religious wedding music", blurb: "Music of a specific faith’s wedding service.", pending: "Each track is added only after its tradition, identity and licence have been checked with the family or community it belongs to." },
  { key: "ceremonial", label: "Traditional ceremonial music", blurb: "Music that belongs to a custom or rite.", pending: "Each track is added only after its tradition, identity and licence have been checked with the family or community it belongs to." },
] as const;
export type MusicCategory = (typeof MUSIC_CATEGORIES)[number]["key"];

export interface LibraryTrack {
  id: string;
  title: string;
  category: MusicCategory;
  moods: string[];
  seconds: number;
  bytes: number;
  /** File name in assets/music/. */
  file: string;
  composer: string;
  source: string;
  isrc: string | null;
  licence: { name: string; url: string; attribution: boolean };
  instruments: string;
  shortened: boolean;
  originalSeconds: number;
  /** One line for a customer. */
  note: string;
}

export const MUSIC_LIBRARY = tracks as LibraryTrack[];
export const MUSIC_ID = /^[a-z0-9-]{3,40}$/;

export const libraryTrack = (id: string): LibraryTrack | undefined => (MUSIC_ID.test(id) ? MUSIC_LIBRARY.find((t) => t.id === id) : undefined);
export const categoryLabel = (key: string) => MUSIC_CATEGORIES.find((c) => c.key === key)?.label ?? key;
export const MUSIC_MOODS = [...new Set(MUSIC_LIBRARY.flatMap((t) => t.moods))].sort();

/** The credit line the licence asks for. It travels with the song as its “artist”, so the invitation's player shows it. */
export function attribution(t: LibraryTrack): string {
  return `${t.composer} (incompetech.com) · CC BY 4.0`;
}

/** Search by title/instrument/note, and filter by category and mood. Empty filters match everything. */
export function searchLibrary(opts: { q?: string; category?: string; mood?: string } = {}): LibraryTrack[] {
  const q = (opts.q ?? "").trim().toLowerCase();
  return MUSIC_LIBRARY.filter((t) => (!opts.category || t.category === opts.category) && (!opts.mood || t.moods.includes(opts.mood))
    && (!q || `${t.title} ${t.instruments} ${t.note} ${categoryLabel(t.category)} ${t.moods.join(" ")}`.toLowerCase().includes(q)));
}
