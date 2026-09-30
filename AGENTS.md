<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# StackBridge Invites — project notes for agents

Read `README.md` first. Rules that keep this codebase coherent:

- **Domain first.** Business rules live in `src/domain/**` and take an `Actor`. Server actions (`src/app/actions`) only wrap them with `act()`; pages never query the database for anything that has a rule attached.
- **Authorisation has one door:** `requireWeddingAccess(actor, weddingId)` (tenant isolation + entitlement). Never add a query that takes a `weddingId` from the browser without going through it. Guests are identified only by `GuestContext` from an unguessable token.
- **Features are data.** Add a capability by adding a key to `src/domain/packages/features.ts`, gating it with `assertCanUse`/`canUse`, then run `npm run docs:features`. Do not branch on package names.
- **Content is a validated document** (`src/domain/doc/schema.ts`). Anything a guest sees must come from the published snapshot and pass server-side visibility filtering. Never let an editor inject CSS, HTML or scripts.
- **Localised text** is `{ en, ml, … }`; guest strings come from `src/invitation/i18n/strings.ts` (EN + ML complete). Malayalam gets no letter-spacing/uppercase.
- **Time:** the product's day boundary is Asia/Kolkata (see analytics buckets). PGlite uses the host timezone, so always convert explicitly.
- **Schema changes:** edit `src/db/schema.ts`, `npm run db:generate`, commit the SQL in `drizzle/`.
- **Before you finish:** `npm run typecheck && npm run lint && npm test` (and `npx next build` for route/config changes). Verify UI changes visually with `node scripts/dev/ashot.mjs`.
- Login is rate-limited (8 attempts / 15 min per email) — batch screenshots into one `ashot` call.
