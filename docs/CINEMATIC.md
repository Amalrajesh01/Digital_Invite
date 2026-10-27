# The cinematic wedding release

What was added, where it lives, how to turn it on, and what it honestly does not do. Written for whoever deploys it.

## What shipped

| | What | Where |
|---|---|---|
| **25 wedding templates** | Each with its own opening scene, hero composition, direction, palette, pace and section order, plus a sample invitation | `src/domain/design/template-specs-cinematic.ts`, `scripts/demo/cinematic.ts` |
| **Differentiation matrix** | Every template side by side (opening, hero, direction, motion, palette, tone, story, gallery, transition, music, mobile) | generated into [TEMPLATES.md](TEMPLATES.md) by `npm run docs:templates` |
| **12 new openings** | spotlight, marquee, monogram, constellation (interactive), storybook, leader, cover, ink, tide, panels, sunrise, titlecard | `src/invitation/opening/Scenes2.tsx`, `scenes2.css` |
| **13 new hero compositions** | cover, stage, triptych, night sky, postcard, window, wash, horizon, book, billboard, film frame, slab, stack | `src/invitation/sections/HeroMore.tsx`, `heroes2.css` |
| **8 new visual directions** | noir, couture, celestial, vintage, storybook, aquarelle, atelier, marine | `src/invitation/styles/directions.css`, `src/domain/design/directions.ts` |
| **3 motion profiles** | Elegant, Cinematic, Immersive — chosen per template, changeable per invitation | `src/invitation/styles/motion.css`, `doc.opening.motion` |
| **Music library** | 37 licensed instrumentals in 18 categories: search, mood filter, preview, “use as main song”, “no music” | [MUSIC.md](MUSIC.md) |
| **Live stream** | A first-class section: schedule, countdown, before / during / after states, replay, studio editor | `src/domain/live/stream.ts`, `LivestreamSection` |
| **Image manifest + gate** | Every photograph in every sample is assigned a part and checked | `src/domain/imagery/casting.ts`, `npm run images:check` |
| **Portfolio wall** | Admin-managed, consent-gated public “Our work”, a listing API and sitemap entries | `src/domain/portfolio/service.ts`, `/admin/portfolio`, `/portfolio` |
| **Template library on the home page** | The whole registry as a filterable grid of phones, four across. Every template card on the site (home, /templates, each occasion, For My Love, the studio's design picker) is a `Reel`: it slowly scrolls its own invitation and stops under the pointer. The long pictures come from `npx tsx scripts/dev/tall.mjs all` (needs the samples seeded locally; it also walks the five love gifts) and live in `public/templates/tall/` | `src/components/site/TemplateDiscovery.tsx`, `Reel.tsx`, `.reel` in `globals.css` |

The five original wedding designs and the two faith editions are untouched. Nothing was renamed in the database; the only schema change is one new table (`portfolio_items`, migration `0008`).

## Motion profiles

`doc.opening.motion` is `auto` (how every older invitation behaves), `elegant`, `cinematic` or `immersive`; a template sets it for the invitations made from it, and the editor can change it.

* **Elegant** — fades and a hair of lift; images fade instead of wiping; no parallax.
* **Cinematic** — weightier reveals and wipes; each section arrives like a new scene as it enters the screen.
* **Immersive** — all of that, plus scroll-linked depth: photographs settle as they arrive, the opening photograph drifts away as you leave it, diagonal image wipes.

Scroll-linked effects are CSS scroll-driven animations (opacity and transform only, no JavaScript). They apply only where the browser supports them and the guest has not asked for reduced motion; otherwise the ordinary reveals run. Nothing is hidden because an effect is missing. Every opening can be skipped and has a plain “Tap to open” button.

## Live stream

Enable the section, paste a link, set a start time (in the invitation's own time zone) and optionally an end time. YouTube and Vimeo play inside the invitation; Facebook, Zoom, Google Meet, Teams and anything else open in a new tab. Hostnames are matched exactly (`evilyoutube.com` is not YouTube), only `https` is accepted, and no player loads before the stream is due. Guests see a countdown before, the player (or a button) during, and a thank-you with an optional replay after. The platform never hosts video, and the passcode field is shown to everyone who opens the invitation, so it says so in the editor.

## Portfolio

Studio → **Portfolio**. An item is hidden until published; one that stands for a customer's real invitation cannot be published or previewed without that customer's consent being recorded (and how it was given). The visibility rule is one SQL predicate in `src/domain/portfolio/service.ts`, used by the pages, the API (`GET /api/public/portfolio`) and the sitemap, so a hidden item is absent from all three. The public side shows only what is written on the item and an approved cover — never names, dates, guests or anything else from the invitation. The live invitation is offered only when switched on, consented and itself published.

## Deploying it

```bash
git pull   # on the server: stackbridge-deploy does this for you
REFRESH_LIBRARY=1 stackbridge-deploy          # applies migration 0008 and adds the 25 templates and 25 themes
cd /home/deploy/apps/stackbridge-invites && set -a && . ./.env.production && set +a
SEED_ONLY=public-demos SEED_DEMO_CLIENTS=false npm run db:seed   # the 25 new sample invitations (skips any that exist)
```

Since the baptism release, `REFRESH_LIBRARY=1 stackbridge-deploy` also runs this seed for you (see [BAPTISM.md](BAPTISM.md)), and the seed no longer depends on Cloudinary — the cause of a template preview showing a 404 when the samples were not created. The sample invitations take a few minutes: each uploads its own photographs. The gallery thumbnails of the new templates are in `public/templates/` and are committed; regenerate any of them with `npx tsx scripts/dev/tpl.mjs <slug> --thumbs --wait=3000`.

## Honest limits

* **The photographs are stand-ins from the bundled licensed set.** Unsplash and Pexels refuse automated access, and no API key was available, so no new photography could be fetched. Every hero is unique across the 25 templates and chosen for its scene, but the set is small (about fifty usable couple and venue photographs) and it was not cast for skin tone, styling or retouching — they are real people standing in for fictional ones. Replace them with premium photography by dropping files into `assets/stock/`, adding them to `stock.ts` and `CREDITS.md`, and editing `casting.ts`; `npm run images:check` verifies the result.
* **The music was chosen from the author's catalogue notes, not auditioned.** Religious and ceremonial categories are empty on purpose until a track's tradition and licence are verified. See [MUSIC.md](MUSIC.md).
* **The two Instagram reference reels could not be watched** (login wall). The motion and openings are original, directed by the written brief only.
* **Malayalam** is complete for the new interface strings (live stream, the constellation hint) but has not been read by a native speaker.
* **The 25 templates are previewed and checked visually at phone size.** There is no automated browser test suite; screenshots were reviewed by hand.
* Nothing here has been deployed.
