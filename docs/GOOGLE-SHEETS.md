# The daily Google Sheet

For an **Essential** invitation (no client dashboard) you give the client a Google Sheet instead. Every day at **6 pm India time** the
sheet is rewritten with the latest guests, replies and views. Invitations that have the client dashboard are not touched and do not
show the tab.

The sheet has three tabs: **Summary** (who is coming, how many people, views), **Guests & replies** (every guest, reply, meal, note)
and **Daily views**. Whatever is typed into those tabs is replaced at the next update.

## How it works (so the setup makes sense)

Google does not let a server open your sheets as you. Instead you create a **robot account** once (a "service account"). It has its own
email address. You share each client's sheet with that address, exactly like sharing with a person. The server signs in as the robot
and writes to the sheets that were shared with it — nothing else. Your own Google password is never needed and never stored.

## One-time setup (about ten minutes)

1. Go to <https://console.cloud.google.com> and sign in with the Google account you want to own this (the studio's account).
2. Top bar → project picker → **New project** → name it `invites-sheets` → **Create**. Make sure it is the selected project.
3. Menu → **APIs & Services → Library** → search **Google Sheets API** → **Enable**.
4. Menu → **IAM & Admin → Service accounts → Create service account**. Name: `invites-sheets`. Skip the optional role/access steps → **Done**.
5. Click the new service account → **Keys** tab → **Add key → Create new key → JSON → Create**. A `.json` file downloads.
   **This file is a password.** Do not email it, paste it in chat or commit it.
6. Put it on the server as one environment variable. On the Hetzner box, as the `deploy` user:

   ```bash
   cd ~/apps/stackbridge-invites
   # turns the downloaded file into one line of base64 and appends it to .env.production
   printf 'GOOGLE_SERVICE_ACCOUNT_JSON=%s\n' "$(base64 -w0 /path/to/the-downloaded-file.json)" >> .env.production
   chmod 600 .env.production
   ```

   (Copy the file to the server first with `scp`, then delete both copies when done.) The plain one-line JSON also works.
   On Vercel: **Project → Settings → Environment Variables → `GOOGLE_SERVICE_ACCOUNT_JSON`** → paste the base64 text.
7. Restart the app (`stackbridge-deploy` does this, or `systemctl restart stackbridge-invites`).

Open any Essential wedding in the Studio → **Daily sheet**. The warning "Google is not connected" is gone and the robot's email address
is shown with a Copy button. That is how you know step 6 worked.

## For each client

1. <https://sheets.google.com> → **Blank** → name it after the wedding.
2. **Share** → paste the robot's email (the Daily sheet tab shows it) → **Editor** → uncheck "Notify people" → **Share**.
3. Share it with the client as **Viewer** (so they cannot change it) and send them the link.
4. In the Studio, Daily sheet tab → paste the sheet's address → **Save** → **Send now**. Open the sheet: three tabs appear.

If it fails, the card under the buttons says why. "Not shared" → step 2. "Not found" → check the link.

## The 6 pm schedule

| Where | What to do |
|---|---|
| **Vercel** | Nothing. `vercel.json` already runs `/api/cron/sheets` at `30 12 * * *` (12:30 UTC = 6:00 pm IST). Set `CRON_SECRET` in the project. |
| **Hetzner (crontab)** | Add the line below to the `deploy` user's crontab (`crontab -e`). |

```cron
30 12 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:8104/api/cron/sheets
```

That line assumes the server clock is UTC: run `date` and check it says `UTC`. If it shows another zone, convert 18:00 India time to that
zone yourself. Cron does not read `.env.production`, so define the secret in the crontab too: a line `CRON_SECRET=...` above the job
(the crontab is private to the user).

Test it by hand any time:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:8104/api/cron/sheets
# {"ok":true,"synced":3,"failed":0}
```

`ok:false` with `GOOGLE_SERVICE_ACCOUNT_JSON is not set` means step 6 or 7 is missing. A failing sheet never stops the others; each
sheet's own status is on its Daily sheet tab.

## Limits worth knowing

* Google allows about 60 writes per minute per user. A sheet takes four calls, so a few hundred clients a day is fine; far beyond that
  the job should pause between sheets.
* The sheet is **rewritten**, not appended: edits typed into the three tabs are lost at 6 pm. Extra tabs the client adds are kept.
* Anyone the sheet is shared with can see guest names, phone numbers and notes. Share it only with the client.
* Rotating the key: create a new key in Google, replace the variable, restart, then delete the old key in Google.
