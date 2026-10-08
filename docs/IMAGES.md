# Imagery guide

Three kinds of picture appear in this product, and each is handled differently.

1. **A customer's own photographs** — the real content of every invitation. Always uploaded through the **Media
   library** (Studio → wedding → Media), never linked from another site.
2. **The demonstration photographs** — bundled stock photographs in `assets/stock/` (credits and licence in
   `assets/stock/CREDITS.md`). The seed uploads them exactly like a customer's photos.
3. **Brand and marketing images** for the landing page and social previews.

Nothing in an invitation is hot-linked, so an invitation can never show a broken remote image. If an upload is
missing, or fails to load, the `<Photo>` component draws a themed placeholder instead of a grey box.

## Named photograph slots — replacing a photo without touching code

Every photograph an invitation shows belongs to a **named slot**, declared in one file:
[`src/domain/imagery/slots.ts`](../src/domain/imagery/slots.ts). Sections never reach into the document for "the
bride's picture" — they ask for a slot (`useSlot("couple")`), and the slot decides which uploaded photo fills it and
what it falls back to. In the studio these are the **Key photographs** (Media step); in the visual editor, the hero
panel. Choosing a photograph for a slot changes it everywhere it appears.

| Slot | Where it appears | Recommended crop | If empty |
|---|---|---|---|
| `couple` | Full-screen hero, "Our story", thank-you page, WhatsApp preview | Portrait 2:3, ≥ 1600 px tall, faces in the upper half | first gallery photo → a portrait |
| `coupleWide` | Hero on tablets and desktops (art direction) | Landscape 16:9 or 3:2, ≥ 2400 px wide | the portrait, cropped |
| `bride`, `groom` | "Meet the couple" | Portrait 4:5 | themed placeholder |
| `ceremony` | Ceremonies section banner | Landscape 3:2 | no banner |
| `family` | "With the blessings of our parents" | Landscape 3:2 | typography only |
| `story` | Beside the opening lines of "Our story" | Portrait 4:5 | "how we met" photo → couple photo |
| `venue` | Venue & map, ceremony venue card | Landscape 16:9 | themed placeholder |
| gallery | Gallery section (albums in the Media library) | Any — mix portrait and landscape | section hidden |

Other photograph fields (event photos, ceremony photos, milestone photos, family-member portraits, the film's cover)
are ordinary media pickers on the item they belong to.

**Hero focal point.** In the Media library, set a photograph's focal point (the faces). The hero is cropped to
every screen shape with `object-position` from that point, so faces stay clear of the text. For the best result
upload a portrait photograph (phones) *and* a landscape one (`coupleWide`) of the same moment.

**Photographs, not illustrations.** Use real photographs of real people for the couple, the bride and groom and the
family. Use illustration only for backgrounds and textures. Always write alt text (Media library → alt).

## Brand & marketing images (landing page / social)

Generate at the sizes below, drop them in `public/brand/` and reference them from `src/app/page.tsx`. Keep the
StackBridge look: deep navy `#0b1b35`, blue `#3056d3` / `#4a6cf7`, cool white `#f5f7fb`.

| Slot | Size | Prompt idea |
|---|---|---|
| Landing hero backdrop | 2400×1400 | "Soft abstract navy-to-blue gradient with faint geometric hexagon grid, subtle depth, no text, premium software brand" |
| Social share image | 1200×630 | Already generated: `public/brand/og-image.jpg` (`node scripts/brand-assets.mjs`) |
