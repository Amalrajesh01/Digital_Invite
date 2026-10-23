# Forever Letters

_Little experiences for the person who means everything._ — Invites by Stack Bridge Labs.

Forever Letters is the new face of **For My Love**: fifty individually directed, interactive, personal experiences a person can make for someone they care about and send as one private link. They are not fifty colourings of one page. Each has its own opening, mechanics, palette, type, motion profile, photograph and ending — and the six that matter most (apologies, confessions, proposals, closure) keep their promises: nothing pressures, nothing plays by itself, and every question can be declined.

* The catalogue: [LETTERS.md](LETTERS.md) (generated) · the photographs: [LETTERS-IMAGES.md](LETTERS-IMAGES.md) (generated)
* Public pages: `/for-my-love` (the gallery) · `/for-my-love/letters/<slug>` (one experience, with a playable demonstration) · `/for-my-love/make?letter=<slug>` (make it)
* Studio: `/admin/letters` (switch any experience on or off in the public gallery)

## How it is built

An experience is **data**, played by one engine.

```
src/domain/letters/            types.ts  kit.ts  values.ts  index.ts  images.ts  describe.ts  service.ts  check.ts
src/domain/letters/specs/      a.ts … f.ts      the fifty, by chapter
src/invitation/letters/        Player.tsx  Gates.tsx  Text.tsx  Games.tsx  Story.tsx  Ask.tsx  runtime.tsx  strings.ts  *.css
src/components/site/letters/   LettersExplorer.tsx (strip, filters, grid, preview dialog)  LettersSection.tsx
src/components/gift/           ScenarioForm.tsx (the builder's form, drawn from the spec's own fields)
```

**A spec** (`LetterSpec`) holds: slug, title, purpose, the category and tags, the tone (`romantic · playful · emotional · dark`), a palette, a type pairing, one of five motion profiles (`elegant · cinematic · playful · immersive · dark`), a layout (`card · paper · full · film · editorial · phone · map`), an ambient effect, a backdrop photograph and its grade, the **fields** the sender fills in (text, long text, date, choice, toggle, photo, and lists of items) and an ordered list of **beats**.

**Beats** are the reusable interaction library. One opening (a *gate* — thirty-two drawn objects: an envelope, a candle, a record, a rain-streaked window…), then any of:

| Family | Beats |
|---|---|
| Words | `lines` (fade · type · chat · film · stack), `sections`, `letter` (chapters, optional voice), `reasons`, `closing` |
| Guessing | `clues` (with a guess), `quiz` (any number of rounds, hints, reveals, a collage) |
| Reveal | `flip`, `deck`, `envelopes`, `scratch` (with a plain button beside it), `tiles` (a picture uncovered square by square) |
| Puzzle | `order`, `match` |
| Romantic | `choose` (“which would you choose?”) + `suggest` (a plan picked from the sender's own options), `invite`, `song`, `media`, `promises`, `dreams` |
| Places and time | `timeline` (rail · cards · a time machine), `route`, `gallery` (a little museum), `countdown` (only for a real, upcoming date) |
| The answer | `ask` — the question, honest ways to answer, an optional note, an optional moving “No” |

A beat with nothing to show (no clues written, no date given) is skipped, never shown half empty.

**What the sender writes** is stored in the gift's document as `love.forever` — `scenario`, `v` (a string per field, or a list of items), `guards`, `playfulNo`, `replies` (`collect · whatsapp · off`), `shareAnswers`, `intensity`. It is a JSON document, so a new experience, a new field or a new game variation needs **no database change**. Photographs are the sender's own uploads (UUIDs checked against the gift); the bundled set only supplies mood and stands in for a couple in the public demonstrations.

**Where it plugs in:** a Forever Letter is an ordinary gift (`gifts` + a wedding row), so photographs, publishing, versions, the private maker link, pausing, deleting and the 14-day expiry all work unchanged. `LoveApp` routes `experience: "forever"` to `ForeverApp`, which hands the player the gift's words, photographs, soundtrack and public API. The same `ForeverPlayer` plays the public demonstrations (`/for-my-love/letter-demo/<slug>`, no database row, labelled “Demonstration — not a real letter”, nothing sent).

## Rules the code enforces

Checked by `npm run letters:check` and `tests/letters.test.ts`:

* **Dark is for closure only.** Experiences 49 and 50 (and no others) use the dark tone, dark palette and dark motion profile; they have no game, no question, no reply, no confetti, no countdown, and close in the dark.
* **The moving “No” is for lighthearted invitations only** (01, 03, 04), switched on by the sender, off by default, disabled for reduced motion; it hops at most three times and an ordinary “No, thank you” sits beneath it. Touch gets the same, by tap. It is never in an apology, a proposal or a closure.
* **Every question can be declined or deferred**, in plain words, at once.
* **Apologies stay calm:** no moving “No”, no celebration, no decoration beyond dust, music suggested only as silence or something restrained. A peace offering's sincere message comes *before* its lighthearted memory and must be written before the letter can be sent; an apology's “what I did”, “what I take responsibility for” and the apology itself are required.
* **Private by construction:** a place the sender keeps secret (the Mystery Date) is removed from the recipient's copy of the document on the server (`guards`) unless they switch “Reveal the place” on. “Guess who” only reveals a name when the sender says so.
* **Replies are consent-based:** the recipient is told where an answer goes *before* sending it; it is stored for the sender alone (read through their secret link), nothing notifies anyone, nothing repeats. Their answers along the way are kept only if the sender asked for them. A deleted gift takes its replies with it.
* **No unlicensed audio, no impersonation:** a song is only a link to a known music service (https, allow-listed host) or the sender's own uploaded recording; the voice reading of letter 19 needs the sender to confirm it is their own voice; the “almost-sent message” is a drawing, not a connection to any messaging account.
* **Accessibility:** every game is built from real buttons and has a plain way past it (scratch → “Or just reveal it”, match/order/tiles → “Just show me”, hold → “Or press Enter”); focus moves to each screen's heading; progress is announced; every animation is CSS and stops for reduced motion; a Malayalam sender gets Noto Sans Malayalam without letter-spacing or capitals.

## Images

Quality is a product requirement. `src/domain/letters/images.ts` is the manifest: 55 photographs, each with its original (in `assets/stock/`, credited in `assets/stock/CREDITS.md`), licence (Unsplash License, CC0, public domain, CC BY, CC BY-SA), author, description, focal point and a flag for photographs that show someone. `npm run letters:images` makes a 2:3 WebP crop of each into `public/letters/photos/`. `npm run letters:check` fails on: a missing, undersized or wrongly cropped file; a missing description; an unverified licence or credit; a duplicate; an unused or unknown backdrop; a missing gallery picture; and the experience rules above.

The gallery's pictures are made **from the experiences themselves**: `scripts/dev/letters-covers.mjs` photographs each opening (the cover) and up to six of its screens (the storyboard the gallery slowly scrolls), so a card can never show a design that does not exist. Re-run it after changing a spec or the CSS. `scripts/dev/letters.mjs` takes screenshots of any screens; `scripts/dev/letters-flow.mjs` plays every experience to its end like a recipient would and reports what stuck.

Adding a photograph: put the licensed original in `assets/stock/`, add its credit line to `CREDITS.md`, add an entry to `images.ts` (describe it; set the focal point and whether it shows people), run `npm run letters:images`. Adding an experience: write a spec in `specs/`, add it to its chapter's array, `npm run docs:letters`, `npm run letters:check`, then `node scripts/dev/letters-covers.mjs <slug>`.

## Data and endpoints

* Migration `0009_forever_letters`: `gift_replies` (one row per answer: choice, label, note, suggested time, optional answers, time; cascades with the gift) and `letter_settings` (the studio's on/off switch; no row means on).
* `POST /api/gift` accepts `{ scenario }` as well as `{ occasion }`; `PUT /api/gift/[id]` cleans the document against the scenario's own fields (unknown keys dropped, lengths limited, only the gift's own photographs kept, the scenario cannot be changed); `GET /api/gift/[id]` returns the experience and the answers to its maker.
* `POST /api/public/[slug]/letter-reply` stores an answer: published gifts only, the choice must be one the letter offered, collection must be on, rate-limited per letter and per address.

## Deploying

`stackbridge-deploy` as usual. The migration is applied by `npm run db:migrate`; there is no environment variable to set and the photographs are committed. Nothing needs `REFRESH_LIBRARY` — a Forever Letter reuses the existing plain-letter template and paper theme.

## Honest limits

* The photographs are licensed stand-ins (Unsplash and Wikimedia Commons) chosen for mood and checked by eye at phone size; they are not commissioned photography, and no image-generation service was available. Replace the backdrops in `images.ts` whenever better ones are licensed.
* The Malayalam for the fixed buttons and hints (`src/invitation/letters/strings.ts`) needs a native read. The *default framing lines* of each experience are English; a Malayalam sender rewrites them in the builder (they start filled in, and are theirs to change).
* The “hidden detail” puzzle of the brief is replaced by `tiles` (an image uncovered square by square), which has the same reveal without needing the sender to mark coordinates.
* No automated browser test runs in CI; `letters-flow.mjs` is a manual (but complete) walk-through.
