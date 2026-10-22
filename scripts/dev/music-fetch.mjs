// Builds the bundled music library: downloads each track from Kevin MacLeod's incompetech catalogue (CC BY 4.0),
// shortens it to a loop-friendly length with a fade in and out, encodes a small MP3 into assets/music/ and writes
// src/domain/music/tracks.json (the catalogue of record: licence, attribution, duration, category, mood).
//   FFMPEG=/path/ffmpeg FFPROBE=/path/ffprobe node scripts/dev/music-fetch.mjs [--only=slug,slug]
// Nothing here is scraped: pieces.json is the catalogue the author publishes for exactly this purpose
// (https://incompetech.com/llms.txt). Tracks are chosen from the catalogue's own instrument / feel / description
// fields — they were not auditioned by the script, so a human should listen before a track is promoted.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";

const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE ?? "ffprobe";
const MAX_SECONDS = 140;
const ROOT = "https://incompetech.com/music/royalty-free";
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");

/** [slug, catalogue title, category, moods, what a customer should know] */
const PICKS = [
  ["there-is-romance", "There is Romance", "soft-piano", ["tender", "romantic"], "A slow solo piano; the quietest way to open an invitation."],
  ["reawakening", "Reawakening", "soft-piano", ["intimate", "romantic"], "Piano and cello: a easy love theme, in the author's words “useful for quiet talks”."],
  ["immersed", "Immersed", "piano-strings", ["emotional", "contemplative"], "Minimal piano with a slow string bed that swells."],
  ["eternal-hope", "Eternal Hope", "piano-strings", ["hopeful", "emotional"], "A building, hopeful piano with strings and horn."],
  ["simple-duet", "Simple Duet", "piano-strings", ["optimistic", "tender"], "Piano and violin, slow, optimistic and simple."],
  ["morning", "Morning", "acoustic", ["warm", "bright"], "Classical guitar, harp and flutes: a gentle daytime feel."],
  ["almost-bliss", "Almost Bliss", "acoustic", ["warm", "relaxed"], "Layered acoustic guitars, unhurried."],
  ["midnight-tale", "Midnight Tale", "guitar", ["romantic", "intimate"], "Guitar and lute, a quiet evening serenade."],
  ["evening", "Evening", "guitar", ["relaxed", "warm"], "Guitar, cello and oboe as the day goes down."],
  ["wholesome", "Wholesome", "golden-hour", ["warm", "golden"], "Cello, viola and marimba with a soft pulse; sunlit and kind."],
  ["inspired", "Inspired", "golden-hour", ["uplifting", "warm"], "A slowly rising guitar-led piece."],
  ["dreamer", "Dreamer", "contemporary", ["modern", "romantic"], "Piano with light percussion; a contemporary love song without words."],
  ["aretes", "Aretes", "contemporary", ["modern", "uplifting"], "Solo piano surrounded by rich, airy textures."],
  ["thaxted", "Thaxted (Holst)", "orchestral", ["regal", "grand"], "Holst's “Thaxted” theme for full orchestra; stately and warm."],
  ["bittersweet", "Bittersweet", "orchestral", ["emotional", "cinematic"], "Cello, piano and wordless choir; a film-score swell."],
  ["manor", "Manor", "ambience", ["elegant", "airy"], "Soft synthesised pads; calm, bright, unobtrusive."],
  ["cottages", "Cottages", "ambience", ["elegant", "serene"], "A warm, slow ambient bed."],
  ["airship-serenity", "Airship Serenity", "dreamlike", ["dreamy", "floating"], "Weightless ambient synthesiser."],
  ["frozen-star", "Frozen Star", "dreamlike", ["dreamy", "celestial"], "Harp, flutes and choir over odd, lilting chords."],
  ["frost-waltz", "Frost Waltz", "dreamlike", ["magical", "celestial"], "Celesta and glockenspiel in a slow, glittering waltz."],
  ["canon-in-d-major", "Canon in D Major", "classical-strings", ["classic", "romantic"], "Pachelbel's Canon for bass, violins and harp."],
  ["canon-two-harps", "Canon in D for Two Harps", "harp", ["gentle", "classic"], "Pachelbel's Canon on two concert harps."],
  ["skye-cuillin", "Skye Cuillin", "harp", ["airy", "pastoral"], "Harp, whistle, fiddle and strings with a Celtic feel."],
  ["lobby-time", "Lobby Time", "editorial", ["chic", "cool"], "Vibraphone and piano with a soft groove: a quiet hotel lobby."],
  ["late-night-radio", "Late Night Radio", "editorial", ["chic", "slow"], "Electric piano and a laid-back beat."],
  ["crinoline-dreams", "Crinoline Dreams", "vintage", ["nostalgic", "romantic"], "Piano, violin and strings in an old-fashioned ballroom jazz style."],
  ["starting-out-waltz", "Starting Out Waltz Allegretto", "vintage", ["nostalgic", "gentle"], "A piano waltz, brushed drums and bass."],
  ["prelude-in-c", "Prelude in C (BWV 846)", "minimal-piano", ["minimal", "classic"], "Bach's Prelude in C, solo piano; clean and unhurried."],
  ["gymnopedie-1", "Gymnopedie No. 1", "minimal-piano", ["minimal", "contemplative"], "Satie's Gymnopédie No. 1, solo piano."],
  ["reign", "Reign", "dramatic", ["dramatic", "grand"], "A slow piano introduction that opens into a large, warm orchestral swell."],
  ["second-coming", "Second Coming - no percussion", "dramatic", ["epic", "cinematic"], "Orchestra only, no drums: an epic, rising fanfare."],
  ["northern-glade", "Northern Glade", "nature", ["serene", "airy"], "A bright, calm pad like morning light through trees."],
  ["farm", "Farm", "nature", ["serene", "pastoral"], "A slow, open ambient piece with a countryside feel."],
  ["poppers-and-prosecco", "Poppers and Prosecco", "celebration", ["celebratory", "chic"], "Trombone, piano and a light swing; a cocktail-hour toast."],
  ["carpe-diem", "Carpe Diem", "celebration", ["celebratory", "bright"], "Clarinet, ukulele, flute and guitar; light and cheerful."],
  ["heart-of-nowhere", "Heart of Nowhere", "spiritual", ["spiritual", "calm"], "Wordless choir over cellos. Not tied to any faith."],
  ["ascending-the-vale", "Ascending the Vale", "spiritual", ["spiritual", "pastoral"], "Harp, choir and flute. Not tied to any faith."],
];

const hms = (s) => s.split(":").reduce((a, v) => a * 60 + Number(v), 0);
const sh = (bin, args) => execFileSync(bin, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();

mkdirSync("assets/music", { recursive: true });
mkdirSync("src/domain/music", { recursive: true });
const pieces = await (await fetch(`${ROOT}/pieces.json`)).json();
const out = [];
for (const [slug, title, category, moods, note] of PICKS) {
  if (only && !only.includes(slug)) continue;
  const piece = pieces.find((p) => p.title === title);
  if (!piece) { console.error("NOT IN CATALOGUE:", title); process.exitCode = 1; continue; }
  const file = `assets/music/${slug}.mp3`;
  if (!existsSync(file)) {
    const res = await fetch(`${ROOT}/mp3-royaltyfree/${encodeURIComponent(piece.filename)}`);
    if (!res.ok) { console.error("DOWNLOAD FAILED:", title, res.status); process.exitCode = 1; continue; }
    const src = `${process.env.TEMP ?? "/tmp"}/mm-${slug}.mp3`;
    writeFileSync(src, Buffer.from(await res.arrayBuffer()));
    const full = hms(piece.length);
    const len = Math.min(full, MAX_SECONDS);
    const fadeOut = 3.5;
    sh(FFMPEG, ["-y", "-i", src, "-t", String(len), "-af", `afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, len - fadeOut)}:d=${fadeOut}`, "-ac", "2", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "64k", "-map_metadata", "-1", file]);
  }
  const seconds = Math.round(Number(sh(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).trim()));
  const full = hms(piece.length);
  out.push({
    id: slug, title, category, moods, seconds, bytes: statSync(file).size, file: `${slug}.mp3`,
    composer: "Kevin MacLeod", source: "https://incompetech.com/music/royalty-free/music.html", isrc: piece.isrc ?? null,
    licence: { name: "Creative Commons Attribution 4.0", url: "https://creativecommons.org/licenses/by/4.0/", attribution: true },
    instruments: piece.instruments ?? "", shortened: full > seconds + 2, originalSeconds: full, note,
  });
  console.log(slug.padEnd(22), `${seconds}s`.padStart(5), (statSync(file).size / 1024).toFixed(0).padStart(5) + " KB");
}
if (!only) writeFileSync("src/domain/music/tracks.json", JSON.stringify(out, null, 2) + "\n");
console.log(`${out.length} tracks`);
