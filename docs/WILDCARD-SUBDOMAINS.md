# Wedding addresses: server setup (`{slug}.invites.stackbridgelab.com`)

The application side ships in the code (`src/lib/hosts.ts`, `src/proxy.ts`, `next.config.ts`). The server side is one-time work, done by
`deploy/wildcard-subdomains.sh` (run as root on the server, after `stackbridge-deploy`). Do not share any subdomain link before step 6:
the app sends HSTS with `includeSubDomains`, so a browser cannot click through a certificate error on a subdomain.

DNS already has `*.invites.stackbridgelab.com A 65.108.245.110`.

```bash
ssh -i ~/.ssh/netjet_hetzner root@65.108.245.110
S=/home/deploy/src/stackbridge-invites/deploy/wildcard-subdomains.sh
```

1. **Deploy the code first:** `stackbridge-deploy` (from your machine: `ssh -i ~/.ssh/netjet_hetzner root@65.108.245.110 "stackbridge-deploy"`). The main site must stay healthy; the script checks `/api/health`.
2. `bash $S preflight` — read-only. Shows nginx, certificates, the renewal timer, whether the app is up, and what is still missing.
3. `bash $S register` — creates a free acme-dns account (restricted to this server's IP) and prints **the one DNS record** to add at BigRock:
   `CNAME  _acme-challenge.invites  →  <value printed by the script>`. Add it, wait a few minutes.
4. `bash $S cert-staging` — issues against Let's Encrypt **staging** and runs a renewal through the same hook, then deletes the staging certificate. Proves the DNS challenge and the renewal path without touching anything real.
5. `bash $S cert` — the real certificate `invites-wildcard` for `*.invites.stackbridgelab.com`, with a renewal dry-run. Renewal then runs from certbot's own timer (`snap.certbot.renew.timer`) and reloads nginx.
6. `bash $S nginx` — installs `deploy/nginx-wedding-subdomains.conf` as its own file (`sites-available/invites-wildcard.stackbridgelab.com`), backs up `/etc/nginx`, runs `nginx -t`, and reloads **only if it passes**; on failure it removes the new file again.
7. `bash $S verify SLUG` — DNS, certificate, wedding page, redirect, 404s, blocked admin, main site, and the other apps on this server.

**Roll back:** `bash $S rollback` removes the wildcard virtual host (certificate and DNS stay). The application change is rolled back by redeploying the previous commit.

**Safety properties:** the existing `invites.stackbridgelab.com` certificate and virtual host are never edited (nginx prefers an exact `server_name` over the wildcard); no other virtual host is touched; the wildcard block is not a `default_server`; the nginx step refuses to run without the certificate; the acme-dns credentials live in `/etc/letsencrypt/acme-dns/` (root, mode 600) and the hook that root executes is copied there from the repository rather than run from the deploy user's checkout.

**Known limits:** the DNS challenge depends on the public acme-dns service (`auth.acme-dns.io`) at renewal time (every ~60 days; set `ACME_DNS=https://your-own-instance` before `register` to self-host instead); a failed renewal affects only the subdomains, never the main site (separate certificate); `preflight`/`verify` and the hook have been syntax-checked but this script has not yet been run on the server.
