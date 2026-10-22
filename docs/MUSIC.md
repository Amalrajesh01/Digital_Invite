# Music library

37 instrumental tracks in 18 categories, bundled in `assets/music/` (about 45 MB) and catalogued in
[`src/domain/music/tracks.json`](../src/domain/music/tracks.json). Super Admin and customers choose one in **Music →
Choose from the library**: search, filter by kind and mood, preview, then *Use as main song* or *Add*. A picked track is
**copied** into the invitation's own media (`src/domain/music/service.ts`), so it plays, is cleaned up and is moderated like any
upload and keeps working if this library changes. **No music** removes every song from an invitation. Audio never starts by
itself for a guest (browsers forbid it); guests tap *Open with music*.

## Licence — read this before adding or removing anything

Every track is by **Kevin MacLeod** ([incompetech.com](https://incompetech.com)) under **Creative Commons Attribution 4.0**.
That licence allows commercial use and adaptation *provided credit is given*. The credit travels with the song as its “artist”
(`Kevin MacLeod (incompetech.com) · CC BY 4.0`), so the invitation's own player shows it, and the picker shows it before you
choose. Tracks were **shortened to at most 140 seconds with a fade in and out** (flagged `shortened` in the catalogue) — an
adaptation the licence permits. Do not strip the credit.

The classical pieces (Bach, Satie, Pachelbel, Holst) are public-domain compositions; the *recordings* are Kevin MacLeod's, under
the same licence.

## What was and was not checked

* Tracks were chosen from the author's own catalogue fields (instruments, “feel”, description) and **not auditioned**. Listen
  before you promote one to a template's default.
* **Religious (18) and traditional ceremonial (19) categories are empty on purpose.** A track belongs there only after its
  tradition, identity, permitted use and licence have been checked with the family or community it belongs to. Do not file a
  generic instrumental under them. The two spiritual tracks are labelled *not tied to any faith*.
* A customer's religion is never inferred from their name, place or photographs; nothing selects religious music automatically.

## Adding a track

Add a row to `PICKS` in [`scripts/dev/music-fetch.mjs`](../scripts/dev/music-fetch.mjs) and run it
(`FFMPEG=… FFPROBE=… node scripts/dev/music-fetch.mjs`). It downloads from the published catalogue, trims, encodes a 64 kbps MP3
and rewrites `tracks.json`. For music from another source, add the file to `assets/music/` and an entry to `tracks.json` with its
real licence and attribution; `tests/music-library.test.ts` checks that every entry has a licence, a file that is really an MP3,
and a valid category.

The preview route is `/music/<id>` (byte ranges, immutable cache; only ids in the catalogue are served).
