# Cloudinary integration — handover report

Date: 2026-10-21. Everything below was checked on this computer against the **real Cloudinary account** (cloud `gekghtsf`, Free plan).
**Nothing has been run against production**: the production database and server are only reachable from your SSH key, which is not on this
machine. Where something is verified, the evidence is named; where it is not, it says so.

Full guide (setup, testing, migration, troubleshooting): [docs/CLOUDINARY.md](docs/CLOUDINARY.md).

## 1. Executive summary

- Cloudinary is connected and verified (credentials accepted, upload → delivery → resize → replace → delete all pass against the live account).
- **Every invitation created from now on stores its photographs on Cloudinary.** Template sample photographs, too.
- **Existing photographs can be moved by a safe, resumable tool** (dry run by default, never deletes, rolls back exactly). I ran it on this computer's database:
  **488 photographs migrated, 0 failures**, all served back and rendered correctly in the real app.
- **Surej and Akshaya are protected by construction** and a before/after fingerprint is part of every report. **They do not exist in this computer's database**,
  so their protection was proven with test records that mimic every way they could be recorded; on production it has to be confirmed with one read-only command (§10).
- Safe to deploy before touching anything else: without credentials the app behaves exactly as before, and existing invitations are untouched until you run the migration.
- Gates: typecheck ✔, lint ✔ (0 errors; the one old RsvpSection warning remains), **293 tests ✔ on the embedded database and again on a real PostgreSQL 18**, production build ✔.

## 2. What was implemented

| Requirement | Done | Evidence |
|---|---|---|
| Official SDK, secrets server-side only | `cloudinary@2.11.0`; one file talks to it (`src/lib/cloudinary.ts`); every SDK error is rewritten so it can never contain the key or secret; nothing in `NEXT_PUBLIC_*`; `.env.local` is git-ignored | `cloudinary:check`, tests |
| Centralised image service | upload, delivery URLs, replace, rotate, delete (reference-checked), validation, metadata, migration, usage — one module set, not per component | §3 |
| New projects use Cloudinary | `weddings.media_storage` defaults to `cloudinary`; uploads go through the existing authorised route | e2e on the real account; real Next server run |
| New template uploads use Cloudinary | a template's sample photographs go under `templates/<template id>/` | tests, real Cloudinary |
| Existing templates migrated | the 29 sample invitations' photographs (455) are on Cloudinary; the 57 template pictures of the public site too (manifest `cloud-thumbs.json`) | migration report, `/templates` page: 57 images, 0 failed |
| Existing projects migrated | tool built and exercised; the one non-sample invitation here (33 photographs) migrated; **production not migrated yet** | §7, §10 |
| Surej & Akshaya excluded | §9 | tests |
| Template editor works as before | nothing in the editor was redesigned; slots, focal points, alt text, replace, rotate, albums, reorder work through the same service; thumbnails now request a small size instead of the 1600 px one | tests; real upload + replace through the production server |
| Customer invitation from a template | the template's photographs are **shared, not re-uploaded**: the new invitation gets its own rows pointing at the same image | test: 0 uploads, deleting the customer never removes the template's image |
| Replace / cleanup | new id first, checked, row repointed, old one released only if no other row uses it | tests + real run (`-r1`, old image gone) |
| Delivery optimisation | `f_auto,q_auto`, widths 420/900/1600/2400 (`c_limit`, never upscaled), lazy images, width/height and blur kept, one stored master instead of four files; measured delivery weight is 99–105 % of what was served before | measured on real photographs |
| `next/image` | the app never used it (plain `<img srcset>`), so no remote-pattern allow-list was needed or added | code inspection |

Decisions you may want to overrule: only **photographs** go to Cloudinary (audio/video stay put); **guest uploads, time-capsule photographs and gifts stay on the app's store**
because they must stay behind an access check and a Cloudinary link is public to anyone who has it; the stock demo photographs and brand files stay in the repository (§11).

## 3. Architecture overview

```
upload route ─ authorise ─ validate bytes ─ process (strip GPS, size limits) ─ wantsCloudinary? ─ yes: ONE master to Cloudinary, response verified
                                                                                        └ no: app store, four sizes (unchanged)
media_assets.provider = 'cloudinary' | 'legacy'   (per photograph)      weddings.media_storage = 'cloudinary' | 'legacy' | 'pinned'   (where new ones go)
page ─ toResolved ─ https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto,w_<n>,c_limit/v<ver>/sbl-invites/projects/<invitation id>/<asset id>
```

Public ids use internal ids only (no names/emails/phones) and are built by the server; uploads never overwrite. Details in the guide.

## 4. Files

Created: `src/lib/cloudinary.ts`, `src/lib/media-url.ts`, `src/domain/media/cloud.ts`, `src/domain/media/cloud-migrate.ts`, `src/domain/catalogue/cloud-thumbs.json`,
`drizzle/0007_cloudinary_storage.sql` (+ `meta/0007_snapshot.json`), `scripts/cloudinary-check.ts`, `cloudinary-e2e.ts`, `cloudinary-migrate.ts`, `cloudinary-static.ts`,
`scripts/dev/cloud-shot.mjs`, `tests/cloudinary.test.ts`, `tests/cloudinary-migration.test.ts`, `tests/fake-cloudinary.ts`, `docs/CLOUDINARY.md`, this report.

Modified: `package.json` / `package-lock.json` (dependency + 4 scripts), `src/db/schema.ts`, `drizzle/meta/_journal.json`, `src/lib/env.ts`, `src/lib/storage.ts`,
`src/domain/media/service.ts`, `src/domain/wedding/from-template.ts`, `src/domain/wedding/service.ts`, `src/domain/gifts/service.ts`,
`src/app/api/media/[id]/[variant]/route.ts`, `src/domain/catalogue/templates.ts`, `src/invitation/engine/Journey.tsx`, `src/components/admin/MediaField.tsx`,
`src/components/media/AlbumsPanel.tsx`, `src/components/media/MediaLibrary.tsx`, `src/components/workspace/Editors.tsx`, `.env.example`,
`deploy/env.production.example`, `README.md`, `AGENTS.md`, `docs/IMAGES.md`.

Two bugs the work exposed and fixed: the walking figures' heads cut a Cloudinary URL at its first comma (srcset parsing), and admin thumbnails derived sizes with
`url.replace("/lg", …)`, which does nothing to a Cloudinary URL (grids would have loaded 1600 px pictures).

## 5. Environment variables

```
CLOUDINARY_CLOUD_NAME=      # required
CLOUDINARY_API_KEY=         # required
CLOUDINARY_API_SECRET=      # required — server only
CLOUDINARY_FOLDER=          # optional, default sbl-invites (lowercase)
CLOUDINARY_EXCLUDE_NAMES=   # optional, extra names the migration must skip
CLOUDINARY_EXCLUDE_WEDDING_IDS=   # optional, exact invitation ids the migration must skip
```
This computer's `.env.local` has the first three (git-ignored, not committed). **The server's `.env.production` does not yet.**

## 6. Database changes

Migration `0007_cloudinary_storage` (additive; no table dropped, nothing reset):
`media_assets.provider text not null default 'legacy'` and `weddings.media_storage text not null default 'cloudinary'` — written so that **existing invitations get `legacy`** (add column
with default `legacy`, then change the default) and only new ones default to `cloudinary`. This is a column default, not an `UPDATE`: no existing row is written. Checked on real PostgreSQL 18:
existing rows read `legacy`, a new row reads `cloudinary`. Old references are kept in `media_assets.metadata.legacy` after a migration, so no extra table is needed.

## 7. Migration results (this computer's database; production is not touched)

| | |
|---|---|
| Invitations | 32 in total: 29 template-sample invitations, 1 project, 2 gifts |
| Eligible invitations | 30 (29 template samples + 1 project) — all 30 migrated and switched to Cloudinary |
| Photographs found | 537 rows: 488 eligible photographs, 16 private/guest photographs (kept), 33 audio files (kept) |
| **Migrated** | **488** (455 template-sample, 33 project) — 96.5 MB of source files; 488 distinct Cloudinary images |
| Skipped | 49 on purpose: 16 private/guest photographs, 33 audio files |
| Failures | **0** (0 missing source, 0 not an image, 0 upload, 0 verify, 0 database) |
| Broken/missing sources | 0 |
| Duplicates | 116 identical pictures appear in more than one sample invitation (230 extra copies, from the whole-database dry run); each row keeps its own Cloudinary image — merging is a possible later saving |
| Gifts | 2 invitations are gifts: left on the app's store by design |
| Projects excluded | **0 on this computer** — Surej and Akshaya are not in this database |
| Re-run | “0 eligible, 0 migrated” (idempotent); `--verify`: 488 checked, 0 not served |
| Old files | none deleted (`storage/` still has all 344 MB); backups: `.data/pg.backup-pre-cloudinary` and one per run; originals' references in `.data/cloudinary-migration/*-before.json` |

Order I ran it: dry run → 1 invitation (18 photographs) → verified in the real app → the other 29 → re-run → verify. Reports are in `.data/cloudinary-migration/` (git-ignored).
A rendered check of 9 migrated invitations (weddings of different styles, kids' events, a corporate event, a puja) in the production build: every page's images came from
Cloudinary, 0 failed, every `<img>` rendered.
**This computer's own development database now serves its sample photographs from Cloudinary** (it needs internet in development); `npm run cloudinary:migrate -- --rollback --wedding <slug>` puts any back.

## 8. Testing results

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors, 1 warning (existing, `RsvpSection.tsx`) |
| `npm test` (embedded Postgres) | **293 / 293** (263 before; 30 new, in 2 files) |
| `npm test` on a real PostgreSQL 18 (`TEST_DATABASE_URL`, throwaway local cluster) | **293 / 293** |
| `npx next build` | pass |
| `npm run cloudinary:check -- --smoke` (live) | pass: upload, repeat upload = no duplicate, delivery, resize, byte-identical read-back, delete |
| `npm run cloudinary:e2e` (live, throwaway database) | **16 / 16** |
| Real Next production server, admin signed in: upload → Cloudinary URL, replace → new `-r1` id and old released, signed-out upload → 401 | pass |
| Mobile and desktop render of migrated invitations | pass (screenshots inspected; the walking figures' faces appear) |

Covered by tests with Cloudinary replaced by an in-memory fake that follows the same rules: placement rules, guest/private/capsule/gift photographs stay behind the access check, legacy and pinned invitations
stay legacy, unauthorised and cross-invitation uploads rejected (0 uploads made), SVG/garbage refused before upload, outage leaves no row or orphan, replace/rotate (success and failure), delete,
template sharing (0 uploads; deleting a customer or replacing their copy never touches the template's image), the access-checked route (302 to Cloudinary at the right width; 404 for unpublished),
missing credentials message, migration: dry run writes nothing, success, rerun, outage then resume, database failure then resume without a duplicate, missing source, invalid image, delivery check failing,
rollback (exact old references restored; Cloudinary images kept; later edits kept), and every exclusion path.

**Not tested:** anything on the production server or database; a Cloudinary quota-exhausted condition; a real browser upload through the studio UI by hand (the HTTP route was exercised with a signed-in browser session, the
click-through in §docs “By hand” is yours to do).

## 9. Surej and Akshaya — exclusion verification

- **Identification:** from the database, never from file names: address, title, contact, couple names in the draft **and every published version**, member accounts, orders, the pin flag (`media_storage = 'pinned'`),
  and `CLOUDINARY_EXCLUDE_WEDDING_IDS`. Names: `surej`, `akshaya` (`PROTECTED_NAMES`; extend with `CLOUDINARY_EXCLUDE_NAMES`). A false match only skips an invitation.
- **Enforcement:** three independent checks (candidate query, guard per invitation, the `UPDATE` itself); `--wedding <their address>` still skips them; `--rollback` refuses them; the tool refuses to `--apply` if it finds
  *no* protected invitation unless told `--allow-zero-exclusions`.
- **Proof in every run:** a SHA-256 fingerprint of their invitation rows, photographs, albums and gallery items before and after; the run fails if it changes. In tests, a bulk run with no filter and a run asking for them by name
  leave their rows byte-identical and put nothing of theirs on Cloudinary.
- **“No writes were performed against them”:** on this computer there is nothing to write to (0 protected invitations found, fingerprint `none`). In production, the schema change itself does not write to their rows (column default, not an `UPDATE`), new
  photographs added to existing invitations keep going to the old store, and the migration skips them.
- **Open item:** I could not see the production database, so **I have not seen their records**. Run `--exclusions` on the server first (§10 step 4) and confirm both appear. If they do not (for example they are recorded under other spellings), add the names
  to `CLOUDINARY_EXCLUDE_NAMES` or their ids to `CLOUDINARY_EXCLUDE_WEDDING_IDS` before any `--apply`.

## 10. Remaining manual steps (yours, in the morning)

1. **Add the three Cloudinary values to the server**, then deploy (the deploy backs up the database, applies migration 0007, builds, swaps, health-checks):
   ```bash
   ssh -i ~/.ssh/netjet_hetzner root@65.108.245.110
   nano /home/deploy/apps/stackbridge-invites/.env.production    # add CLOUDINARY_CLOUD_NAME=… CLOUDINARY_API_KEY=… CLOUDINARY_API_SECRET=…   (values: Cloudinary dashboard → Settings → API Keys)
   exit
   ssh -i ~/.ssh/netjet_hetzner root@65.108.245.110 "stackbridge-deploy"
   ```
2. **Check the connection from the server:**
   `ssh -i ~/.ssh/netjet_hetzner root@65.108.245.110 'runuser -u deploy -- bash -c "cd /home/deploy/apps/stackbridge-invites && set -a && . ./.env.production && set +a && npm run cloudinary:check -- --smoke"'`
3. **Test in the studio** (5 minutes, guide §“By hand”): new invitation → Media → upload → open it → replace → delete.
4. **Before moving existing production photographs** (optional, whenever you are ready), on the server as the `deploy` user (`cd /home/deploy/apps/stackbridge-invites && set -a && . ./.env.production && set +a`):
   ```bash
   npm run cloudinary:migrate -- --exclusions    # must list the Surej and Akshaya invitations; if not, STOP
   npm run cloudinary:migrate                    # dry run, read-only
   pg_dump "$DATABASE_URL" | gzip > /home/deploy/backups/pre-cloudinary-$(date +%Y%m%d-%H%M).sql.gz
   npm run cloudinary:migrate -- --apply --db-backup-confirmed --limit-weddings 1   # one invitation; open it and look
   npm run cloudinary:migrate -- --verify
   npm run cloudinary:migrate -- --apply --db-backup-confirmed                      # the rest; re-run to resume
   ```
5. Cloudinary dashboard → set a usage alert (the Free plan is 25 credits a month; ≈ 5 credits per 1,000 photographs plus bandwidth).
6. **Security hygiene:** the API secret was shared in our chat as a screenshot. If that chat could be seen by anyone else, generate a new secret in the dashboard (Settings → API Keys) and update `.env.local` and the server's `.env.production`.
7. Optional: on a fresh server, `SEED_ONLY=public-demos … npm run db:seed` after the credentials are in place stores the demo photographs on Cloudinary directly; on the current server, the migration moves them.

## 11. Known issues and limits

- Production is unverified (above). The migration SQL (regex search of the draft/published documents, correlated subqueries) was run on a local PostgreSQL 18 through the same driver the server uses, and its dry run is read-only, so the first production step shows any problem before anything is written.
- Cloudinary's CDN keeps serving a file for a while after it is deleted from the account; the account itself is correct immediately.
- `f_auto` served WebP/JPEG in every browser I tried; AVIF was not chosen by Cloudinary here.
- Stock photographs (221 files, 44 MB) and brand files remain in the repository on purpose; moving them means re-creating the focal-point crop of `/stock/[id]` with Cloudinary gravity.
- The usage report in the API lags by minutes to hours, so `cloudinary:check` can read low straight after a bulk upload.
- `npm audit` reports 2 high findings in `source-map-js` (a Next/PostCSS dependency, not new, not Cloudinary).
- Link-preview pictures use the 1600 px delivery; a dedicated 1200×630 crop would be sharper.

## 12. Recommended next actions

1. Deploy and run steps 1–3 above; then the production migration (step 4) when you have a quiet hour.
2. After a few days of checks, delete the server's old `storage/` photographs (never deleted automatically) — keep audio/video, guest and gift files there.
3. Move the stock demo photographs and the brand files with the same manifest mechanism if you want the whole product on one CDN.
4. Consider moving video and audio to Cloudinary later (different access and cost rules).

### Commands to resume or complete anything unfinished

```bash
npm run cloudinary:check -- --smoke            # connection + live round trip
npm run cloudinary:e2e                         # whole lifecycle, real account, throwaway database
npm run cloudinary:static                      # re-publish the public site's template pictures (then commit src/domain/catalogue/cloud-thumbs.json)
npm run cloudinary:migrate -- --exclusions     # who is protected
npm run cloudinary:migrate                     # dry run; add --apply (and --db-backup-confirmed on a hosted database) to migrate; re-run to resume
npm run cloudinary:migrate -- --verify         # everything migrated is still served
npm run cloudinary:migrate -- --rollback --wedding <id|address>
node scripts/dev/cloud-shot.mjs <slug> out.png [--mobile]     # does an invitation's photography load, and from where
```
