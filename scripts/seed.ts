/**
 * Seeds the platform: packages, templates, themes, the Super Admin and beautiful demonstration weddings.
 *   npm run db:seed            → everything
 *   SEED_DEMO=false npm run db:seed   → platform data + admin only (production)
 */
import { eq } from "drizzle-orm";
import { closeDb, getDb, schema } from "../src/db/client";
import { ensurePackages } from "../src/domain/packages/service";
import { ensureDesignLibrary } from "../src/domain/design/service";
import { assignClientToWedding, ensureSuperAdmin, changePassword } from "../src/domain/auth/service";
import { loadActorForUser, type AdminActor } from "../src/domain/auth/access";
import { createWedding, getWedding, publishWedding, saveDraft } from "../src/domain/wedding/service";
import { addToAlbum, ingestFile, saveAlbum, saveTrack, moderateMedia, type MediaCategory } from "../src/domain/media/service";
import { createGuest, ensureInvite } from "../src/domain/guests/service";
import { resolveGuestContext } from "../src/domain/guests/context";
import { submitGuestRsvp } from "../src/domain/guests/rsvp";
import { participantFromGuest, submitMessage, moderateMessage, submitGuestUpload } from "../src/domain/participation/service";
import { syncCapsule, submitCapsuleItem, saveMemoryBook, saveAnniversaryEntry } from "../src/domain/memory/service";
import { postLiveUpdate } from "../src/domain/live/service";
import { PACKAGE_DEFAULTS } from "../src/domain/packages/catalog";
import type { PackageKey } from "../src/domain/packages/features";
import { env } from "../src/lib/env";
import { galleryScenes, heroScene, pookalamPuzzle, portraitScene, storyScenes, toJpeg, toSepia, venueScene } from "./demo/art";
import { makeAmbientWav, makeMelodyWav } from "./demo/audio";
import { buildDemoDoc, DEMO, type DemoMedia } from "./demo/content";
import { buildAnanyaDoc, ANANYA, type AnanyaMedia } from "./demo/ananya";
import { STOCK, stockPhoto } from "./demo/photos";
import sharp from "sharp";

const L = (en: string, ml?: string): Record<string, string> => (ml ? { en, ml } : { en });
/** Kerala gallery: [stock photo id, English caption, Malayalam caption]. */
const GALLERY_STOCK: [string, string, string][] = [
  ["Xqa_NWl4xEY", "Radiant in kanjivaram silk", "കാഞ്ചീപുരം പട്ടിൽ തിളങ്ങുന്നവൾ"],
  ["rjgFxE3eARQ", "Among the golden blossoms", "സുവർണ്ണ പൂക്കൾക്കിടയിൽ"],
  ["SiMzEeMrX2E", "A father, a child, a garland", "ഒരച്ഛൻ, ഒരു കുഞ്ഞ്, ഒരു മാല"],
  ["lj6_-FoCHng", "The vintage car, the old church", "പഴയ കാർ, പഴയ പള്ളി"],
  ["ykcXm_u84sg", "Petals, and a promise", "ദളങ്ങൾ, ഒരു വാഗ്ദാനം"],
  ["0mYmjAkmScE", "The hall, lit for the evening", "സന്ധ്യയ്ക്കായി തെളിച്ച ഹാൾ"],
  ["VJP7K4uihUA", "Family, in kasavu", "കസവിൽ, കുടുംബം"],
  ["b9xLrj7w2AY", "Walking home together", "ഒരുമിച്ച് വീട്ടിലേക്ക് നടക്കുമ്പോൾ"],
];
/** Fallback captions for the illustrated art, used only if the stock photographs are not on disk. */
const GALLERY_CAPTIONS: [string, string][] = [
  ["The lamp that will light our home", "ഞങ്ങളുടെ വീടിന് വെളിച്ചമേകുന്ന വിളക്ക്"],
  ["Jasmine, strung by Ammamma", "അമ്മമ്മ കോർത്ത മുല്ലപ്പൂമാല"],
  ["Sunrise on the backwaters", "കായലിലെ പുലരി"],
  ["The pookalam at the gate", "ഗേറ്റിലെ പൂക്കളം"],
  ["Sadhya, served on banana leaf", "വാഴയിലയിൽ വിളമ്പിയ സദ്യ"],
  ["The temple at dusk", "സന്ധ്യയിലെ ക്ഷേത്രം"],
  ["Bangles for the bride", "വധുവിനുള്ള വളകൾ"],
  ["Kasavu, woven in gold", "സ്വർണ്ണത്തിൽ നെയ്ത കസവ്"],
];

let cache: Awaited<ReturnType<typeof renderArt>> | null = null;
async function renderArt() {
  const scenes = galleryScenes();
  const story = storyScenes();
  const order = ["lamp", "garland", "boat", "pookalam", "sadhya", "gopuram", "bangles", "kasavu"];
  return {
    hero: await toJpeg(heroScene(), 1800),
    bride: await toJpeg(portraitScene("bride"), 1200),
    groom: await toJpeg(portraitScene("groom"), 1200),
    venue: await toJpeg(venueScene(), 1800),
    gallery: await Promise.all(order.map((k) => toJpeg(scenes[k], 1200))),
    cafe: await toJpeg(story.cafe, 1400),
    corridor: await toJpeg(story.corridor, 1400),
    train: await toJpeg(story.train, 1400),
    thenA: await toSepia(story.corridor, 1000),
    thenB: await toJpeg(story.train, 1000),
    puzzleA: await toJpeg(pookalamPuzzle("a"), 1200),
    puzzleB: await toJpeg(pookalamPuzzle("b"), 1200),
    og: await toJpeg(heroScene(), 1200),
    music: makeAmbientWav(),
    clipA: makeMelodyWav([[0, 1], [2, 1], [4, 1.5], [2, 0.5], [0, 2], [3, 1], [4, 2]]),
    clipB: makeMelodyWav([[4, 1], [3, 1], [2, 1.5], [0, 0.5], [2, 1], [4, 1], [3, 2]], 84),
  };
}

async function upload(weddingId: string, buf: Buffer, name: string, category: MediaCategory, allow: ("IMAGE" | "AUDIO")[] = ["IMAGE"], extra: { caption?: Record<string, string>; alt?: Record<string, string> } = {}) {
  return ingestFile({ weddingId, buffer: buf, filename: name, category, allow, source: "SYSTEM", retention: "PERMANENT", ...extra });
}

/** Uploads one bundled photograph (once per wedding) and sets its focal point so faces survive cropping. */
async function stockAsset(weddingId: string, id: string, category: MediaCategory, cache: Map<string, string>, extra: { caption?: Record<string, string>; alt?: Record<string, string> } = {}): Promise<string | null> {
  const hit = cache.get(id);
  if (hit) return hit;
  const buf = stockPhoto(id);
  if (!buf) return null;
  const info = STOCK[id];
  const asset = await upload(weddingId, buf, `${id}.jpg`, category, ["IMAGE"], { alt: extra.alt ?? { en: info?.alt ?? "" }, caption: extra.caption });
  if (info?.focal) {
    const db = await getDb();
    await db.update(schema.mediaAssets).set({ focalX: info.focal.x, focalY: info.focal.y }).where(eq(schema.mediaAssets.id, asset.id));
  }
  cache.set(id, asset.id);
  return asset.id;
}

const sepia = (buf: Buffer) => sharp(buf).resize({ width: 1000 }).modulate({ saturation: 0.3 }).tint({ r: 190, g: 160, b: 120 }).jpeg({ quality: 84 }).toBuffer();
const social = (buf: Buffer) => sharp(buf).resize(1200, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 84 }).toBuffer();

interface DemoSpec {
  slug: string;
  title: string;
  pkg: PackageKey;
  template: string;
  theme: string;
  full: boolean;
  clientEmail?: string;
  /** "auto" follows the event type; "confetti" shows the side-cannon confetti instead of petals. */
  celebration?: "auto" | "petals" | "confetti" | "off";
}

async function seedWedding(admin: AdminActor, spec: DemoSpec) {
  const db = await getDb();
  const [existing] = await db.select({ id: schema.weddings.id }).from(schema.weddings).where(eq(schema.weddings.slug, spec.slug));
  if (existing) {
    console.log(`  • ${spec.slug} already exists — skipping`);
    return existing.id;
  }
  const [tpl] = await db.select().from(schema.templates).where(eq(schema.templates.slug, spec.template));
  const [thm] = await db.select().from(schema.themes).where(eq(schema.themes.slug, spec.theme));
  const w = await createWedding(admin, { title: spec.title, slug: spec.slug, packageKey: spec.pkg, customerClass: "FREE_PORTFOLIO", templateId: tpl.id, themeId: thm.id, defaultLocale: "en", secondaryLocale: "ml", weddingDate: DEMO.date });
  await db.update(schema.weddings).set({ isDemo: true, contactEmail: "family@example.com" }).where(eq(schema.weddings.id, w.id));
  const art = (cache ??= await renderArt());

  // media — real photographs when the bundled stock is present, the procedural illustrations otherwise
  const assets = new Map<string, string>();
  const sid = (k: string, c: MediaCategory, extra?: { caption?: Record<string, string>; alt?: Record<string, string> }) => stockAsset(w.id, k, c, assets, extra);
  const hero = { id: (await sid("Zx9In5UiU0w", "COUPLE", { alt: L("Meenakshi and Aravind laughing together in a garden, she holding a lotus, he in a mundu", "പൂന്തോട്ടത്തിൽ ചിരിച്ചുകൊണ്ട് താമരപ്പൂവുമായി മീനാക്ഷിയും മുണ്ടുടുത്ത അരവിന്ദും") })) ?? (await upload(w.id, art.hero, "hero.jpg", "COUPLE", ["IMAGE"], { alt: L("Meenakshi and Aravind on the jetty at dusk", "സന്ധ്യയിൽ ജെട്ടിയിൽ മീനാക്ഷിയും അരവിന്ദും") })).id };
  const bride = { id: (await sid("Rm9DL9DmGi4", "BRIDE", { alt: L("Portrait of Meenakshi in a gold and red silk saree", "സ്വർണ്ണ-ചുവപ്പ് പട്ടുസാരിയിൽ മീനാക്ഷിയുടെ ചിത്രം") })) ?? (await upload(w.id, art.bride, "bride.jpg", "BRIDE", ["IMAGE"], { alt: L("Portrait of Meenakshi", "മീനാക്ഷിയുടെ ചിത്രം") })).id };
  const groom = { id: (await sid("gXWVyFpRCRU", "GROOM", { alt: L("Portrait of Aravind in a white sherwani", "വെള്ള ഷെർവാണിയിൽ അരവിന്ദിന്റെ ചിത്രം") })) ?? (await upload(w.id, art.groom, "groom.jpg", "GROOM", ["IMAGE"], { alt: L("Portrait of Aravind", "അരവിന്ദിന്റെ ചിത്രം") })).id };
  const venue = { id: (await sid("UX3-_dGbCzk", "VENUE", { alt: L("The pavilion stage under a banyan tree strung with marigold garlands at golden hour", "സ്വർണ്ണ വെളിച്ചത്തിൽ ജമന്തിമാലകൾ തൂക്കിയ ആൽമരത്തിന് കീഴിലെ പവലിയൻ വേദി") })) ?? (await upload(w.id, art.venue, "venue.jpg", "VENUE", ["IMAGE"], { alt: L("Vembanad Heritage Pavilion at golden hour", "സ്വർണ്ണ വെളിച്ചത്തിൽ വേമ്പനാട് ഹെറിറ്റേജ് പവലിയൻ") })).id };
  const heroBuf = stockPhoto("Zx9In5UiU0w");
  const og = await upload(w.id, heroBuf ? await social(heroBuf) : art.og, "og.jpg", "OTHER");
  const gallery: DemoMedia["gallery"] = [];
  for (let i = 0; i < GALLERY_STOCK.length; i++) {
    const [sidKey, en, ml] = GALLERY_STOCK[i];
    const stockId = await sid(sidKey, "GALLERY", { caption: L(en, ml), alt: L(en, ml) });
    if (stockId) { gallery.push({ id: stockId, caption: L(en, ml), alt: L(en, ml) }); continue; }
    const [cen, cml] = GALLERY_CAPTIONS[i];
    const a = await upload(w.id, art.gallery[i], `gallery-${i + 1}.jpg`, "GALLERY", ["IMAGE"], { caption: L(cen, cml), alt: L(cen, cml) });
    gallery.push({ id: a.id, caption: L(cen, cml), alt: L(cen, cml) });
  }
  const coffeeId = await sid("ZghCtT63KMk", "COUPLE");
  const corridorId = gallery[3].id;
  const trainId = gallery[7].id;
  const cafe = { id: coffeeId ?? (await upload(w.id, art.cafe, "story-cafe.jpg", "COUPLE")).id };
  const corridor = { id: coffeeId ? corridorId : (await upload(w.id, art.corridor, "story-corridor.jpg", "COUPLE")).id };
  const train = { id: coffeeId ? trainId : (await upload(w.id, art.train, "story-train.jpg", "COUPLE")).id };
  const thenSrc = stockPhoto("lj6_-FoCHng"), nowSrc = stockPhoto("ZghCtT63KMk");
  const thenA = await upload(w.id, thenSrc ? await sepia(thenSrc) : art.thenA, "then.jpg", "COUPLE");
  const thenB = await upload(w.id, nowSrc ? await sharp(nowSrc).resize({ width: 1000 }).jpeg({ quality: 84 }).toBuffer() : art.thenB, "now.jpg", "COUPLE");
  const familyId = await sid("VJP7K4uihUA", "FAMILY");
  const varavelppu = await sid("SiMzEeMrX2E", "EVENT");
  const thalikettu = await sid("b9xLrj7w2AY", "EVENT");
  const pudava = await sid("rjgFxE3eARQ", "EVENT");
  const puzzleA = spec.full ? await upload(w.id, art.puzzleA, "puzzle-a.jpg", "OTHER") : null;
  const puzzleB = spec.full ? await upload(w.id, art.puzzleB, "puzzle-b.jpg", "OTHER") : null;
  const clipA = spec.full ? await upload(w.id, art.clipA, "clip-a.wav", "MUSIC", ["AUDIO"]) : null;
  const clipB = spec.full ? await upload(w.id, art.clipB, "clip-b.wav", "MUSIC", ["AUDIO"]) : null;

  // album + gallery
  const album = await saveAlbum(admin, w.id, { title: L("Pre-wedding stories", "വിവാഹപൂർവ കഥകൾ"), kind: "OFFICIAL", coverAssetId: gallery[2].id });
  await addToAlbum(admin, w.id, album.id, gallery.map((g) => g.id));

  // music
  const track = await upload(w.id, art.music, "sandhya-raagam.wav", "MUSIC", ["AUDIO"]);
  await saveTrack(admin, w.id, { assetId: track.id, title: "Sandhya Raagam", artist: "StackBridge Studio (ambient)", isPrimary: true, inPlaylist: true });
  if (clipA && clipB) {
    await saveTrack(admin, w.id, { assetId: clipA.id, title: "The Lamp Lullaby", artist: "Demo melody", inPlaylist: true });
    await saveTrack(admin, w.id, { assetId: clipB.id, title: "The Boat Song", artist: "Demo melody", inPlaylist: true });
  }

  const media: DemoMedia = {
    hero: hero.id, bride: bride.id, groom: groom.id, venue: venue.id, gallery,
    story: { cafe: cafe.id, corridor: corridor.id, train: train.id, thenA: thenA.id, thenB: thenB.id },
    puzzleA: puzzleA?.id ?? "", puzzleB: puzzleB?.id ?? "", clipA: clipA?.id ?? "", clipB: clipB?.id ?? "", og: og.id,
    family: familyId ?? undefined,
    storyPhoto: coffeeId ?? undefined,
    milestones: coffeeId ? { umbrella: corridorId, coffee: coffeeId, train: trainId, proposal: gallery[4].id } : undefined,
    ceremonies: { varavelppu: varavelppu ?? undefined, thalikettu: thalikettu ?? undefined, pudava: pudava ?? undefined },
  };
  const cur = await getWedding(admin, w.id);
  const doc = buildDemoDoc(cur.draftDoc, media, { full: spec.full });
  // Package-specific tuning of what the demo turns on
  if (spec.pkg === "ESSENTIAL") doc.rsvp.askEventResponses = false;
  if (spec.celebration) doc.opening.celebration = spec.celebration;
  await saveDraft(admin, w.id, doc);

  // people (Signature & Luxury)
  if (spec.pkg !== "ESSENTIAL") await seedPeople(admin, w.id, spec.slug, spec.pkg, gallery, art);

  // client login (Signature & Luxury)
  if (spec.clientEmail) {
    const c = await assignClientToWedding(admin, { weddingId: w.id, email: spec.clientEmail, name: "Anagha Nair", role: "OWNER" });
    await changePassword(c.id, null, "Demo-Client-123");
  }

  await publishWedding(admin, w.id, { label: "Launch" });
  console.log(`  ✔ ${spec.slug}  (${spec.pkg})`);
  return w.id;
}

/**
 * Ananya & Arjun — the English-only north Indian showcase (Hindu wedding in Udaipur, 12 Dec 2026).
 * Every photograph is a bundled stock picture uploaded through the normal media pipeline.
 */
async function seedAnanya(admin: AdminActor) {
  const db = await getDb();
  const [existing] = await db.select({ id: schema.weddings.id }).from(schema.weddings).where(eq(schema.weddings.slug, ANANYA.slug));
  if (existing) {
    console.log(`  • ${ANANYA.slug} already exists — skipping`);
    return existing.id;
  }
  const [tpl] = await db.select().from(schema.templates).where(eq(schema.templates.slug, "cinematic-noir"));
  const [thm] = await db.select().from(schema.themes).where(eq(schema.themes.slug, "royal-gold"));
  const w = await createWedding(admin, { title: ANANYA.title, slug: ANANYA.slug, packageKey: "LUXURY", customerClass: "FREE_PORTFOLIO", templateId: tpl.id, themeId: thm.id, defaultLocale: "en", secondaryLocale: null, weddingDate: ANANYA.date });
  await db.update(schema.weddings).set({ isDemo: true, contactEmail: "family@example.com" }).where(eq(schema.weddings.id, w.id));
  const art = (cache ??= await renderArt());
  const assets = new Map<string, string>();
  const need = async (k: string, c: MediaCategory, caption?: Record<string, string>) => {
    const id = await stockAsset(w.id, k, c, assets, caption ? { caption } : {});
    if (!id) throw new Error(`Missing stock photograph assets/stock/${k}.jpg — restore it, or re-run npm run db:reset after adding it.`);
    return id;
  };
  const hero = await need("2oQy4GAGxbk", "COUPLE");
  const heroWide = await need("2XXQkrL0k-Q", "COUPLE");
  const couple = await need("3ZISmV72cbM", "COUPLE");
  const bride = await need("VPwSJhu5uhs", "BRIDE");
  const groom = await need("mab4JkLEe80", "GROOM");
  const ceremony = await need("7O422yG_b80", "EVENT");
  const venue = await need("BEdxXAiRfRM", "VENUE");
  const wideBuf = stockPhoto("2XXQkrL0k-Q")!;
  const og = (await upload(w.id, await social(wideBuf), "og.jpg", "OTHER")).id;
  const GAL: [string, string][] = [
    ["d9RsO9BHFVQ", "Under a canopy of golden light"], ["SHFOaVaVe2A", "A quiet walk before the noise begins"], ["shqK5G-J-Ac", "Red, gold and a held breath"], ["NCrvRQdvTx8", "After sunset"],
    ["d-jyMeP6uNQ", "By the river"], ["8DItNV005qM", "Garlands and glances"], ["OzyvCE9a60M", "The first hours as a married couple"], ["kp7XkkCLnlY", "In front of the flowers"],
    ["M8YKi58QKrM", "Petals everywhere"], ["ohENjR9w0bk", "Eyes lowered, heart full"], ["2DZmm6QKFQE", "The doorway to a new life"], ["Po-nggQqplE", "Henna, bangles and a nervous smile"],
    ["ICnMRhxJLYg", "The groom, ready"], ["Y3QEAct9JT4", "Fairy lights and family"], ["jWBxlyVZ3bg", "Side by side"], ["DC0d6A2kX0k", "A ceiling of jasmine"],
  ];
  const gallery: AnanyaMedia["gallery"] = [];
  for (const [k, cap] of GAL) {
    const id = await need(k, "GALLERY", { en: cap });
    gallery.push({ id, caption: { en: cap }, alt: { en: STOCK[k]?.alt ?? cap } });
  }
  const media: AnanyaMedia = {
    hero, heroWide, couple, bride, groom, venue, ceremony, story: couple, og, gallery,
    events: { mehendi: await need("SUwPo4ErQCc", "EVENT"), sangeet: await need("gG5MoExhMnU", "EVENT"), wedding: ceremony, reception: await need("OQDYhr9HRNo", "EVENT") },
    ceremonies: { haldi: await need("IFCN-tBVNPI", "EVENT"), mehendi: await need("fVL0zZdk-R4", "EVENT"), baraat: await need("gG5MoExhMnU", "EVENT"), kanyadaan: await need("bWQ6-0c_ZcM", "EVENT"), phera: await need("lAze38kfdAs", "EVENT"), reception: await need("OQDYhr9HRNo", "EVENT"), puja: await need("EiGfP6DxgN8", "EVENT") },
    milestones: { first: await need("8DItNV005qM", "COUPLE"), chapter: await need("d-jyMeP6uNQ", "COUPLE"), promise: await need("lKwp3-FQomY", "COUPLE"), wedding: await need("7O422yG_b80", "EVENT") },
  };
  const album = await saveAlbum(admin, w.id, { title: { en: "Pre-wedding" }, kind: "OFFICIAL", coverAssetId: gallery[0].id });
  await addToAlbum(admin, w.id, album.id, gallery.map((g) => g.id));
  const track = await upload(w.id, art.music, "raag-yaman.wav", "MUSIC", ["AUDIO"]);
  await saveTrack(admin, w.id, { assetId: track.id, title: "Raag Yaman", artist: "StackBridge Studio (ambient)", isPrimary: true, inPlaylist: true });
  const cur = await getWedding(admin, w.id);
  await saveDraft(admin, w.id, buildAnanyaDoc(cur.draftDoc, media));
  await publishWedding(admin, w.id, { label: "Launch" });
  console.log(`  ✔ ${ANANYA.slug}  (LUXURY)`);
  return w.id;
}

async function seedPeople(admin: AdminActor, weddingId: string, slug: string, pkg: PackageKey, gallery: DemoMedia["gallery"], art: NonNullable<typeof cache>) {
  const db = await getDb();
  const groups = await db.select().from(schema.guestGroups).where(eq(schema.guestGroups.weddingId, weddingId));
  const g = (k: string) => groups.find((x) => x.key === k)?.id ?? null;
  const people: [string, string, string, number, string, (string | null)?][] = [
    ["Priya Nair", "friends", "College friend", 3, "9000000001"], ["Latha Menon", "bride-family", "Aunt", 2, "9000000002", "ml"], ["Ramesh Kumar", "groom-family", "Uncle", 2, "9000000003"],
    ["Divya Suresh", "friends", "Friend", 2, "9000000004"], ["Suresh Pillai", "relatives", "Uncle", 4, "9000000005"], ["Neha Varghese", "office", "Colleague", 1, "9000000006"],
    ["Joseph Thomas", "friends", "Friend", 2, "9000000007"], ["Sarala Devi", "groom-family", "Grandmother", 1, "9000000008", "ml"], ["Karthik Iyer", "office", "Colleague", 2, "9000000009"],
    ["Fatima Beevi", "friends", "Neighbour", 3, "9000000010"], ["Gopinath Nambiar", "vip", "Family friend", 2, "9000000011"], ["Lakshmi Menon", "relatives", "Aunt", 2, "9000000012"],
    ["Arun Prasad", "friends", "Friend", 1, "9000000013"], ["Meera Krishnan", "bride-family", "Cousin", 3, "9000000014"], ["Vijayan Nair", "bride-family", "Uncle", 2, "9000000015"],
    ["Sneha Rajan", "office", "Colleague", 2, "9000000016"], ["Abdul Rahman", "friends", "Friend", 2, "9000000017"], ["Reshma Das", "relatives", "Cousin", 2, "9000000018"],
  ];
  const ctxs: Record<string, Awaited<ReturnType<typeof resolveGuestContext>>> = {};
  for (const [name, group, rel, seats, phone, loc] of people) {
    const guest = await createGuest(admin, weddingId, { name, groupId: g(group), relationship: rel, seats, phone, preferredLocale: loc ?? null, email: name === "Priya Nair" ? "priya@example.com" : undefined });
    ctxs[name] = await resolveGuestContext(slug, await ensureInvite(weddingId, guest.id));
  }
  // some replies
  const doc = (await getWedding(admin, weddingId)).draftDoc;
  const meal = (i: number) => doc.rsvp.mealOptions[i % doc.rsvp.mealOptions.length].id;
  const replies: [string, Parameters<typeof submitGuestRsvp>[1]][] = [
    ["Priya Nair", null as never], // left pending so the demo link shows the RSVP form
    ["Latha Menon", { status: "YES", attendingCount: 2, meal: meal(0), needsAccommodation: true, accommodation: { rooms: 1, arrival: "2027-01-22", departure: "2027-01-25" } }],
    ["Ramesh Kumar", { status: "YES", attendingCount: 2, meal: meal(1), companions: [{ name: "Sreedevi Ramesh", meal: meal(1) }] }],
    ["Divya Suresh", { status: "YES", attendingCount: 2, meal: meal(0), needsTransport: true, transport: { pickupLocation: "Cochin Airport (COK)", arrivalAt: "AI 502, 08:15" } }],
    ["Suresh Pillai", { status: "MAYBE" }], ["Neha Varghese", { status: "YES", attendingCount: 1, meal: meal(1) }], ["Joseph Thomas", { status: "NO" }],
    ["Sarala Devi", { status: "YES", attendingCount: 1, meal: meal(0) }], ["Karthik Iyer", { status: "YES", attendingCount: 2, meal: meal(2), needsAccommodation: true, accommodation: { rooms: 1, arrival: "2027-01-23", departure: "2027-01-24" } }],
    ["Meera Krishnan", { status: "YES", attendingCount: 3, meal: meal(0) }], ["Vijayan Nair", { status: "YES", attendingCount: 2, meal: meal(1) }], ["Abdul Rahman", { status: "YES", attendingCount: 2, meal: meal(1) }],
  ];
  for (const [name, r] of replies) {
    const ctx = ctxs[name];
    if (ctx && r) await submitGuestRsvp(ctx, r).catch((e) => console.warn("   rsvp:", name, e.message));
  }
  // wishes
  const wishes: [string, string][] = [
    ["Latha Menon", "May Guruvayurappan bless you both with a lifetime of light. Meenu, you will always be my little girl in the yellow frock. ❤"],
    ["Divya Suresh", "From the umbrella to the altar — I have watched every chapter and I am the proudest friend alive. Love you both!"],
    ["Karthik Iyer", "Aravind, you are the only architect I know who designs happiness. Congratulations!"],
    ["Sarala Devi", "Ente kuttikalkku ellaa anugrahavum. Nannaayi vaazhoo."],
    ["Meera Krishnan", "Two of the kindest people I know. Cannot wait for the sadhya, the songs and the dancing!"],
    ["Abdul Rahman", "Best wishes from all of us — may every monsoon feel like your first."],
  ];
  const ids: string[] = [];
  for (const [name, body] of wishes) {
    const ctx = ctxs[name];
    if (!ctx) continue;
    const m = await submitMessage(participantFromGuest(ctx), { kind: "WISH", body });
    await moderateMessage(admin, weddingId, m.id, "APPROVED");
    ids.push(m.id);
  }
  if (pkg !== "LUXURY") return;
  // Luxury only: live updates, guest photos on the wall, time capsule, memory book, anniversary
  await postLiveUpdate(admin, weddingId, { title: L("The nadaswaram has begun — please take your seats", "നാദസ്വരം ആരംഭിച്ചു — ദയവായി ഇരിപ്പിടങ്ങളിൽ ഇരിക്കുക"), kind: "ALERT", pinned: true });
  await postLiveUpdate(admin, weddingId, { title: L("Sadhya seating opens at 12:30 in the hall", "12:30-ന് ഹാളിൽ സദ്യ വിളമ്പും"), kind: "INFO" });
  const who = ["Priya Nair", "Divya Suresh", "Neha Varghese", "Karthik Iyer", "Meera Krishnan", "Abdul Rahman", "Fatima Beevi", "Joseph Thomas"];
  for (let i = 0; i < who.length; i++) {
    const ctx = ctxs[who[i]];
    if (!ctx) continue;
    const up = await submitGuestUpload(participantFromGuest(ctx), { buffer: art.gallery[(i + 2) % art.gallery.length], filename: `guest-${i}.jpg` });
    await moderateMedia(admin, weddingId, up.id, "APPROVED");
  }
  await syncCapsule(weddingId);
  for (const [name, body] of [["Divya Suresh", "By now you two will have argued about the thermostat at least 200 times. Worth every second. Love, D."], ["Karthik Iyer", "Dear Meenu & Aravind — may your first year be the softest one yet."], ["Priya Nair", "I hope you still have the yellow umbrella. I hope it still has a broken rib."]] as const) {
    const ctx = ctxs[name];
    if (ctx) await submitCapsuleItem(participantFromGuest(ctx), { kind: "TEXT", body });
  }
  await saveMemoryBook(admin, weddingId, { title: L("Our memory book", "ഞങ്ങളുടെ ഓർമ്മപ്പുസ്തകം"), intro: L("A few of the moments and words we will keep forever.", "എന്നെന്നും ഞങ്ങൾ സൂക്ഷിക്കുന്ന ചില നിമിഷങ്ങളും വാക്കുകളും."), pinnedMessageIds: ids.slice(0, 4), pinnedAssetIds: gallery.slice(0, 3).map((x) => x.id), publish: true });
  await saveAnniversaryEntry(admin, weddingId, { year: 1, title: L("One lamp, one year", "ഒരു വിളക്ക്, ഒരു വർഷം"), body: L("We still light the lamp every evening. The umbrella hangs by the door.", "ഇപ്പോഴും എല്ലാ സന്ധ്യയ്ക്കും ഞങ്ങൾ വിളക്ക് തെളിക്കുന്നു. കുട വാതിലിനരികിൽ തൂങ്ങിക്കിടക്കുന്നു."), assetIds: gallery.slice(2, 4).map((x) => x.id) });
}

async function seedOrders(weddingIds: Record<string, string>) {
  const db = await getDb();
  const [{ n }] = await db.select({ n: (await import("drizzle-orm")).sql<number>`count(*)::int` }).from(schema.orders);
  if (n > 0) return;
  const rows: (typeof schema.orders.$inferInsert)[] = [
    { customerName: "Meenakshi & Aravind (portfolio demo)", customerContact: "", packageKey: "LUXURY", amountInr: 0, status: "FREE_PORTFOLIO", notes: "Portfolio wedding — showcases every Luxury feature.", weddingId: weddingIds.luxury },
    { customerName: "Ananya & Arjun (portfolio demo)", customerContact: "", packageKey: "LUXURY", amountInr: 0, status: "FREE_PORTFOLIO", notes: "Portfolio wedding — north Indian, cinematic.", weddingId: weddingIds.ananya },
    { customerName: "Portfolio · Signature demo", customerContact: "", packageKey: "SIGNATURE", amountInr: 0, status: "FREE_PORTFOLIO", weddingId: weddingIds.signature },
    { customerName: "Portfolio · Essential demo", customerContact: "", packageKey: "ESSENTIAL", amountInr: 0, status: "FREE_PORTFOLIO", weddingId: weddingIds.essential },
    { customerName: "Enquiry: Nisha & Rohit", customerContact: "+91 90000 11122", packageKey: "SIGNATURE", amountInr: 4999, status: "QUOTED", notes: "Wedding in March. Wants Malayalam + English." },
    { customerName: "Enquiry: Fathima & Rasheed", customerContact: "+91 90000 22233", packageKey: "ESSENTIAL", amountInr: 2499, status: "QUOTED" },
  ];
  await db.insert(schema.orders).values(rows);
}

async function main() {
  if (process.env.NODE_ENV === "production" && (process.env.SEED_ADMIN_PASSWORD ?? "").length < 12) {
    throw new Error("Set SEED_ADMIN_PASSWORD (12+ characters) before seeding a production database.");
  }
  console.log("→ Seeding platform data");
  await ensurePackages();
  await ensureDesignLibrary();
  const adminUser = await ensureSuperAdmin(process.env.SEED_ADMIN_EMAIL || "admin@stackbridgelab.com", process.env.SEED_ADMIN_PASSWORD || "ChangeMe-Now-123", process.env.SEED_ADMIN_NAME || "Amal");
  const admin = (await loadActorForUser(adminUser.id)) as AdminActor;
  console.log(`  ✔ super admin: ${adminUser.email}`);
  console.log(`  ✔ packages: ${PACKAGE_DEFAULTS.map((p) => p.name).join(", ")}`);
  if (process.env.SEED_DEMO === "false") return;

  console.log("→ Creating demonstration weddings (stock photography, fictional couples)");
  const ids: Record<string, string> = {};
  ids.luxury = await seedWedding(admin, { slug: DEMO.slug, title: DEMO.title, pkg: "LUXURY", template: "royal-heritage", theme: "kasavu", full: true, clientEmail: "luxury.client@example.com" });
  ids.ananya = await seedAnanya(admin);
  ids.cinematic = await seedWedding(admin, { slug: "demo-cinematic", title: DEMO.title, pkg: "LUXURY", template: "cinematic-noir", theme: "midnight-sapphire", full: true, celebration: "confetti" });
  ids.signature = await seedWedding(admin, { slug: "demo-signature", title: DEMO.title, pkg: "SIGNATURE", template: "editorial", theme: "emerald-ivory", full: false, clientEmail: "signature.client@example.com" });
  ids.essential = await seedWedding(admin, { slug: "demo-essential", title: DEMO.title, pkg: "ESSENTIAL", template: "minimal-luxury", theme: "rose-gold", full: false });
  await seedOrders(ids);
  console.log(`\nDone. Open ${env.appUrl}/invite/${DEMO.slug}`);
  console.log(`Super Admin: ${adminUser.email}  /  ${process.env.SEED_ADMIN_PASSWORD || "ChangeMe-Now-123"}`);
  console.log("Demo clients: luxury.client@example.com · signature.client@example.com  /  Demo-Client-123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
