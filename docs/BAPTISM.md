# Baptism & christening — twenty-five templates, each a story about the baby

What was added, where it lives, how a family or the studio uses it, and what it honestly does not do. Written for whoever deploys it.

There are **twenty-five** designs. Twenty were built first (the category launched on 26 October 2026); the second release made the baby the centre of every one of them and added five more. See [What changed in the second release](#what-changed-in-the-second-release-the-baby-is-the-centre).

## What shipped

| | What | Where |
|---|---|---|
| **A category of its own** | `baptism` — an event type, a public category (“Baptism & christening”, under Faith & culture), its own page at `/templates/baptism`, a place in the footer, the home page and the template library. Nothing else was renamed; the wedding and Forever Letters categories, every existing URL and every published invitation are untouched. | `src/domain/doc/event-types.ts`, `src/domain/catalogue/categories.ts`, `src/app/(site)/templates/page.tsx`, `SiteFooter.tsx` |
| **Twenty-five templates** | Each with its own opening, hero scene, visual direction, palette, type pairing, pace, music suggestion, gallery layout and order of sections | `src/domain/design/template-specs-baptism.ts`, `themes-baptism.ts` |
| **Twenty-five drawn hero scenes** | One per template, in SVG and CSS. The child’s portrait is the largest thing on the first screen; the scene is drawn around it and stands alone when a family has not yet added one | `src/invitation/sections/grace-art.tsx`, `GraceView.tsx`, `HeroGrace.tsx`, `hero-grace.css` |
| **The baby’s story** | A portrait that opens each template, a second portrait beside “our little story”, a gallery told as chapters, the parents’ and grandparents’ photographs, the church | `src/domain/baptism/story.ts`, `photos.ts` |
| **A photograph pool** | 54 licensed photographs (babies, hands, feet, parents, grandparents, a baptism, a church), each with what it shows, the light, a focal point and its credit | `src/domain/baptism/photos.ts`, [BAPTISM-PHOTOS.md](BAPTISM-PHOTOS.md), `assets/stock/CREDITS.md` |
| **Twenty-five sample invitations** | One family, one church, one verse, one voice each (fictional) | `scripts/demo/baptism.ts`, `src/domain/catalogue/baptism-samples.ts` |
| **Scripture, verified** | 27 verses of the King James Version (public domain), checked word for word against a published text | `src/domain/baptism/scripture.ts`, `npm run baptism:scripture` |
| **Image manifest, prompts and gate** | Every place a photograph can go, what is there now, a prompt for each empty one, and the gate that fails the build when a rule is broken | `src/domain/baptism/images.ts`, `check.ts`, [BAPTISM-IMAGES.md](BAPTISM-IMAGES.md), `npm run baptism:check` |
| **Studio** | A verse picker and a family quick-add; photographs named for a baptism; a focal-point picker and in-place “Replace photo”; a “Sample” mark on every demonstration photograph; a choice of how the portrait arrives | `src/components/admin/steps/BaptismCards.tsx`, `OccasionStep.tsx`, `src/components/media/MediaLibrary.tsx`, `SectionPanel.tsx` |
| **Tests** | 13 for the category, 7 for the baby’s story, 4 for what a family does with a sample | `tests/baptism.test.ts`, `baptism-story.test.ts`, `baptism-customise.test.ts` |

One database change: **none** (no migration). The only data change is five new built-in templates and themes, five new samples, and a new section type (`finale`) that is added to the section list in code.

## What changed in the second release: the baby is the centre

The first release was a set of beautiful scenes with no baby in them: nothing could generate a photograph, so the heroes were drawn and a family’s picture was a small badge. The brief for the second was that every baptism invitation must celebrate the child, with relevant photography, a gallery, and animation that tells the story.

| | |
|---|---|
| **The portrait is the largest thing on the first screen** | Frames were 7–15 rem badges; they are now 55–72 % of the width of a phone, in each scene’s own shape (oval, arch, circle, doorway, nave window, wreath of roses, the crossing of a golden cross). Two scenes that had used the picture as a landscape strip (Golden Morning, Celestial Promise) now put the baby in the scene instead. |
| **A shared “reveal” for the portrait** | A soft glow gathers, the frame arrives, the photograph settles into it with a slow, small zoom, and a few motes of gold rise *beside* it. Four styles — heavenly glow, royal (a gold glow around the frame), floral (petals), minimal (a clean wipe) — each scene has its own default, and an invitation can choose another (Hero → Section → “How the portrait arrives”). Nothing is ever laid over the child’s face or body. |
| **Heaven’s Gate** | In *Heavenly Grace* two banks of cloud cover the scene, part to the sides and leave the portrait in the light. |
| **Parallax, restrained** | The portrait lifts a little faster than the words as the page scrolls; in *Cloud Nine* two layers of cloud drift at different speeds; in *White Roses* the wreath turns and opens as the page is scrolled. Browsers without scroll-driven animation simply skip it. |
| **A gallery in eight styles** | Cinematic vertical story, luxury editorial, royal frames, floating memory cards, floral frames, minimal grid, horizontal cinematic reel, magazine (plus the existing masonry, carousel, snapshots and film strip). Every template has its own; a gallery is five to eight pictures told as chapters — “Title — a line” — in the voice of the template, and a few motes of gold rise once as the story begins. |
| **A viewer worth opening** | The photograph zooms out of the thumbnail that was tapped (one uniform scale: nothing is stretched), a swipe or an arrow moves on, a swipe down or Esc closes, the next two photographs are fetched ahead, the page behind never moves and focus returns to the thumbnail. A photograph that cannot load shows a quiet placeholder, never a broken-image icon. |
| **Family photographs** | A photograph on the first person under a heading is shown as that group’s photograph (the parents together, the grandparents together). A second portrait sits in an arch above “our little story”. |
| **Golden scripture** | A fine line draws, the verse arrives line by line, then its reference, then a small cross drawn in — six templates use it. |
| **A blessing card** | “Send a blessing to {name}”: a gold card opens onto a form with four suggested blessings. It is the existing guestbook (moderated, shown on the wall, readable by the family), not a new store; from a preview nothing is sent and it says so. |
| **The grand finale** | A last section — the portrait in a glow with a few motes of gold, the name, a closing blessing, the day (when, where), *Add to calendar*, directions and *Reply*. It can be hidden, moved, reworded and restyled like any section. |
| **Candle of Faith** | A candle the guest *may* light: the flame appears, the page warms, a short blessing is revealed. The name, the day and the place are on the page whether or not it is lit; reduced motion shows it lit. |
| **Five more templates** | *Candle of Faith*, *White Roses*, *Little Miracle* (a nursery mobile), *The Golden Cross* (a line drawn once) and *Cloud Nine* — the directions of the brief that no existing template had. |

## How it fits the platform

The baptism work follows the cinematic-wedding release (see [CINEMATIC.md](CINEMATIC.md)) and reuses what is already there rather than adding a parallel system:

* **Domain first.** The category, event type, template specs, the photograph pool and the baby’s story live in `src/domain`; nothing branches on a family’s name or church.
* **Features are data.** A baptism uses the occasion sections the platform already has — *about*, *people*, *message*, *prayer*, *ceremonies*, *events*, *venue*, *RSVP*, *guestbook*, *gallery*, the livestream and the memory book — plus one new one, *finale*, arranged differently by each template. A family’s parents, grandparents and godparents are `occasion.people`; the verse is `occasion.prayer`. There is no new document field, so every existing tool (versions, translation, preview, publish, reports) works unchanged.
* **The occasion drives the opening.** A baptism has `celebration: "none"`: nothing falls or bursts when it opens. `portraitStory: true` in the registry is what lets “about” show the second portrait.
* **Photographs are named slots.** The hero asks for the main picture (`couple` slot); in a baptism the studio calls it “The baby’s portrait”. Replacing a photograph is one choice, and no component changes.
* **The sample invitations are rebuilt, not special-cased.** They go through the same `buildOccasionDoc` and seed pipeline as every other sample, and “create from template” copies their photographs into the family’s own library, marked as the sample’s.

## The twenty-five templates

The flagship comes first. No two share a name, a palette, a hero scene or an arrangement of sections; at most two share an opening. “Gallery” is the layout of its photographs; “Reveal” is how the portrait arrives.

| # | Template | The idea | Opening · hero scene · gallery · reveal | Sample (fictional) | Verse (KJV) |
|---|---|---|---|---|---|
| 20 | **A New Beginning** (flagship) | Night, a title sequence, doors open on dawn: the baby is in the doorway; doves rise beside it | film title · doorway · reel · heavenly | Elias Abraham, Pala | 2 Cor 5:17 |
| 1 | **Heavenly Grace** | Two banks of cloud part (*Heaven’s Gate*), a ray of light, one white dove | swipe up · sky and dove · floating cards · heavenly | Anya Mariam, Kochi | Eph 2:8 |
| 2 | **A Blessing from Above** | One beam of light falls on the portrait; feathers drift down | spotlight · beam · vertical story · heavenly | Nathan Varghese, Kottayam | Num 6:24–26 |
| 3 | **The Sacred Waters** | A drop, a ripple, a round portrait on the water | tide · still water · reel · heavenly | Ezra Samuel, Chennai | Rom 6:4 |
| 4 | **Kerala Christian Heritage** | A kasavu-bordered arch holds the family and the child; a lamp, a Nasrani cross | lamp · arch and church · gilded frames · royal | Maria Elizabeth, Thiruvalla | Ps 127:3 |
| 5 | **Little Prince of Grace** | A round portrait under a small crown and a night of stars | monogram · crown and stars · storybook pages · royal | Aaron Joseph, Pune | 1 Sam 1:27 |
| 6 | **Little Princess of Heaven** | An arched portrait in a garland of tiny flowers, a crown, petals | curtain · flower garland · floral frames · floral | Hannah Grace, Bengaluru | Ps 139:14 |
| 7 | **Generations of Faith** | An old photograph of the grandparents with a child; a family chart drawn line by line | envelope · family tree · snapshots · minimal | Isaac George, Pala | Ps 145:4 |
| 8 | **The Church of Light** | The child in a nave window, candles; gold frames on a dark wall | doors · the nave · gilded frames (night) · heavenly | Elena Rose, Mumbai | John 8:12 |
| 9 | **White Dove Blessing** | A dove with an olive branch glides above a round portrait | ink and wash · dove · minimal grid · heavenly | Gabriel Joseph, Panaji | Matt 3:16 |
| 10 | **The Open Bible** | An oval portrait above a book that glows; the verse is the first thing read | storybook · open book · editorial spreads · minimal | Daniel Abraham, Hyderabad | Ps 119:105 |
| 11 | **Floral Grace** | Lilies lean in from the edges, the portrait between them | bloom · lilies · floral frames · floral | Liya Maria, Ernakulam | Matt 6:28 |
| 12 | **Golden Morning** | The portrait rises as the sun rises over low hills | sunrise · sunrise · vertical story · heavenly | Ethan Christopher, Munnar | Lam 3:22–23 |
| 13 | **Jesus and the Little Child** | A soft portrait above two open hands and a small flame; no figure and no face is ever drawn | title card · open hands · floating cards · heavenly | Immanuel David, Thrissur | Matt 19:14 |
| 14 | **A Garden of Blessings** | An arched portrait under a rose trellis; a butterfly crosses | cover · trellis · floral frames · floral | Naomi Ann, Kozhikode | Ps 1:3 |
| 15 | **Royal Catholic Elegance** | A formal portrait in a gold arch; a seal, gilded frames on burgundy | seal · gold frame · gilded frames (night) · royal | Sebastian Xavier, Mangaluru | Matt 28:19 |
| 16 | **Modern Minimal Grace** | One photograph as a full-width band under the name; a circle that draws itself | panels · circle and line · minimal grid · minimal | Noah Philip, New Delhi | Isa 43:1 (part) |
| 17 | **The Little Blessing** | A small portrait among small footprints toward one small candle | none · footprints · minimal grid · minimal | Ivy Joseph, Thiruvananthapuram | Mark 10:16 |
| 18 | **Family in Faith** | A round portrait among circles that gather: any family, however it is made | swipe up · circles · magazine · minimal | Josiah Peter, Kolkata | Josh 24:15 (part) |
| 19 | **Celestial Promise** | A portrait under a bow of colour and the first stars | constellation · dusk and a bow · floating cards (night) · heavenly | Eden Abigail, Coimbatore | Gen 9:13 |
| 21 | **Candle of Faith** (new) | A candle the guest may light | none · a candle · vertical story (night) · heavenly | Caleb Mathew, Bengaluru | Matt 5:16 |
| 22 | **White Roses** (new) | A wreath of white roses that opens as you scroll | bloom · rose wreath · floral frames · floral | Rebecca Rose, Alappuzha | Isa 35:1 |
| 23 | **Little Miracle** (new) | A nursery mobile of pastel stars turning over the portrait | constellation · mobile · floating cards · heavenly | Miriam Joy, Visakhapatnam | Ps 118:23 |
| 24 | **The Golden Cross** (new) | Two fine lines of gold draw a cross; the portrait is set where they meet | monogram · cross · gilded frames · royal | Matthew Peter, Vasai | John 3:16 |
| 25 | **Cloud Nine** (new) | Layers of cloud drift behind a portrait that rests on a cloud | curtain · clouds · vertical story · heavenly | Luke Emmanuel, Shillong | Ps 36:5 |

The full differentiation matrix (opening, hero, direction, motion, palette, tone, story, gallery, transition, music, mobile) is generated into [TEMPLATES.md](TEMPLATES.md).

The categories the samples cover — Syro-Malabar, Latin, Goan, East Indian and Roman Catholic, Malankara Orthodox, Jacobite, Mar Thoma, CSI, CNI, Methodist and Baptist Union churches, in Kerala, Tamil Nadu, Karnataka, Goa, Maharashtra, Andhra Pradesh, Telangana, Meghalaya, Delhi and West Bengal — are there to show the range, not to claim that any template belongs to one church. The words of every service, and which readings are used, are the family’s: the *ceremonies* in each sample are written the way that family’s church would say them, and are only starting points.

## Photographs — what is real and what is not

**Every photograph in a sample is a licensed stand-in**, chosen so that the demonstration looks finished before a family has uploaded anything. They are real photographs of real people who are not the fictional families in the samples, exactly as for every other stock photograph on the platform, and they are credited in `assets/stock/CREDITS.md`; [BAPTISM-PHOTOS.md](BAPTISM-PHOTOS.md) lists each with what it shows, the light, who made it, its licence and where it is used.

* **Sources.** Wikimedia Commons (CC0 re-uploads of Pixabay and Unsplash photographs, plus a few CC BY and CC BY-SA ones) and the bundled Unsplash set. **CC BY-SA pictures must stay under the same licence** when resized; the credits say so. Unsplash and Pexels cannot be fetched automatically, so the pool is what Commons holds.
* **Selection** was by relevance (a baby, a baptism, a hand, a foot, a parent or grandparent holding a baby), photographic quality, licence and how well the light sits in a template’s palette. **It was not by skin tone**, and nobody’s face has been altered. Left out on purpose: recognisable public figures (including royal baptisms), museum catalogue photographs, anything with a wedding in it, a naked infant.
* **Weak spots.** There are few good open-licence photographs of grandparents holding a baby and none of godparents; those sections show a monogram unless a family adds a picture. The only baptism-in-progress picture is one water-pouring close-up. The pool is 54 photographs for 25 templates, so photographs are reused across galleries — never a hero, and never the same set twice.
* **The studio tells a sample from a family’s own.** “Create from template” copies the sample’s photographs into the invitation’s own library, marked as the sample’s: they carry a **Sample** mark in the Media library and on every photograph field, “Still the sample” counts the ones that remain, and **Replace photo** swaps one in place — the slot, the gallery position, the caption and the layout all stay. A **focal-point picker** (tap the face; the portrait, round and wide crops are shown live) keeps every crop on the face.
* **The prompts remain.** [BAPTISM-IMAGES.md](BAPTISM-IMAGES.md) (generated) lists all 150 slots (25 templates × 6) with a prompt written for that template and slot for the ones that are still empty — godparents, the church, a detail of the day — and `npm run baptism:ingest` brings a made picture in with its provenance. Nothing in this repository can generate an image, and none has been generated.

## Scripture

Every verse a template can quote is in `src/domain/baptism/scripture.ts`, in one named translation — the **King James Version, which is in the public domain** — word for word. All 27 were checked against bible-api.com’s KJV text on 27 October 2026 (0 differ) and can be checked again at any time:

```bash
npm run baptism:scripture      # fetches each verse and compares it; fails if a single word differs (needs the internet)
```

* A verse printed on a sample is always taken from that list; a test fails if a sample quotes anything else, and each template quotes a different one. Words written *around* a verse (a wish, a blessing, a caption) are the sample’s own and never put in a verse’s mouth.
* Where only part of a verse is quoted (Isaiah 43:1, Joshua 24:15, Jeremiah 1:5) the entry says `excerpt`, the words are a contiguous stretch of the verse, and a quotation that starts mid-sentence is opened with “…”.
* Each verse is shown with its reference and translation (“Psalm 127:3 · KJV”). **No verse is ever drawn into an image.**
* In the studio, **Choose a verse** fills the heading, the words and the reference; the family can instead type any verse in any translation or language. **We never alter or “verify” what a family types**, and we do not translate scripture. A family whose church uses another translation (the Malayalam Bible, the Revised Version, the NRSV) should type theirs.

## The family’s own story in the studio

Super Admin (or the customer, in their own studio) does everything without editing code or JSON:

1. **Pick a template** on `/templates/baptism` (or in the studio’s Template step). The first screen the family sees is the sample itself, with its baby, its gallery and its finale.
2. **The occasion step** — the child’s name, the line above and below it, who is hosting, the date; the child’s age; a short “about” text with facts at a glance.
3. **Media → Key photographs** — *The baby’s portrait* (the opening picture, the finale and the link preview), *“Our little story” photograph* (the second portrait), the family, the baptism and the church. Each can be replaced in one step.
4. **Media → Gallery albums** — the gallery’s photographs, their order (drag) and their captions: a caption is **“Title — a line”**, and the story layout sets the title large. Photographs are replaced from the Media library (**Replace photo…** keeps the place), cropped, rotated, and given a face position.
5. **The family** — *+ Parents*, *+ Grandparents*, *+ Godparents* add the usual people in one tap; every heading and relation is the family’s to rewrite, each person can have a photograph, and a photograph on the first person under a heading is that group’s photograph.
6. **A message and a verse** — a letter from the parents or the grandparents; *Choose a verse*, or type your own, with its reference.
7. **Events** — the service and, optionally, a reception, each with directions and a map; the ceremony section starts with four ecumenical steps to rewrite in the words of the church.
8. **Edit** — hide, show or reorder sections; choose each gallery’s and the finale’s layout; choose how the portrait arrives; reword the finale’s blessing (its “Introduction”). The template’s arrangement is the starting point, not a constraint.
9. **Music, Theme, Preview, Publish.**

## Motion, performance and accessibility

* Every scene is **CSS motion on transform, scale and opacity**; there is no animation library, no canvas and no video. Particles are placed by arithmetic (no `Math.random()`), so the server and the browser render the same page. A scene is a few dozen small elements at most. Scroll-driven effects use `animation-timeline` and are simply absent where it is not supported.
* The scenes’ code and stylesheet (`HeroGrace`, `grace-art`, `hero-grace.css`) load only for an invitation that uses a baptism hero (`next/dynamic`); the gallery layouts, the finale and the blessing card load with their sections.
* Animation starts when the opening is dismissed and stops under `prefers-reduced-motion`; the **resting state of every layer is the finished picture** (the doors are open, the clouds have parted, the candles lit, the lines drawn, the verse written), so a reduced-motion visitor sees the whole composition, still.
* Photographs are responsive WebP with a blur placeholder, lazy-loaded below the first screen, with their proportions reserved, so nothing jumps; the viewer fetches only the neighbours of the photograph on screen.
* Every scene is `aria-hidden`; the child’s name is the page’s only `h1`; the date, the place and the host are real text. The viewer is a native modal dialog (focus trapped and returned, Esc closes), has buttons as well as swipes, announces “3 of 7” and describes every photograph; the candle is a real button; the blessing card is a real form. Malayalam gets no letter-spacing or capitals.
* **No audio plays unless a guest asks.** Music comes from the existing licensed library only.

## Checking it

```bash
npm run baptism:check                      # the photograph gate: faces, licences, credits, distinct galleries (also in the test suite)
npm run baptism:photos                     # regenerate docs/BAPTISM-PHOTOS.md and the Commons block of assets/stock/CREDITS.md
npx vitest run tests/baptism.test.ts tests/baptism-story.test.ts tests/baptism-customise.test.ts
npx tsx scripts/dev/baptism-shots.mjs all --full      # every section of every template on a phone, with console, overflow and broken-image checks
npx tsx scripts/dev/baptism-flow.mjs all              # the viewer, the blessing card, the calendar file, the candle, long names, reduced motion (a dev server must be running)
```

## Deploying it

```bash
ssh -i ~/.ssh/netjet_hetzner root@65.108.245.110 "REFRESH_LIBRARY=1 stackbridge-deploy"
```

`REFRESH_LIBRARY=1` adds the new templates and themes (no migration) **and then creates every sample invitation the gallery needs and the server does not have yet** (the deploy script runs `SEED_ONLY=public-demos SEED_DEMO_CLIENTS=false npm run db:seed`). Without a sample, a template’s preview is a 404.

**The twenty samples that already exist on the server do not change by themselves** — a sample is created once. To give them the baby, the gallery and the finale, drop and re-seed them (each sample uploads about fifty photographs, so allow a few minutes):

```bash
for d in elias anya nathan ezra maria aaron hannah isaac elena gabriel daniel liya ethan immanuel naomi sebastian noah ivy josiah eden; do npm run demo:drop -- $d-baptism; done
SEED_ONLY=public-demos SEED_DEMO_CLIENTS=false npm run db:seed
```

How the seed behaves (it was the cause of the 404 on the first deploy): samples never depend on Cloudinary; a sample left half-made by an earlier run is made again; one sample failing no longer stops the others (the run reports which, and exits non-zero); a server that already has its Super Admin needs no `SEED_ADMIN_PASSWORD`.

The gallery thumbnails and the tall scrolling pictures are in `public/templates/` and `public/templates/tall/` and are committed; regenerate any of them with `npx tsx scripts/dev/tpl.mjs <slug> --thumbs --wait=6000` and `npx tsx scripts/dev/tall.mjs <slug>` (they need the samples seeded locally).

## Honest limits

* **No image has been generated.** The pictures are licensed photographs of people who are not the families in the samples; godparents and several detail and church slots have none and show their monogram or their drawn scene. A family’s own photographs replace all of them.
* **Skin tone.** The brief asked for fair-skinned people in the demonstration photography. Photographs were chosen for relevance, quality, licence and fit with a template’s palette, never by the skin tone of the people in them, and the set includes babies and families of several backgrounds. Anyone who wants a different look can change a photograph in one step.
* **Scripture is checked, not translated.** Only the King James Version is offered; a family’s own wording is theirs. A Malayalam, Tamil or other reading is for the family to add.
* **The churches, services and words are samples.** A priest or pastor should read the ceremony text of the samples before a family adopts it: rites differ between and within denominations, and the starting wording is deliberately general.
* **Malayalam** chrome strings exist for the guest interface, as for every invitation, and the new ones (the blessing card, the candle, gallery chapters, the finale) are a first draft that has not been read by a native speaker; the hero scenes carry no text of their own beyond the family’s, and the sample captions are English.
* **Animations the brief names that are only partly done.** The *dove* flies in and hovers, with no particle trail and no hand-over to a cross; *Heaven’s Gate* is a cloud veil inside the hero, after the swipe-up opening, not a separate opening; the *little miracle world* is the nursery mobile and its stars, not a scene that changes as the guest scrolls.
* **Performance numbers are from a development server.** A production build, an ordinary Android phone and a mobile connection have not been measured; see the final report for what was measured and where.
* **Browser tests are scripts, not CI.** The visual checks and the interaction checks run in a real browser by hand (`baptism-shots.mjs`, `baptism-flow.mjs`); the test suite covers the data, the gate and what a family does with a sample.
* Nothing here has been deployed.
