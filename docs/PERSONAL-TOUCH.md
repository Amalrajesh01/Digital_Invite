# Personal touches — an invitation that knows who is reading it

Feature key `personal_touch` (Luxury). It builds on personal guest links (`personalized_urls`, Signature): a guest who opens
their own link is no longer shown the same page as everyone else.

- [What a guest sees](#what-a-guest-sees)
- [What the client controls, and where](#what-the-client-controls-and-where)
- [How it works](#how-it-works)
- [Rules that keep it safe](#rules-that-keep-it-safe)
- [Deploying](#deploying)
- [Limits, and ideas not built](#limits-and-ideas-not-built)

## What a guest sees

| Where | What | Data it uses |
|---|---|---|
| **The opening** (every style) | "Dear *Priya*," then the couple's message for them in a highlighted card signed with the couple's names, then "You are invited to the wedding of…", then the envelope | the guest's name, relationship, group |
| **Just for you** (after the hero) | a headline that follows their reply (still to reply · confirmed, with a countdown · declined · maybe · today · thank you), their own days with *add to my calendar* (an `.ics` of only their events), their table, room and meal, a travel tip for the city they come from; after the day, their own wish and approved photographs | reply, events visible to their group, `city`, `tableLabel`, `roomLabel`, meal |
| **A message from the couple** | a video or voice message recorded for the guest's group, with up to six photographs "from our past with you"; with no clip, a short note is written for the group and played line by line over the couple's photograph | the guest's group |
| **Their own words** | any section's heading, eyebrow or introduction can say `{first}`, `{name}`, `{relationship}` or `{seats}` (`{first\|friend}` gives a fallback for visitors) | the guest |
| **The pasted link** | the preview WhatsApp shows says "*Priya*, you are invited to…" over a card in the invitation's own colours | the guest's first name |
| **Malayalam** | the guest's name in Malayalam script (`nameLocal`) is used in a Malayalam invitation | `nameLocal` |

A visitor without a personal link sees none of this, and the personal sections are not even sent to their browser.

## What the client controls, and where

Everything is in the client's own login (`/client/{wedding}`); the Super Admin sees the same screens under `/admin/weddings/{id}`.

- **Guests → a guest**: *Message for this guest* (English and the invitation's language) with **Write one for me** / **Write another**;
  *Name in Malayalam*; *Coming from*; *Table*; *Room*. **Write messages for everyone** fills in every guest who has none (it never replaces a message the
  client wrote). The CSV import accepts `name_local, city, table, room`.
- **Personal touches**: show or hide the personal sections; whether a message is written for guests who have none; the sign-off; a *sample guest*
  that shows how the messages sound; **a message for each group** (heading, lines, a video or voice clip, up to six photographs) with *Everyone else* as the
  last entry; **travel tips by city**; **Publish** and **Preview as a guest**.
- Changes save as a draft like the rest of the invitation and reach guests when the client publishes.

## How it works

```
guest link ─▶ resolveGuestContext (name, nameLocal, relationship, group, city, table, room)
            ─▶ assemble() in src/domain/wedding/public.ts
                 ├─ guestGreeting()   couple's own message → relationship greeting → heartfelt message → general greeting
                 ├─ filterDocForGuest()  personalFor(): only THIS guest's group entry and city tip stay in the document
                 └─ visibleSections()    adds "foryou" and "groupmessage" after the hero (feature, guest and phase rules apply)
            ─▶ Gate (GateNote) · ForYouSection · GroupMessageSection  (src/invitation)
```

- **The message bank** is `src/domain/guests/messages.ts`: three messages per kind of relationship (elder, aunt/uncle, sibling, cousin, close friend, friend, colleague,
  neighbour, mentor, family, anyone) in English and Malayalam, written in the couple's voice with no gender assumed. A guest always gets the same words; two guests of the
  same kind usually get different ones. It is plain text from the repository — nothing is generated at request time, no guest data leaves the server, and the couple can
  edit any word. **Have a Malayalam speaker read the Malayalam lines before a new one ships.**
- **The default message reel** (no clip recorded) is the group's note from the same file, played over the couple's photograph (`useSlot("couple")`).
- **Sections are a package feature, not template content**, so they are added to every design and to invitations published before they existed. A design that
  already contains a `foryou` or `groupmessage` section keeps its own.
- **Tokens** are filled in by `src/domain/guests/personalize.ts` (pure, browser and server). A message that itself starts "Dear Priya Nair," is shown without that
  line, because the envelope already says it.

## Rules that keep it safe

- A guest's browser receives only the entry for **their** group (or *Everyone else*) and the tip for **their** city — see `personalFor` and its tests. Another group's
  words, clip and photographs are not in the page, and not resolved from the media table.
- Table and room are free text typed by the couple: the system never reveals another guest's name.
- The preview card (`/api/og/{slug}/{token}`) answers 404 for a wrong or revoked link, an unpublished invitation or a package without the feature, shows the first name only
  and is drawn in Latin letters (a Malayalam name appears in the page title, not on the card).
- `/api/public/{slug}/mine` returns only the holder's own wish and approved photographs, and only where the package has the feature.
- A couple's text is always rendered as text. There is no markup in messages, notes or tips.

## Deploying

1. `stackbridge-deploy` applies migration `0010_personal_touch` (four additive columns on `guests`, and one `UPDATE` that adds `personal_touch` to the stored **Luxury**
   package — `ensurePackages` never overwrites a stored package, so a new feature key must be added to it by a migration). Nothing else is changed.
2. Existing Luxury invitations show the opening message and "Just for you" to guests with a personal link as soon as the new code is live (auto messages are on by
   default). Signature and Essential invitations look exactly as before. To keep a Luxury invitation as it was, switch the personal sections off in *Personal touches*.
3. Grant it to one wedding without the package: Studio → the wedding → Features → *Personal touches throughout*.

## Limits, and ideas not built

- **No real AI video.** A group's clip is recorded or uploaded by the couple; the default is the written reel. A generated talking-head or voice would need a
  third-party service, a key and a per-clip cost, and must never be presented as the couple speaking.
- The message bank is not a language model: it cannot refer to a shared memory. A couple who wants that writes it (the per-guest message always comes first).
- Not built: a count such as "8 of your college friends are coming" (needs the couple's consent and a privacy rule), seating charts that list tablemates, automatic
  Malayalam transliteration of names, hotel and room assignment from the accommodation module.
