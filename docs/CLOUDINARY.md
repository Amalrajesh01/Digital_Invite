# Cloudinary — where invitation photographs live

Cloudinary stores and delivers the photographs of every invitation and every template's sample photographs. Phones get each
picture resized to the width they need, in the best format they support, from Cloudinary's CDN.

- [What goes where](#what-goes-where)
- [Set it up](#set-it-up)
- [How to test that it works](#how-to-test-that-it-works)
- [How it works](#how-it-works)
- [Moving existing photographs](#moving-existing-photographs-migration)
- [The invitations that are never moved](#the-invitations-that-are-never-moved)
- [Deploying](#deploying-to-the-server)
- [Usage, limits and monitoring](#usage-limits-and-monitoring)
- [Troubleshooting](#troubleshooting)

## What goes where

| Kind of file | Stored on | Why |
|---|---|---|
| A customer's photographs (cover, couple, gallery, events, backgrounds…) | **Cloudinary** | the point of this integration |
| A template's sample photographs (the demo invitations) | **Cloudinary**, under `templates/` | same |
| The public site's template pictures (`public/templates/*.webp`) | **Cloudinary**, listed in `src/domain/catalogue/cloud-thumbs.json`; the file in `public/` is the fallback | `npm run cloudinary:static` |
| Audio (music) and video | the app's own store (`STORAGE_DRIVER`: disk or S3/R2) | range requests, size limits and cost differ; not images |
| Photographs guests upload, time-capsule photographs | the app's own store | they stay private until a person approves them or the capsule opens, and Cloudinary links are public to anyone who has the address |
| Everything in a **gift** (“For My Love”) | the app's own store | a gift's photographs are private by design, signed per viewer, never cached by shared caches |
| Stock demo photographs (`assets/stock/`, `/stock/[id]`) and brand files | the repository | bundled, credited and cropped around a focal point by the route; unchanged |

Which store holds a photograph is recorded **per photograph** (`media_assets.provider`: `legacy` = the app's own store,
`cloudinary`), so both kinds coexist and an invitation can be moved one photograph at a time. Which store receives a *new*
photograph is recorded **per invitation** (`weddings.media_storage`):

| `media_storage` | Meaning |
|---|---|
| `cloudinary` | every invitation created from now on; new public photographs go to Cloudinary |
| `legacy` | the invitations that existed before Cloudinary; new photographs stay where its others are, until the migration tool moves them |
| `pinned` | a person decided its files must never be moved by anything |

The one rule that decides it is `wantsCloudinary()` in [`src/domain/media/cloud.ts`](../src/domain/media/cloud.ts).
If Cloudinary is not configured (no credentials), everything behaves exactly as before — that is also what happens if the app is
deployed before the credentials are added.

## Set it up

1. In Cloudinary: **Settings → API Keys** (or the “Product Environment Credentials” panel) gives the **Cloud name**, **API key** and
   **API secret**. The cloud name is also on the dashboard home.
2. Put them in the environment — never in code, never in a `NEXT_PUBLIC_` variable, never in git:

   | Where | How |
   |---|---|
   | Your computer | `.env.local` (git-ignored): `CLOUDINARY_CLOUD_NAME=…`, `CLOUDINARY_API_KEY=…`, `CLOUDINARY_API_SECRET=…` |
   | The server | the same three lines in `/home/deploy/apps/stackbridge-invites/.env.production` |
   | Vercel | Project → Settings → Environment Variables |

   Optional: `CLOUDINARY_FOLDER` (top-level folder, default `sbl-invites`), `CLOUDINARY_EXCLUDE_NAMES`,
   `CLOUDINARY_EXCLUDE_WEDDING_IDS` (extra protection for the migration, below).
3. Run `npm run cloudinary:check`. It prints the cloud name, the last four characters of the key (never the secret), the plan and
   how much of the month's allowance is used.

## How to test that it works

From quickest to most thorough. Every command prints ✔/✖ per check and exits non-zero on a failure.

| # | Command | What it proves | Touches |
|---|---|---|---|
| 1 | `npm run cloudinary:check` | the credentials are accepted; plan and usage | nothing |
| 2 | `npm run cloudinary:check -- --smoke` | a real upload, repeat-upload (no duplicate), delivery, resized delivery, byte-for-byte read-back, delete | one tiny test image, deleted |
| 3 | `npm run cloudinary:e2e` | the app's real code against the real account on a throwaway in-memory database: new invitation → upload → every size delivers → gallery of three → replace (new id, old released, others untouched) → signed-out upload refused → SVG refused → delete → nothing left behind | a few images, all deleted; your database is not used |
| 4 | `npm test` | 293 tests (Cloudinary is replaced by an in-memory fake with the same rules): placement rules, who may upload, replacing, template sharing, reference-checked deletion, the media route, the whole migration including failures, interruption, rollback and the protected invitations | nothing external |
| 5 | `node scripts/dev/cloud-shot.mjs <slug> [out.png] [--mobile]` (app running) | opens a public invitation, opens it, scrolls the whole story, and reports every image by host (Cloudinary vs this app), failures, and any `<img>` that did not render | nothing |

**By hand, in the studio** (about five minutes): sign in as the super admin → **New invitation** from any template → the invitation's
**Media** step → upload a photograph. Open the invitation (preview or public link) and look at the page's network tab: the image
requests go to `res.cloudinary.com/<your cloud>/image/upload/f_auto,q_auto,w_…`, one per size the phone needs. In the Cloudinary
dashboard → **Assets**, the file is under `sbl-invites/projects/<invitation id>/`. Now **replace** the photograph from the Media
library: a new file `…-r1` appears and the old one disappears. **Delete** the photograph: it disappears from Cloudinary too.

On a server, run the checks as the app's user so files are owned correctly:
`runuser -u deploy -- bash -c "cd /home/deploy/apps/stackbridge-invites && set -a && . ./.env.production && set +a && npm run cloudinary:check"`.

## How it works

```
browser ─ POST /api/upload ─▶ uploadAsUser()  ── requireWeddingAccess (tenant + permission) ── validateUpload (bytes, size, type)
                                   │
                                   ▼
                              ingestFile() ── processImage (sharp: orient, strip GPS, size limits, blur placeholder)
                                   │
                  wantsCloudinary? ├── yes ─▶ putProcessedImage: ONE master (2400px WebP) uploaded, response verified
                                   └── no  ─▶ the app's own store, four sizes, as before
                                   ▼
                          media_assets row: provider, storageKey (= Cloudinary public id), metadata.cloudinary {version, format, bytes, rev}

page render ─▶ toResolved(row) ─▶ https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto,w_<420|900|1600|2400>,c_limit/v<version>/<public id>
```

- **Server-side uploads.** The browser sends the file to the app, which authorises, validates and uploads; the API secret never reaches the
  browser, so no signed-upload tokens are needed. The upload route is the same one as before (same-origin check, rate limit,
  size limit, authorisation, sniffing by bytes — SVG/HTML/executables are refused before anything leaves the server).
- **Public ids are built by the server** from stable internal ids and never from user input: `sbl-invites/projects/<invitation id>/<asset id>` for
  customers, `sbl-invites/templates/<template id>/<asset id>` for a template's samples, `sbl-invites/shared/…` for shared assets. No names,
  emails or phone numbers. `isPublicId()` rejects anything else, and uploads use `overwrite: false`, so nothing can overwrite an existing id.
- **One stored master, delivered at the sizes the page asks for.** The four sizes the app has always used (420 / 900 / 1600 / 2400) are
  delivery widths of the same file (`c_limit`: never upscaled), generated on first request and then cached by the CDN. The page's
  `srcset`, `sizes`, `loading="lazy"`, width/height and blur placeholder work as before. Measured on real photographs: the delivered
  bytes are 99–105 % of the sizes that were served before (so no quality change), while only one file is stored.
- **Replacing never overwrites.** The new picture is stored under a new id (`…-r1`, `-r2`), checked, the row is pointed at it, and only then
  is the old one released — and only if no other row uses it.
- **Templates share, they don't copy.** Starting an invitation from a template used to copy every sample photograph. Now the new invitation
  gets its own *row* pointing at the template's image: nothing is uploaded, the rows keep invitations apart. Replacing the customer's
  copy uploads a new image for that invitation only; deleting an invitation (or a photograph) releases an image only when no row uses it
  any more (`releaseCloudKeys`). Deleting a customer can never remove a template's picture.
- **Failures.** A failed upload leaves no row and no orphan; a missing credential gives a plain message (“Image storage is not configured:
  set CLOUDINARY_…”), and no error ever contains the key or the secret (`src/lib/cloudinary.ts` rewrites every SDK error).
- **No `next/image`.** The app has always used `<img srcset>`, so no `remotePatterns` are needed and no blanket allow-list of remote hosts
  was added. There is no Content-Security-Policy that restricts image hosts.
- **Where the code is:** `src/lib/cloudinary.ts` (the only file that talks to Cloudinary), `src/lib/media-url.ts` (URL shapes, browser-safe),
  `src/lib/storage.ts` (`storageFor(provider)`), `src/domain/media/cloud.ts` (rules, upload, reference-checked cleanup),
  `src/domain/media/service.ts` (ingest, replace, rotate, delete), `src/domain/media/cloud-migrate.ts` (migration),
  `src/app/api/media/[id]/[variant]/route.ts` (access-checked redirect to Cloudinary).

## Moving existing photographs (migration)

`npm run cloudinary:migrate` moves the photographs of invitations that existed before Cloudinary. It is a **dry run unless you pass
`--apply`**, it never deletes anything, and it can be run again at any time.

What it does for each photograph: reads the stored master, checks it is a real image, uploads it under its public id (an existing id is
never overwritten), checks that Cloudinary holds exactly the bytes and size that were sent **and** serves the image, and only then points
the database row at it. The row keeps its old location in `metadata.legacy`, so it can be put back exactly. An invitation switches to
`cloudinary` for new uploads only when all of its photographs have moved. Audio/video, guest and time-capsule photographs and gifts are
left alone (counted in the report).

```bash
npm run cloudinary:migrate -- --exclusions                  # 1. who is protected, and why — read-only. READ THIS LIST.
npm run cloudinary:migrate                                  # 2. dry run: reads and checks everything, writes nothing, writes a report
npm run cloudinary:migrate -- --apply --limit-weddings 1    # 3. a first small sample
npm run cloudinary:migrate -- --verify                      # 4. is every migrated photograph served?
npm run cloudinary:migrate -- --apply                       # 5. everything eligible (re-run to resume after an interruption)
npm run cloudinary:migrate -- --rollback --wedding <id|address>   # put one invitation back exactly as it was
```

Options: `--scope templates|projects|all`, `--wedding <id|address>` (repeatable), `--concurrency N`.
Safety gates for `--apply`: it refuses unless Cloudinary answers and the account is under 90 % of its month (`--ignore-usage` to
override); on a hosted PostgreSQL it refuses unless you pass `--db-backup-confirmed` after taking a backup
(`pg_dump "$DATABASE_URL" | gzip > /home/deploy/backups/pre-cloudinary-$(date +%Y%m%d-%H%M).sql.gz`); on the embedded database it
backs the folder up for you; it refuses if **no** protected invitation is found in the database unless you pass
`--allow-zero-exclusions` (that would mean the wrong database, or that they are recorded differently).

Files written to `.data/cloudinary-migration/`: `<time>-before.json` (every photograph's reference before the run),
`<time>-mapping.jsonl` (old → new, with a content hash), `<time>-report.json` (counts per outcome, the protected list, the fingerprint).

Safe to interrupt and repeat: migrated rows are skipped; an upload whose database update did not happen is found again by its id, verified
and completed — never duplicated. Outcomes per photograph: `migrated`, `already_cloudinary`, `skipped_private`, `skipped_not_image`,
`missing_source` (the file is not on the old store), `invalid_image`, `upload_failed`, `verify_failed`, `db_failed`; any of the last five keeps the
invitation on the old store and is listed at the end. Rolling back leaves the Cloudinary images in place; a photograph replaced *after* its
migration has no old copy to go back to and stays on Cloudinary (counted).

Identical pictures that appear in several invitations (the sample invitations share stock photographs) are reported
(`duplicates`) but each row keeps its own Cloudinary image; merging them is a possible later saving.

## The invitations that are never moved

The invitations of **Surej** and **Akshaya** must not be migrated, modified, overwritten or deleted. This is enforced, not trusted:

1. **Who is protected** is read from the database (`findExcluded`), never guessed from file names: any invitation whose address, title,
   contact, couple names (in the draft *and* in every published version), member accounts or orders mention one of the protected names
   (`PROTECTED_NAMES` in `src/domain/media/cloud-migrate.ts`; add more with `CLOUDINARY_EXCLUDE_NAMES`), any listed in
   `CLOUDINARY_EXCLUDE_WEDDING_IDS`, and any with `media_storage = 'pinned'`. A false match only skips an invitation; it cannot cause one
   to be moved. `--exclusions` prints each with the reason it matched and how many files it has.
2. **Three independent checks** keep them out of a run: the candidate query, a guard before each invitation is processed, and the
   `UPDATE` itself (`weddingId NOT IN (protected)`). Asking for one by name (`--wedding <its address>`) still skips it; `--rollback`
   refuses it too.
3. **Proof in every report:** a fingerprint (SHA-256 over their invitation rows, photographs, albums and gallery items) is taken before
   and after; the run exits with an error if they differ. Their files are never read for migration, so nothing can have been written.
4. **Existing invitations keep their storage mode.** The schema change gives every existing invitation `media_storage = 'legacy'` as a column
   default — it is not an `UPDATE`, so no existing row is written — and new photographs added to them keep going to the old store. Only an
   invitation created *after* this change defaults to Cloudinary. The two are therefore untouched even if the tool were never run.
5. **Shared template assets:** their invitations hold their own copies of any sample photographs (separate files and rows), so migrating
   a template's samples never changes their invitations.

Tested (tests/cloudinary-migration.test.ts): protected by address, by name inside the draft/published document, by account, by order, by
pin and by id; a bulk run with no filter and a run that asks for them by name both leave their rows byte-identical and put nothing of
theirs on Cloudinary; rollback refuses them.

**Where the protected invitations are in production is not something this machine can see** — the production database is on the server.
Run `--exclusions` there first and check that both appear (see below).

## Deploying to the server

The app is safe to deploy before Cloudinary is configured: without credentials everything behaves as before. Order for a first rollout
(the same commands work for any later one):

```bash
# 1. Add the credentials to the server's environment file (the deploy copies it into each release)
ssh -i ~/.ssh/netjet_hetzner root@65.108.245.110
nano /home/deploy/apps/stackbridge-invites/.env.production      # add the three CLOUDINARY_* lines, save
exit

# 2. Deploy. It backs up the database, applies the new migration (0007: two additive columns), builds, swaps, health-checks.
ssh -i ~/.ssh/netjet_hetzner root@65.108.245.110 "stackbridge-deploy"

# 3. Check the connection from the server
ssh -i ~/.ssh/netjet_hetzner root@65.108.245.110 'runuser -u deploy -- bash -c "cd /home/deploy/apps/stackbridge-invites && set -a && . ./.env.production && set +a && npm run cloudinary:check -- --smoke"'
```

From here **new invitations** store their photographs on Cloudinary. The existing production invitations are unchanged until you run
the migration, on the server, as the `deploy` user (`cd /home/deploy/apps/stackbridge-invites && set -a && . ./.env.production && set +a`):

```bash
npm run cloudinary:migrate -- --exclusions     # the list MUST contain the Surej and Akshaya invitations — if not, stop and tell me
npm run cloudinary:migrate                     # dry run, read-only; also proves the queries on the production database
pg_dump "$DATABASE_URL" | gzip > /home/deploy/backups/pre-cloudinary-$(date +%Y%m%d-%H%M).sql.gz
npm run cloudinary:migrate -- --apply --db-backup-confirmed --limit-weddings 1     # one invitation first; open it and look
npm run cloudinary:migrate -- --verify
npm run cloudinary:migrate -- --apply --db-backup-confirmed                        # the rest
```

Nothing is deleted from the server's `storage/` folder by any of this; once everything has been checked for a while, that folder is the
backup you can remove. To also move the sample invitations' photographs on a fresh server, seeding them (`SEED_ONLY=public-demos …
npm run db:seed`) after the credentials are in place stores them on Cloudinary directly.

## Usage, limits and monitoring

`npm run cloudinary:check` shows the plan and consumption (also in the dashboard under **Settings → Usage**). The Free plan has **25 credits
a month; one credit = 1,000 transformations *or* 1 GB of storage *or* 1 GB of bandwidth** (shared). Measured on this account:

- each uploaded photograph costs about **1 transformation** (60 uploads → +60);
- each distinct size of a photograph that a visitor's phone actually asks for costs 1 more, once (then it is cached on the CDN) — a typical invitation
  uses 2–3 sizes of each photograph;
- delivery checks (HEAD of the stored file) cost nothing measurable (200 checks → +9).

So roughly 4–5 transformation units per photograph in total: **1,000 photographs ≈ 5 credits**, plus storage (the 488 photographs of the sample
invitations are 96.5 MB) and visitors' bandwidth. Bandwidth is the figure to watch if one invitation goes viral. The migration refuses to start above 90 %
of the month. Cloudinary also emails at its own thresholds — set them in the dashboard.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `cloudinary:check`: “Must supply api_key” / “Invalid cloud_name” / 401 | a value is missing or mistyped in the environment; copy them again from the dashboard (no quotes, no spaces) |
| Photographs upload but stay on the old store | credentials missing in *that* process's environment (restart after editing `.env.production`), or the invitation is `legacy`/`pinned`, or the photograph is a guest/private/capsule/gift one — see [What goes where](#what-goes-where) |
| Images show a themed placeholder | the URL is not delivering: `node scripts/dev/cloud-shot.mjs <slug>` lists failing URLs; check `CLOUDINARY_CLOUD_NAME` matches the account the images were uploaded to |
| A walking figure's head is blank | the head photo's URL was cut at a comma — srcset candidates are separated by `, ` (comma and space); use `split(/,\s+/)`, never `split(",")` |
| A thumbnail grid downloads huge pictures | build the thumbnail URL with `sized(url, "sm")` or `sized(url, "md")` from `src/lib/media-url.ts`, not `url.replace("/lg", …)` |
| A deleted image is still visible for a while | Cloudinary's CDN keeps serving what it cached; the file is gone from the account (check with `imageExists()` or the dashboard) |
| Migration: `missing_source` | the row points at a file that is not on the old store (already broken before the migration) — the invitation stays on the old store; restore the file or delete the row |
| Migration refuses: “No protected invitations were found” | you are probably on the wrong database; if right, `--allow-zero-exclusions` |
| Quota exceeded | Cloudinary stops *new* transformations; stored files and already-cached sizes keep working. Upgrade the plan or wait for the month to turn |
| Error mentions `[object Object]` | an SDK error shape `clean()` does not know yet — add it to `detail()` in `src/lib/cloudinary.ts` |

## Not done on purpose, and ideas

- The stock photographs (`assets/stock/`, 221 files, 44 MB) and brand files stay in the repository; moving the stock set means re-creating the focal-point
  crop of `/stock/[id]` with Cloudinary's gravity options.
- Link-preview (WhatsApp) pictures use the 1600 px delivery; a dedicated 1200×630 crop (`c_fill`) would make the card sharper.
- Identical sample photographs could share one Cloudinary image across invitations (the migration report counts them).
- Video and audio could move to Cloudinary too; they were left out because this work is about images and their access rules differ.
