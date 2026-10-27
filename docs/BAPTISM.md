# Baptism & christening — twenty templates

What was added, where it lives, how a family or the studio uses it, and what it honestly does not do. Written for whoever deploys it.

## What shipped

| | What | Where |
|---|---|---|
| **A category of its own** | `baptism` — an event type, a public category (“Baptism & christening”, under Faith & culture), its own page at `/templates/baptism`, a place in the footer, the home page and the template library. Nothing else was renamed; the wedding and Forever Letters categories, every existing URL and every published invitation are untouched. | `src/domain/doc/event-types.ts`, `src/domain/catalogue/categories.ts`, `src/app/(site)/templates/page.tsx`, `SiteFooter.tsx` |
| **Twenty templates** | Each with its own opening, hero scene, visual direction, palette, type pairing, pace, music suggestion and section order | `src/domain/design/template-specs-baptism.ts`, `themes-baptism.ts` |
| **Twenty drawn hero scenes** | One scene per template, in SVG and CSS: nothing is a photograph, nothing depicts a person, nothing needs a network request. A family’s photograph fills the frame the scene leaves for it | `src/invitation/sections/grace-art.tsx`, `GraceView.tsx`, `HeroGrace.tsx`, `hero-grace.css` |
| **Twenty sample invitations** | One family, one church, one verse, one voice each (fictional) | `scripts/demo/baptism.ts`, `src/domain/catalogue/baptism-samples.ts` |
| **Scripture, verified** | 22 verses of the King James Version (public domain), checked word for word against a published text | `src/domain/baptism/scripture.ts`, `npm run baptism:scripture` |
| **Image manifest, prompts and gate** | Every place a photograph can go, what belongs there, what is there now, a prompt for each | `src/domain/baptism/images.ts`, `check.ts`, [BAPTISM-IMAGES.md](BAPTISM-IMAGES.md), `npm run baptism:check` |
| **Ingest path** | The step after someone makes a picture from a prompt | `npm run baptism:ingest` |
| **Studio** | A verse picker and a family quick-add in the occasion editor; wording that fits a baptism | `src/components/admin/steps/BaptismCards.tsx`, `OccasionStep.tsx` |
| **Tests** | 13 new, plus the baptism samples joined to the shared sample tests | `tests/baptism.test.ts`, `tests/occasions.test.ts` |

No database migration. The only data change is twenty new built-in templates, twenty themes and twenty sample invitations.

## How it fits the platform

The baptism work follows the cinematic-wedding release (see [CINEMATIC.md](CINEMATIC.md)) and reuses what is already there rather than adding a parallel system:

* **Domain first.** The category, event type and template specs live in `src/domain`; nothing branches on a family’s name or church.
* **Features are data.** A baptism uses the occasion sections the platform already has — *about*, *people*, *message*, *prayer*, *ceremonies*, *events*, *venue*, *RSVP*, *guestbook*, the livestream and the memory book — arranged differently by each template. A family’s parents, grandparents and godparents are `occasion.people`, each under a heading of the family’s choosing; the verse is `occasion.prayer`. There is no new document field, so every existing tool (versions, translation, preview, publish, reports) works unchanged.
* **The occasion drives the opening.** A baptism has `celebration: "none"`: nothing falls or bursts when it opens. Each template’s own scene supplies the movement.
* **Photographs are named slots.** The scenes ask for the main picture (`couple` slot) like every other hero; nothing is hot-linked.
* **The sample invitations are rebuilt, not special-cased.** They go through the same `buildOccasionDoc` and seed pipeline as every other sample.

## The twenty templates

The flagship comes first, as it introduces the category. No two share a name, a palette, a hero scene or an arrangement of sections; at most two share an opening.

| # | Template | The idea | Opening · hero scene · direction | Sample (fictional) | Verse (KJV) |
|---|---|---|---|---|---|
| 20 | **A New Beginning** (flagship) | Night, a title sequence, doors open on dawn; doves rise and water ripples at the threshold | film title · doorway · cinematic | Elias Abraham, Pala | 2 Cor 5:17 |
| 1 | **Heavenly Grace** | Clouds, a ray of light and one white dove | swipe up · sky and dove · celestial | Anya Mariam, Kochi | Eph 2:8 |
| 2 | **A Blessing from Above** | One beam of light falls on the name; feathers drift down | spotlight · beam · cinematic | Nathan Varghese, Kottayam | Num 6:24–26 |
| 3 | **The Sacred Waters** | A drop, a ripple, a name on the water | tide · still water · coastal | Ezra Samuel, Chennai | Rom 6:4 |
| 4 | **Kerala Christian Heritage** | A kasavu-bordered arch, a lamp, a Nasrani cross; the elders named as the family names them | lamp · arch and church · royal | Maria Elizabeth, Thiruvalla | Ps 127:3 |
| 5 | **Little Prince of Grace** | A small crown and a night of stars: the first page of a storybook | monogram · crown and stars · storybook | Aaron Joseph, Pune | 1 Sam 1:27 |
| 6 | **Little Princess of Heaven** | A garland of tiny flowers around an arch, a crown, petals | curtain · flower garland · floral | Hannah Grace, Bengaluru | Ps 139:14 |
| 7 | **Generations of Faith** | A family chart drawn line by line; the grandparents’ letter opens first | envelope · family tree · vintage | Isaac George, Pala | Ps 145:4 |
| 8 | **The Church of Light** | The nave in the dark, arches receding to a lit window, candles | doors · the nave · noir | Elena Rose, Mumbai | John 8:12 |
| 9 | **White Dove Blessing** | A large dove with an olive branch glides across a pale sky | ink and wash · dove · coastal | Gabriel Joseph, Panaji | Matt 3:16 |
| 10 | **The Open Bible** | A book that glows on a dark lectern; the verse is the first thing read | storybook · open book · editorial | Daniel Abraham, Hyderabad (an eleven-year-old baptised by choice) | Ps 119:105 |
| 11 | **Floral Grace** | Lilies lean in from the edges of a pale page | bloom · lilies · fashion editorial | Liya Maria, Ernakulam | Matt 6:28 |
| 12 | **Golden Morning** | The sun rises over low hills | sunrise · sunrise · cinematic | Ethan Christopher, Munnar | Lam 3:22–23 |
| 13 | **Jesus and the Little Child** | Two open hands and a small flame — symbolic; no figure and no face is ever drawn | title card · open hands · watercolour | Immanuel David, Thrissur | Matt 19:14 |
| 14 | **A Garden of Blessings** | A trellis grows leaf by leaf, roses open, a butterfly crosses | cover · trellis · floral | Naomi Ann, Kozhikode | Ps 1:3 |
| 15 | **Royal Catholic Elegance** | A gold frame, a rayed cross, a wax seal | seal · gold frame · royal | Sebastian Xavier, Mangaluru | Matt 28:19 |
| 16 | **Modern Minimal Grace** | A circle that draws itself, a hairline cross | panels · circle and line · minimal | Noah Philip, New Delhi | Isa 43:1 (part) |
| 17 | **The Little Blessing** | Small footprints toward one small candle: a quiet invitation for a few people | none · footprints · storybook | Ivy Joseph, Thiruvananthapuram | Mark 10:16 |
| 18 | **Family in Faith** | Circles that gather round a name, for any family however it is made | swipe up · circles · editorial | Josiah Peter, Kolkata (a single mother, her parents, her brother) | Josh 24:15 (part) |
| 19 | **Celestial Promise** | Dusk after rain: the first stars and a soft bow of colour | constellation · dusk and a bow · celestial | Eden Abigail, Coimbatore | Gen 9:13 |

The full differentiation matrix (opening, hero, direction, motion, palette, tone, story, gallery, transition, music, mobile) is generated into [TEMPLATES.md](TEMPLATES.md).

The categories the samples cover — Syro-Malabar, Latin and Goan Catholic, Malankara Orthodox, Jacobite, Mar Thoma, CSI, CNI, Methodist and Baptist Union churches, in Kerala, Tamil Nadu, Karnataka, Goa, Maharashtra, Telangana, Delhi and West Bengal — are there to show the range, not to claim that any template belongs to one church. The words of every service, and which readings are used, are the family’s: the *ceremonies* in each sample are written the way that family’s church would say them, and are only starting points.

## Scripture

Every verse a template can quote is in `src/domain/baptism/scripture.ts`, in one named translation — the **King James Version, which is in the public domain** — word for word. They were checked against bible-api.com’s KJV text on 26 October 2026 and can be checked again at any time:

```bash
npm run baptism:scripture      # fetches each verse and compares it; fails if a single word differs (needs the internet)
```

* A verse printed on a sample is always taken from that list; a test fails if a sample quotes anything else.
* Where only part of a verse is quoted (Isaiah 43:1, Joshua 24:15, Jeremiah 1:5) the entry says `excerpt`, the words are a contiguous stretch of the verse, and a quotation that starts mid-sentence is opened with “…”. A closing colon in the KJV becomes a full stop.
* Each verse is shown with its reference and translation (“Psalm 127:3 · KJV”), in the app’s typography. **No verse is ever drawn into an image.**
* In the studio, **Choose a verse** fills the heading, the words and the reference; the family can instead type any verse in any translation or language. **We never alter or “verify” what a family types**, and we do not translate scripture — a second-language reading is the family’s to add.
* We have not paraphrased anything as a quotation, and we have not claimed a verse is “the” text for any church. A family whose church uses another translation (the Malayalam Bible, the Revised Version, the NRSV) should type theirs.

## Images — what is real and what is not

**Nothing in this repository can generate an image, and none has been generated.** No image service or key is configured. So:

* A template does not need a photograph to look finished: its hero is a drawn scene, and a family’s own portrait fills the frame beside it.
* Twelve samples show a bundled, licensed photograph that is genuinely about the subject — a Kerala parish church (Kerala Christian Heritage), a Gothic cathedral (Royal Catholic Elegance), a church window (The Church of Light), a lily (Floral Grace), a rose garden (A Garden of Blessings), a baby’s hand on a grandparent’s hand (Generations of Faith), a sunrise path (A New Beginning), a baby’s feet (Modern Minimal Grace, The Little Blessing), light through a forest (Golden Morning), a dawn valley (Celestial Promise) and an elder’s hand holding a younger hand (Family in Faith). They are stand-ins for the demonstrations only (Unsplash licence, credits in `assets/stock/CREDITS.md`); a customer’s own uploads are never constrained by them.
* Eight samples have no photograph at all, and show their drawn scene alone. **No wedding, birthday or unrelated picture is ever used to fill a gap.** `npm run baptism:check` rejects any picture whose description mentions a wedding or a couple, and any picture used by two templates.
* The people-and-places slots — parents, grandparents, godparents, the church, a detail of the day — are **empty in every sample**. The family, the godparents and the grandparents are introduced by name, with a monogram. A real family’s photographs go there.
* [BAPTISM-IMAGES.md](BAPTISM-IMAGES.md) (generated) lists all 120 slots (20 templates × 6), with, for each: what belongs there, the culture and setting, the style, the aspect ratio, the composition and focal point, how it crops, whether it is licensed or generated, whether it has been reviewed and approved (`approved` is the owner’s and is never set by code), and **a prompt written for that template and slot**: the scene, the Indian Christian setting, the people and their relationships, clothing that is neither bridal nor party wear, the light, the framing and the aspect ratio. Every prompt carries the standing instruction “no text, letters, logos or watermarks; no scripture or invitation wording in the image”.
* When someone makes a picture from a prompt: `npm run baptism:ingest -- <template> <slot> <file> --tool "<service>"` resizes and cleans it, saves it as `assets/stock/<id>.jpg`, records what made it (never left blank) and from which prompt in `src/domain/baptism/generated.json`, and — for a hero — makes it the sample’s photograph. A changed prompt marks its picture stale. Then re-seed the sample and look at it in the real template at phone size before setting `reviewed`.

## Family storytelling in the studio

Super Admin (or the customer, in their own studio) does everything without editing code or JSON:

1. **Pick a template** on `/templates/baptism` (or in the studio’s Template step). The first screen the family sees is the sample itself.
2. **The occasion step** — the child’s name (*Name of the child*), the line above and below it, who is hosting, the date. Optional: a portrait (it fills the frame the scene leaves; without it the scene opens the invitation), the child’s age, a short “about” text with facts at a glance.
3. **The family** — *+ Parents*, *+ Grandparents*, *+ Godparents* add the usual people in one tap; every heading and relation is the family’s to rewrite (“Appachan”, “Ammachi”, “Thatha”, “Nanu”, “Mama”), and each person can have a photograph and a line. A family with a single parent, or an uncle who helps raise the child, simply adds those people (see *Family in Faith*). **Anything left empty simply does not appear.**
4. **A message** — a letter from the parents or the grandparents.
5. **A verse or a prayer** — *Choose a verse*, or type your own, with its reference.
6. **Events** — the service (the church, date, time, dress) and, optionally, a reception or lunch at a second place, each with directions, parking and a map. The ceremony section starts with four ecumenical steps (welcome and prayer, the baptism, blessing of the family, a meal); rewrite them in the words of the church.
7. **Media, Music, Theme, Template** — upload or replace photographs (each keeps its own focal point and crop; replacing one never touches another invitation), choose music from the licensed library (it never plays by itself), recolour the theme.
8. **Edit** — hide, show or reorder sections in the visual editor; the template’s arrangement is the starting point, not a constraint.
9. **Preview** on phone, tablet and desktop, then **Publish**.

## Motion, performance and accessibility

* Every scene is **CSS-only motion on transform and opacity**; there is no animation library, no canvas and no video. Particles are placed by arithmetic (no `Math.random()`), so the server and the browser render the same page. A scene is a few dozen small elements at most.
* The scenes’ code and stylesheet (`HeroGrace`, `grace-art`, `hero-grace.css`) load only for an invitation that uses a baptism hero (`next/dynamic`); nobody else downloads them.
* Animation starts when the opening is dismissed and stops under `prefers-reduced-motion`; the **resting state of every layer is the finished picture** (the doors are open, the candles lit, the lines drawn), so a reduced-motion visitor sees the whole composition, still. Nothing flashes.
* Every scene is `aria-hidden`; the child’s name is the page’s only `h1`; the date, the place and the host are real text. Text sits on a calm area of its scene in each of the twenty (checked at phone size). Malayalam gets no letter-spacing or capitals.
* **No audio plays unless a guest asks.** Music comes from the existing licensed library only (CC BY 4.0 instrumentals; attribution is shown by the platform). Nothing original or commissioned has been added.

## Deploying it

```bash
ssh -i ~/.ssh/netjet_hetzner root@65.108.245.110 "REFRESH_LIBRARY=1 stackbridge-deploy"
```

`REFRESH_LIBRARY=1` adds the 20 templates and 20 themes (no migration) **and then creates every sample invitation the gallery needs and the server does not have yet** (the deploy script runs `SEED_ONLY=public-demos SEED_DEMO_CLIENTS=false npm run db:seed`). Without a sample, a template’s preview is a 404 — the phone on `/templates/baptism/<slug>` shows “This page could not be found”.

The sample invitations take a few minutes: each uploads its own photographs and a licensed track. If any cannot be made, the deploy still succeeds (the site is live), prints which ones, and says how to retry; running the same seed again is always safe.

How the seed behaves, because it was the cause of the 404 on the first deploy:

* **Samples never depend on Cloudinary.** The platform’s default for a new invitation is Cloudinary when it is configured; a seed run on a server whose Cloudinary credentials are wrong (“Invalid Signature”) stopped at the first sample with a photograph and left every other sample uncreated. Samples now keep their photographs on the app’s own store (`SEED_CLOUDINARY=1` restores the platform default), and `npm run cloudinary:migrate` can move them later.
* **A sample left half-made by an earlier run is made again**, instead of being skipped for ever as “already exists”.
* **One sample failing no longer stops the others;** the run reports the ones it could not make and exits non-zero.
* **A server that already has its Super Admin needs no `SEED_ADMIN_PASSWORD`** to seed samples.

The gallery thumbnails and the tall scrolling pictures are in `public/templates/` and `public/templates/tall/` and are committed; regenerate any of them with `npx tsx scripts/dev/tpl.mjs <slug> --thumbs --wait=6000` and `npx tsx scripts/dev/tall.mjs <slug>` (they need the samples seeded locally).

To change a sample after it exists: `npm run demo:drop -- <slug>` then `SEED_ONLY=public-demos npm run db:seed`.

## Honest limits

* **No image has been generated.** Prompts, a manifest, a checker and an ingest path exist; the pictures do not. Until they do, eight samples show only their drawn scene and every people-and-places slot is empty.
* **The twelve stand-in photographs are real photographs of real subjects** (a church, a flower, a baby’s feet…) used only for demonstration, and none shows a recognisable child’s or family’s face. They are not Indian Christian families, and no template pretends they are.
* **Scripture is checked, not translated.** Only the King James Version is offered; a family’s own wording is theirs. A Malayalam, Tamil or other reading is for the family to add.
* **The churches, services and words are samples.** A priest or pastor should read the ceremony text of the samples before a family adopts it: rites differ between and within denominations, and the starting wording is deliberately general.
* **Malayalam** chrome strings exist for the guest interface, as for every invitation, and have not been read by a native speaker; the hero scenes carry no text of their own beyond the family’s.
* **The scenes are checked visually at phone and desktop size**, in a real browser, by hand. There is no automated browser test suite.
* **Not done:** a new motion profile; per-template guest games; commissioned or original music; a “baptism” voice for the interface wording (the platform’s general ceremony wording is used); an RSVP wording of its own.
* Nothing here has been deployed.
