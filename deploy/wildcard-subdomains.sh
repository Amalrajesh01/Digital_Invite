#!/usr/bin/env bash
# One-time server setup for {slug}.invites.stackbridgelab.com. Run as root ON THE SERVER, after `stackbridge-deploy`:
#
#   bash /home/deploy/src/stackbridge-invites/deploy/wildcard-subdomains.sh preflight    # read-only: what is there now
#   bash .../wildcard-subdomains.sh register     # once: creates the acme-dns account, prints the ONE DNS record to add at BigRock
#   bash .../wildcard-subdomains.sh cert-staging # tests issuance + the renewal hook against Let's Encrypt staging (nothing trusted)
#   bash .../wildcard-subdomains.sh cert         # the real wildcard certificate (cert name: invites-wildcard)
#   bash .../wildcard-subdomains.sh nginx        # installs the wildcard virtual host: nginx -t first, reload only if it passes
#   bash .../wildcard-subdomains.sh verify SLUG  # checks DNS, certificate, routing and that the main site is untouched
#   bash .../wildcard-subdomains.sh rollback     # removes the wildcard virtual host again (the certificate stays)
#
# Never touches the existing certificate (invites.stackbridgelab.com) or any other virtual host. The DNS challenge is answered by acme-dns
# (https://github.com/joohoi/acme-dns): BigRock gets a single CNAME and no credentials ever leave this server. Credentials: root-only file.
set -Eeuo pipefail

DOMAIN=invites.stackbridgelab.com
WILD="*.$DOMAIN"
CERT=invites-wildcard
ACME_DNS=${ACME_DNS:-https://auth.acme-dns.io}
DIR=/etc/letsencrypt/acme-dns
CREDS=$DIR/$DOMAIN.json
HOOK=$DIR/auth-hook.sh
SITE=invites-wildcard.stackbridgelab.com
SRC=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
IP=65.108.245.110

die() { printf '\n\033[31m!! %s\033[0m\n' "$*" >&2; exit 1; }
say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
[ "$(id -u)" = 0 ] || die "run as root"

json() { python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))[sys.argv[2]])' "$@"; }

cname_target() { # what _acme-challenge.invites currently points to ("" if nothing)
  if command -v dig >/dev/null; then dig +short CNAME "_acme-challenge.$DOMAIN" @8.8.8.8 | sed 's/\.$//' | head -1
  elif command -v host >/dev/null; then host -t CNAME "_acme-challenge.$DOMAIN" 8.8.8.8 | awk '/alias for/ {print $NF}' | sed 's/\.$//' | head -1
  else python3 - <<'PY'
import subprocess
print(subprocess.run(["nslookup","-type=CNAME","_acme-challenge.invites.stackbridgelab.com","8.8.8.8"],capture_output=True,text=True).stdout)
PY
  fi
}

cmd_preflight() {
  say "nginx"; nginx -v 2>&1; nginx -T 2>/dev/null | grep -nE "server_name|default_server|listen" | grep -E "invites|default_server" || true
  say "certificates"; certbot --version; certbot certificates 2>&1 | grep -E "Certificate Name|Domains|Expiry"
  say "certbot renewal timer"; systemctl list-timers 2>/dev/null | grep -i certbot || true
  say "is the app up?"; curl -s -o /dev/null -w "app on 127.0.0.1:8104/api/health -> %{http_code}\n" http://127.0.0.1:8104/api/health
  say "wildcard DNS"; getent hosts "preflight-test.$DOMAIN" || echo "wildcard does not resolve from this server"
  say "acme-dns delegation record"; cname_target || true
  [ -f "$CREDS" ] && echo "acme-dns account exists ($CREDS)" || echo "no acme-dns account yet: run 'register'"
  [ -d /etc/letsencrypt/live/$CERT ] && echo "wildcard certificate already issued" || echo "no wildcard certificate yet"
  [ -f /etc/nginx/sites-enabled/$SITE ] && echo "wildcard virtual host is enabled" || echo "wildcard virtual host not installed yet"
}

install_hook() {
  mkdir -p "$DIR"; chmod 700 "$DIR"
  cat > "$HOOK" <<'HOOKEOF'
#!/usr/bin/env bash
# certbot --manual-auth-hook: publishes the DNS-01 token through acme-dns. $CERTBOT_VALIDATION is set by certbot.
set -Eeuo pipefail
DIR=/etc/letsencrypt/acme-dns
CREDS=$DIR/invites.stackbridgelab.com.json
ACME_DNS=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["server"])' "$CREDS")
u=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["username"])' "$CREDS")
p=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["password"])' "$CREDS")
s=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["subdomain"])' "$CREDS")
body=$(python3 -c 'import json,sys; print(json.dumps({"subdomain":sys.argv[1],"txt":sys.argv[2]}))' "$s" "$CERTBOT_VALIDATION")
curl -fsS --max-time 30 -X POST "$ACME_DNS/update" -H "X-Api-User: $u" -H "X-Api-Key: $p" -d "$body" >/dev/null
sleep 10
HOOKEOF
  chmod 700 "$HOOK"; chown root:root "$HOOK"
}

cmd_register() {
  [ -f "$CREDS" ] && die "an acme-dns account already exists ($CREDS). Its CNAME target is: $(json "$CREDS" fulldomain)"
  install_hook
  say "registering with $ACME_DNS (allowed to update only from this server: $IP)"
  python3 - "$ACME_DNS" "$IP" "$CREDS" <<'PY'
import json, os, sys, urllib.request
server, ip, path = sys.argv[1:4]
req = urllib.request.Request(server + "/register", data=json.dumps({"allowfrom": [ip + "/32"]}).encode(), headers={"Content-Type": "application/json"}, method="POST")
r = json.load(urllib.request.urlopen(req, timeout=30))
r["server"] = server
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w") as f: json.dump(r, f)
PY
  chmod 600 "$CREDS"
  say "ADD THIS ONE DNS RECORD AT BIGROCK (DNS management for stackbridgelab.com), then run 'cert-staging'"
  printf '  Type : CNAME\n  Host : _acme-challenge.invites\n  Value: %s\n  (BigRock may want the host as _acme-challenge.invites.stackbridgelab.com and the value ending with a dot)\n' "$(json "$CREDS" fulldomain)"
}

need_cname() {
  [ -f "$CREDS" ] || die "run 'register' first"
  local want got; want=$(json "$CREDS" fulldomain); got=$(cname_target || true)
  case "$got" in *"$want"*) echo "CNAME is in place: _acme-challenge.$DOMAIN -> $want";; *) die "the CNAME for _acme-challenge.$DOMAIN is not visible yet (expected $want, saw: ${got:-nothing}). Add it at BigRock, wait a few minutes, retry.";; esac
}

issue() { # $1 = extra certbot args, $2 = cert name
  [ -x "$HOOK" ] || install_hook
  certbot certonly --manual --preferred-challenges dns --manual-auth-hook "$HOOK" --non-interactive --agree-tos \
    --cert-name "$2" -d "$WILD" --deploy-hook "systemctl reload nginx" $1
}

cmd_cert_staging() {
  need_cname
  say "staging issuance (the certificate is not trusted by browsers; this only proves the DNS-01 path works)"
  issue "--staging" "$CERT-staging"
  say "staging renewal dry-run through the same hook"
  certbot renew --cert-name "$CERT-staging" --force-renewal --no-random-sleep-on-renew
  say "removing the staging certificate"; certbot delete --cert-name "$CERT-staging" --non-interactive
  echo "OK: issuance and renewal both work. Now run 'cert'."
}

cmd_cert() {
  need_cname
  [ -d /etc/letsencrypt/live/$CERT ] && die "certificate $CERT already exists; nothing to do (renewals run from certbot's own timer)"
  issue "" "$CERT"
  certbot certificates --cert-name "$CERT" | grep -E "Certificate Name|Domains|Expiry|Certificate Path"
  say "dry-run renewal of the real certificate"; certbot renew --cert-name "$CERT" --dry-run
}

cmd_nginx() {
  [ -s /etc/letsencrypt/live/$CERT/fullchain.pem ] && [ -s /etc/letsencrypt/live/$CERT/privkey.pem ] || die "no wildcard certificate yet: run 'cert' first. Nothing was changed."
  [ -f /etc/letsencrypt/options-ssl-nginx.conf ] && [ -f /etc/letsencrypt/ssl-dhparams.pem ] || die "certbot's nginx include files are missing; nothing was changed."
  local conf=/etc/nginx/sites-available/$SITE bk
  bk=/root/nginx-backup-$(date +%Y%m%d-%H%M%S).tgz; tar czf "$bk" -C /etc nginx; echo "backup of /etc/nginx: $bk"
  [ -e "$conf" ] && cp "$conf" "$conf.bak-$(date +%s)"
  install -m 644 "$SRC/nginx-wedding-subdomains.conf" "$conf"
  ln -sfn "$conf" /etc/nginx/sites-enabled/$SITE
  say "nginx -t"
  if ! nginx -t; then rm -f /etc/nginx/sites-enabled/$SITE; die "nginx -t FAILED: the new virtual host was removed again and nginx was NOT reloaded."; fi
  # conflicts: the wildcard name must appear in exactly the files we expect
  nginx -T 2>/dev/null | grep -c "server_name \*.invites.stackbridgelab.com" | xargs echo "wildcard server_name occurrences (expect 2: port 80 and 443):"
  systemctl reload nginx && systemctl is-active nginx
  echo "reloaded. Next: verify SLUG"
}

cmd_rollback() {
  rm -f /etc/nginx/sites-enabled/$SITE
  nginx -t && systemctl reload nginx && echo "wildcard virtual host removed; nginx reloaded. The certificate is kept."
}

cmd_verify() {
  local slug=${1:?usage: verify SLUG}
  local h=$slug.$DOMAIN ok=0 bad=0
  chk() { if eval "$2"; then echo "PASS  $1"; ok=$((ok+1)); else echo "FAIL  $1"; bad=$((bad+1)); fi; }
  chk "wildcard DNS: $h -> $IP" "getent hosts $h | grep -q $IP"
  say "certificate presented for $h"; echo | openssl s_client -connect "$h:443" -servername "$h" 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
  chk "certificate verifies for $h" "echo | openssl s_client -connect $h:443 -servername $h -verify_return_error 2>/dev/null | grep -q 'Verify return code: 0'"
  chk "wedding page 200" "[ \"\$(curl -s -o /dev/null -w %{http_code} https://$h/)\" = 200 ]"
  chk "http redirects to https" "curl -sI http://$h/ | head -1 | grep -q 301"
  chk "unknown slug is 404" "[ \"\$(curl -s -o /dev/null -w %{http_code} https://no-such-wedding-xyz.$DOMAIN/)\" = 404 ]"
  chk "reserved name www is 404" "[ \"\$(curl -s -o /dev/null -w %{http_code} https://www.$DOMAIN/)\" = 404 ]"
  chk "/admin blocked on the wedding address" "[ \"\$(curl -s -o /dev/null -w %{http_code} https://$h/admin)\" = 404 ]"
  chk "/login blocked on the wedding address" "[ \"\$(curl -s -o /dev/null -w %{http_code} https://$h/login)\" = 404 ]"
  chk "main site still 200" "[ \"\$(curl -s -o /dev/null -w %{http_code} https://$DOMAIN/)\" = 200 ]"
  chk "main /login still 200" "[ \"\$(curl -s -o /dev/null -w %{http_code} https://$DOMAIN/login)\" = 200 ]"
  chk "main certificate still valid" "echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN -verify_return_error 2>/dev/null | grep -q 'Verify return code: 0'"
  for other in attendedge.netjetgo.com gcshrms.netjetgo.com gcscrm.netjetgo.com; do
    chk "other app still answers: $other" "curl -s -o /dev/null -m 15 -w %{http_code} https://$other/ | grep -qE '^[23]'"
  done
  say "$ok passed, $bad failed"; [ "$bad" = 0 ]
}

case "${1:-}" in
  preflight) cmd_preflight;; register) cmd_register;; cert-staging) cmd_cert_staging;; cert) cmd_cert;;
  nginx) cmd_nginx;; verify) shift; cmd_verify "$@";; rollback) cmd_rollback;;
  *) sed -n '2,13p' "$0"; exit 1;;
esac
