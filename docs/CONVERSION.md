# Conversion: how the public site turns visitors into customers

The aspiration is a 50–60% visitor-to-paying-customer rate. **That is a target, not a result, and nothing in this
repository claims it has been reached.** What the product now does is *measure* the journey honestly, remove the friction
we can see, and give the studio one page (`/admin/funnel`) that shows the real numbers.

## The funnel, and what each step means

| Stage | What is counted | Where it comes from |
|---|---|---|
| **Visited the site** | distinct browsers that opened any page | `page_view` events |
| **Looked at a design** | distinct browsers that opened a design or an occasion page | `design_view` events |
| **Opened a sample** | distinct browsers that loaded the live preview of a design | `preview_open` events |
| **Started to ask or chat** | distinct browsers that began the enquiry form, tapped a WhatsApp button or began a love gift | `enquiry_start`, `whatsapp_click`, `gift_start` |
| **Sent an enquiry or a gift** | enquiries and gifts sent to us | rows in `leads` |
| **Paid** | orders marked PAID in **Studio → Orders** | `orders` |

Counting is anonymous: a random id kept in the visitor's browser, the page, what was tapped, the device class and where
they came from (`utm_source` or the referring host). No IP address, no fingerprint, no name or number — a person's
details exist only in a lead they chose to send. Bots are ignored.

`/admin/funnel` shows each stage as a count, the share of the previous stage and of all visitors, the designs that attract
the most interest (views, samples opened, enquiries), which sources bring people who ask, and a daily chart (days follow
India's day boundary, not the server's).

**Two rates to watch, because they answer different questions**

* *Visitor → paying* — the number the target talks about. Cold traffic from search or social will never convert at 50%; this
  rate is mostly a measure of how good the traffic is.
* *Enquiry → paying* — how well the conversation on WhatsApp closes. This is the rate the studio controls, and 50–60% is a
  realistic thing to aim for here.

## The baseline

There is **no baseline yet**, because the measurement is new. To establish one:

1. Deploy, and let normal traffic accumulate for at least two weeks (or about 300 visitors, whichever is later).
2. Read `/admin/funnel` for the last 30 days and write the six numbers down with the date.
3. Record every payment in **Orders** — the *Paid* stage is only as accurate as that ledger. Link each paid order to its
   lead (Studio → Enquiries) so the studio can see which designs sell, not just which are looked at.
4. Change one thing at a time (below) and compare like with like: same length of period, similar traffic mix.

## Friction we found, and what we changed

| Friction | Change |
|---|---|
| Visitors saw the same invitation five times with different names and could not tell the designs apart | Five genuinely different designs per occasion, shown side by side as real screenshots of their first screens (home page and every occasion page) |
| Technical or foreign-sounding labels ("Templates", "Categories", "Plan My Wedding Invitation") | Plain wording: *Choose Your Design*, *Create Your Invitation*, *How It Works*, *Help* |
| The only way to start was WhatsApp — impossible for visitors who dislike messaging a stranger, invisible to measurement | A two-field enquiry form (`/start`): name and WhatsApp number are all that is required; WhatsApp remains one tap away everywhere |
| The call to action disappeared as visitors scrolled on a phone | A sticky bar on every public page on phones: *Create Your Invitation* and a WhatsApp button |
| No way to commit from a design the visitor liked | *Use This Design* on every design page opens the enquiry form with that design already chosen |
| Package pages listed features, not who each package is for | Each package says who it is for, what you get and what you do not |
| Love gifts could not be made without talking to someone | A guided builder (`/for-my-love/make`) with a live preview; the only thing left for the studio is publishing |
| No visibility of where visitors drop out | The funnel report |

## Experiments to run next (in this order)

1. **The hero picture.** Show the five-designs strip above the fold on the home page instead of the three phones. Hypothesis:
   visitors who see variety early open a sample more often. Measure: `design_view` → `preview_open`.
2. **A price near the first call to action.** Add the Essential price under "Choose Your Design". Hypothesis: fewer unqualified
   enquiries, a higher enquiry → paying rate.
3. **WhatsApp reply promise.** If the studio can reliably reply within a stated time, say so on `/start/thanks` and test its effect on
   the enquiry → paying rate. (We deliberately do not state a time we cannot keep.)
4. **Enquiry form length.** Compare the two-field form with the same form plus the date. Measure: `enquiry_start` → `enquiry_sent`.
5. **Samples with the visitor's own name.** Let the preview open with a name typed into the form. Larger build; try last.

## What the numbers cannot tell you

* Visitors who go straight to WhatsApp from a link in a message never appear as site visitors; they appear only in the
  *Started to ask or chat* stage if they tapped a button on this site.
* A paid order made from a recommendation, with no enquiry, counts as *Paid* but not as a lead.
* Payments happen outside the site. If the ledger is not kept, the *Paid* stage will read low.
