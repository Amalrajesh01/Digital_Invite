#!/usr/bin/env bash
# Deploys the commit currently checked out in the source clone to the running service. Runs as root ON THE SERVER.
# Normally started through `stackbridge-deploy` (deploy/stackbridge-deploy), which fetches the ref first.
#
#   backup → stage the commit beside the live app → build there (memory-capped) → [migrate] → swap → health check
#   → automatic rollback if the app does not come up.
#
# Zero risk to the data: the database is only dumped (and migrated, when the commit adds migrations); nothing is
# deleted. Optional: REFRESH_LIBRARY=1 also runs `npm run library:refresh` (updates built-in templates/themes that
# nobody edited in the studio). FORCE=1 deploys even when the commit is not newer than the one that is live.
set -Eeuo pipefail

SRC=${SRC:-/home/deploy/src/stackbridge-invites}
LIVE=${LIVE:-/home/deploy/apps/stackbridge-invites}
STAGE="$LIVE-stage"
SERVICE=${SERVICE:-stackbridge-invites}
APP_PORT=${APP_PORT:-8104}      # where the service listens (behind nginx)
PUBLIC_PORT=${PUBLIC_PORT:-8004} # what the world reaches
RUN_AS=${RUN_AS:-deploy}
BK=${BK:-/home/deploy/backups}
KEEP=${KEEP:-7}

log() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
die() { printf '\n\033[31m!! %s\033[0m\n' "$*" >&2; exit 1; }
as_app() { runuser -u "$RUN_AS" -- bash -c "$1"; }
http() { curl -s -m 30 -o /dev/null -w '%{http_code}' "$1" || true; }
load_env='set -a && . ./.env.production && set +a'

[ "$(id -u)" = 0 ] || die "run as root"
[ -d "$SRC/.git" ] || die "no source clone at $SRC (use stackbridge-deploy)"
[ -d "$LIVE" ] || die "no live app at $LIVE"
exec 9>/var/lock/stackbridge-deploy.lock
flock -n 9 || die "another deploy is already running"

SHA=$(git -C "$SRC" rev-parse --short HEAD)
FULL=$(git -C "$SRC" rev-parse HEAD)
SUBJECT=$(git -C "$SRC" log -1 --format=%s)
OLD_FULL=$(cat "$LIVE/.deployed-sha" 2>/dev/null || true)
TS=$(date +%Y%m%d-%H%M%S)
log "deploying $SHA — $SUBJECT"

if [ -n "$OLD_FULL" ] && [ "$OLD_FULL" = "$FULL" ] && [ -z "${FORCE:-}" ]; then
  echo "already deployed ($SHA). Nothing to do (FORCE=1 to redeploy)."; echo "DONE_STACKBRIDGE_DEPLOYED $SHA (unchanged)"; exit 0
fi
if [ -n "$OLD_FULL" ] && [ -z "${FORCE:-}" ]; then
  git -C "$SRC" cat-file -e "$OLD_FULL^{commit}" 2>/dev/null || die "the live commit ${OLD_FULL:0:7} is not in the clone, so I cannot tell whether $SHA is newer — push it first, or FORCE=1."
  git -C "$SRC" merge-base --is-ancestor "$FULL" "$OLD_FULL" && die "$SHA is OLDER than the live commit ${OLD_FULL:0:7} — refusing to roll the site back. Merge/push first, or FORCE=1."
fi

TEMP_SWAP=""
cleanup() {
  [ -n "$TEMP_SWAP" ] && { swapoff "$TEMP_SWAP" 2>/dev/null || true; rm -f "$TEMP_SWAP"; }
  rm -rf "$STAGE"
}
trap cleanup EXIT

# ── backups (the database is only ever read) ───────────────────────────────
log "backup"
mkdir -p "$BK" && chown "$RUN_AS:$RUN_AS" "$BK" && chmod 700 "$BK"
( cd "$LIVE" && eval "$load_env" && pg_dump "$DATABASE_URL" | gzip > "$BK/db-$TS.sql.gz" )
[ "$(zcat "$BK/db-$TS.sql.gz" | grep -c '^CREATE TABLE')" -gt 0 ] || die "database dump looks empty"
tar czf "$BK/storage-$TS.tgz" -C "$LIVE" storage
tar czf "$BK/src-$TS.tgz" -C "$LIVE" --exclude=./node_modules --exclude=./node_modules.prev --exclude=./storage --exclude=./.env.production --exclude=./.next --exclude=./.next.prev .
chown "$RUN_AS:$RUN_AS" "$BK"/*; chmod 600 "$BK"/*
echo "saved $BK/{db,storage,src}-$TS"

# ── stage the commit beside the live app ───────────────────────────────────
log "stage $SHA"
rm -rf "$STAGE" && as_app "mkdir -p '$STAGE' && git -C '$SRC' archive '$FULL' | tar -x -C '$STAGE'"
LOCK_CHANGED=0
if cmp -s "$STAGE/package-lock.json" "$LIVE/package-lock.json"; then
  as_app "cp -al '$LIVE/node_modules' '$STAGE/node_modules'"
else
  LOCK_CHANGED=1; echo "package-lock.json changed — npm ci"
  as_app "cd '$STAGE' && npm ci --no-audit --no-fund 2>&1 | tail -3"
fi
as_app "cp '$LIVE/.env.production' '$STAGE/.env.production'" && chmod 600 "$STAGE/.env.production"

# ── build there (capped, so a runaway build can only hurt itself, not the other apps on the box) ──
log "build"
HEADROOM=$(awk '/MemAvailable/ {a=$2} /SwapFree/ {s=$2} END {print int((a+s)/1024)}' /proc/meminfo)
if [ "$HEADROOM" -lt 2600 ]; then
  echo "only ${HEADROOM} MB of memory+swap headroom — adding a temporary 2 GB swapfile for the build"
  TEMP_SWAP=/swapfile.deploytmp
  fallocate -l 2G "$TEMP_SWAP" && chmod 600 "$TEMP_SWAP" && mkswap "$TEMP_SWAP" >/dev/null && swapon "$TEMP_SWAP"
fi
systemd-run --scope --quiet -p MemoryMax=1800M -p MemorySwapMax=1500M nice -n 15 \
  runuser -u "$RUN_AS" -- bash -c "cd '$STAGE' && $load_env && export NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=1536 && npx next build" 2>&1 | tail -n 25 || true
[ -f "$STAGE/.next/BUILD_ID" ] || die "build failed — the live site was not touched"

if ! diff -rq "$STAGE/drizzle" "$LIVE/drizzle" >/dev/null 2>&1; then
  log "new database migrations — applying (additive; the old code keeps running meanwhile)"
  as_app "cd '$STAGE' && $load_env && npm run db:migrate 2>&1 | tail -3"
fi

# ── swap ───────────────────────────────────────────────────────────────────
rollback() {
  printf '\n\033[31m!! %s — ROLLING BACK\033[0m\n' "$1" >&2
  systemctl stop "$SERVICE" || true
  rm -rf "$LIVE/.next" && mv "$LIVE/.next.prev" "$LIVE/.next"
  as_app "tar xzf '$BK/src-$TS.tgz' -C '$LIVE'"
  if [ "$LOCK_CHANGED" = 1 ] && [ -d "$LIVE/node_modules.prev" ]; then rm -rf "$LIVE/node_modules" && mv "$LIVE/node_modules.prev" "$LIVE/node_modules"; fi
  systemctl start "$SERVICE"; sleep 5
  echo "rollback health: $(http "http://127.0.0.1:$APP_PORT/api/health")" >&2
  exit 1
}
log "swap (the service is stopped for a few seconds)"
rm -rf "$LIVE/.next.prev"
systemctl stop "$SERVICE"
mv "$LIVE/.next" "$LIVE/.next.prev"
# NB: exclude only the TOP-LEVEL node_modules — the build keeps its external-module links in .next/node_modules
as_app "tar -C '$STAGE' --exclude=./node_modules --exclude=./.env.production --exclude=./storage --exclude=./.next/cache -cf - . | tar -C '$LIVE' -xf -" || rollback "copy failed"
if [ "$LOCK_CHANGED" = 1 ]; then rm -rf "$LIVE/node_modules.prev"; mv "$LIVE/node_modules" "$LIVE/node_modules.prev"; mv "$STAGE/node_modules" "$LIVE/node_modules"; fi
[ -n "$(ls -A "$LIVE/.next/node_modules" 2>/dev/null)" ] || rollback "the build's external-module links are missing"
# the build records the directory it was built in; point it at the live one
grep -rl "$STAGE" "$LIVE/.next" 2>/dev/null | xargs -r sed -i "s#$STAGE#$LIVE#g"
systemctl start "$SERVICE"

ok=0
for _ in $(seq 1 30); do sleep 2; [ "$(http "http://127.0.0.1:$APP_PORT/api/health")" = 200 ] && ok=1 && break; done
[ "$ok" = 1 ] || rollback "health check failed"
SLUG=$( ( cd "$LIVE" && eval "$load_env" && psql "$DATABASE_URL" -Atc "select slug from weddings where status='PUBLISHED' order by created_at limit 1" ) 2>/dev/null || true )
for p in /api/health /login ${SLUG:+/invite/$SLUG}; do
  c=$(http "http://127.0.0.1:$PUBLIC_PORT$p"); printf ':%s%s -> %s\n' "$PUBLIC_PORT" "$p" "$c"
  [ "$c" = 200 ] || rollback "$p returned $c through nginx"
done

# ── after the swap ─────────────────────────────────────────────────────────
echo "$FULL" > "$LIVE/.deployed-sha"; chown "$RUN_AS:$RUN_AS" "$LIVE/.deployed-sha"
[ -n "$OLD_FULL" ] && echo "$OLD_FULL" > "$LIVE/.deployed-sha.prev"
if [ -n "${REFRESH_LIBRARY:-}" ]; then
  log "library:refresh"
  as_app "cd '$LIVE' && $load_env && npm run library:refresh 2>&1 | tail -6"
fi
for kind in db storage src; do ls -1t "$BK"/$kind-*.* 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f; done

log "live"
systemctl is-active "$SERVICE"
echo "DONE_STACKBRIDGE_DEPLOYED $SHA — $SUBJECT"
