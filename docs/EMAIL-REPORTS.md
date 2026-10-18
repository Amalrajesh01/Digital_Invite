# Email, and the daily PDF report

For an **Essential** invitation (no client dashboard) the owner gets a PDF report by email every day at **6 pm India time**, and the
platform owner can send it at any moment with **Send now**. Invitations that have the client dashboard are not touched and do not show
the tab.

The PDF has: the headline numbers (guests, replied, coming and how many people, maybe, not coming, not replied), who replied in the last
24 hours, invitation views for the last 14 days, meal choices, and every guest with their reply. Guests' phone numbers and email
addresses are **not** in it.

## 1. Set up the mail account (once, in the Studio)

Studio → **Settings → Email**. Nothing is edited on the server; the password is stored encrypted in the database and is never shown
again. After saving, use **Send test email** to prove it works.

### With a Gmail account

1. Google Account → **Security** → turn on **2-Step Verification** (Google only offers app passwords after this).
2. Open <https://myaccount.google.com/apppasswords>, type a name such as `Invites`, **Create**, and copy the 16 letters. Spaces do not matter.
3. In Settings → Email click **Use Gmail**, then fill in:

   | Field | Value |
   |---|---|
   | Mail server | `smtp.gmail.com` (filled in by *Use Gmail*) |
   | Port | `465` |
   | Use SSL | on |
   | Username | your full Gmail address |
   | Password | the 16-letter app password (**not** your normal password) |
   | Sender name | what people see, e.g. `Invites by Stack Bridge Labs` |
   | Sender email | leave empty (it is the Gmail address; Gmail always sends from the account itself) |

4. **Save**, then **Send test email** to your own address. A green "Sent" appears, and the message arrives (check spam the first time).

Gmail allows about 500 emails a day, which is far more than the reports need. A Google Workspace address works the same way. Any other
provider works too: type its SMTP server and port (`465` with SSL on, or `587` with SSL off).

### What it also does

The same account sends the other platform emails (client sign-in links and invitation emails), which until now were only kept in the
outbox. If `RESEND_API_KEY` is set on the server it is used only while no account is saved here.

## 2. For each Essential client

Studio → the wedding → **Daily report**:

1. Type the owner's email address (it starts as the wedding's contact email). Several addresses: separate with commas, up to 5.
2. Leave **Email it every day at 6 pm** on.
3. **Save**, then **Send now** to send the first one yourself. **Download PDF** shows exactly what the owner will get.

If something is wrong, the card under the buttons says what, in plain words ("The mail server did not accept the username or password…").

## 3. The 6 pm schedule

| Where | What to do |
|---|---|
| **Vercel** | Nothing. `vercel.json` runs `/api/cron/reports` at `30 12 * * *` (12:30 UTC = 6:00 pm IST). `CRON_SECRET` must be set. |
| **Hetzner (crontab)** | Add the two lines below to the `deploy` user's crontab (`crontab -e`). |

```cron
CRON_SECRET=the-same-value-as-in-.env.production
30 12 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:8104/api/cron/reports
```

That assumes the server clock is UTC: run `date` and check it says `UTC`. If it shows another zone, convert 18:00 India time to that zone
yourself. Cron does not read `.env.production`, which is why the secret is repeated in the crontab (the crontab is private to the user).

Test it by hand any time:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:8104/api/cron/reports
# {"ok":true,"sent":3,"failed":0}
```

`ok:false` with "Email is not set up" means Settings → Email has no saved account. A failing report never stops the others; each one's
status is on its Daily report tab.

## Limits worth knowing

* The daily email goes on every day until the switch on the wedding's Daily report tab is turned off. There is no automatic stop after
  the wedding date; switch it off when the event is over.
* The PDF is set in Noto Sans and Noto Sans Malayalam (`assets/fonts`). Names in other scripts (Tamil, Hindi, …) show as empty boxes; add that
  script's Noto font in `src/domain/reports/pdf.ts` when a client needs it.
* Anyone who receives the email can forward the PDF. Send it only to the owner.
* If `APP_SECRET` is ever changed, the saved mail password can no longer be read: Settings → Email asks for it again.
* Changing the mail account in Settings clears the last test result, so run **Send test email** again after any change.
