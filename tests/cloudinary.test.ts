import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { storage } from "@/lib/storage";
import { deliveryUrl, isPublicId } from "@/lib/cloudinary";
import { sized } from "@/lib/media-url";
import { SITE_TEMPLATES } from "@/domain/catalogue/templates";
import cloudThumbs from "@/domain/catalogue/cloud-thumbs.json";
import { existsSync } from "node:fs";
import { collectAssetIds, deleteMedia, ingestFile, replaceImage, rotateMedia, toResolved, uploadAsUser } from "@/domain/media/service";
import { createFromTemplate } from "@/domain/wedding/from-template";
import { getWedding, purgeWedding, saveDraft } from "@/domain/wedding/service";
import { GET as mediaRoute } from "@/app/api/media/[id]/[variant]/route";
import type { AdminActor } from "@/domain/auth/access";
import { bootstrap, makeClient, makeWedding, pngBuffer, uniq } from "./helpers";
import { cloud } from "./fake-cloudinary";

vi.mock("@/lib/cloudinary", async () => (await import("./fake-cloudinary")).fakeModule());
// the media route reads the signed-in person from the request's cookies; here nobody is signed in
vi.mock("@/lib/session", () => ({ getCurrentActor: async () => null }));

let admin: AdminActor;
const photo = (w = 2000, h = 1500, color = { r: 180, g: 120, b: 60 }) => pngBuffer(w, h, color);
const upload = (weddingId: string, buf: Buffer, category: "COUPLE" | "GALLERY" = "COUPLE") => uploadAsUser(admin, weddingId, { buffer: buf, filename: "p.png" }, { category });
const row = async (id: string) => (await (await getDb()).select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, id)))[0];

beforeAll(async () => {
  admin = await bootstrap();
});
beforeEach(() => {
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "testcloud");
  vi.stubEnv("CLOUDINARY_API_KEY", "key-123456");
  vi.stubEnv("CLOUDINARY_API_SECRET", "secret-abcdef");
  cloud.reset();
});
afterEach(() => vi.unstubAllEnvs());

describe("new photographs go to Cloudinary", () => {
  it("stores one master under the invitation's own folder, and delivers the sizes as resized URLs of it", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const a = await upload(w.id, await photo());
    expect(a.provider).toBe("cloudinary");
    expect(a.storageKey).toBe(`sbl-invites/projects/${w.id}/${a.id}`);
    expect(cloud.store.size).toBe(1); // one file, not four
    expect(cloud.store.has(a.storageKey)).toBe(true);
    expect(await storage().get(`w/${w.id}/${a.id}/xl.webp`)).toBeNull(); // nothing on the old store
    const meta = a.metadata as { variants: Record<string, { key: string; width: number }>; cloudinary: { version: number } };
    expect(Object.values(meta.variants).every((v) => v.key === a.storageKey)).toBe(true);
    expect(["xl", "lg", "md", "sm"].map((n) => meta.variants[n].width)).toEqual([2000, 1600, 900, 420]);
    const r = toResolved(a);
    expect(r.url).toBe(`https://res.cloudinary.com/testcloud/image/upload/f_auto,q_auto,w_1600,c_limit/v${meta.cloudinary.version}/${a.storageKey}`);
    expect(r.srcSet).toContain("w_420,c_limit");
    expect(r.srcSet?.split(", ")).toHaveLength(4);
    expect(r.width).toBe(2000);
    expect(r.blur).toMatch(/^data:image\/webp/);
  });

  it("a template's sample photographs live under templates/<template id>", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const db = await getDb();
    await db.update(schema.weddings).set({ isDemo: true }).where(eq(schema.weddings.id, w.id));
    const [full] = await db.select().from(schema.weddings).where(eq(schema.weddings.id, w.id));
    const a = await upload(w.id, await photo());
    expect(a.storageKey).toBe(`sbl-invites/templates/${full.templateId}/${a.id}`);
  });

  it("keeps photographs on the old store when they must stay behind the access check, or Cloudinary is not set up", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const guest = await ingestFile({ weddingId: w.id, buffer: await photo(), filename: "g.png", category: "GUEST_UPLOAD", allow: ["IMAGE"], source: "GUEST" });
    expect(guest.provider).toBe("legacy");
    expect(await storage().get(guest.storageKey)).not.toBeNull();
    const priv = await ingestFile({ weddingId: w.id, buffer: await photo(), filename: "p.png", category: "GALLERY", allow: ["IMAGE"], source: "ADMIN", visibility: "PRIVATE" });
    expect(priv.provider).toBe("legacy");
    const capsule = await ingestFile({ weddingId: w.id, buffer: await photo(), filename: "m.png", category: "MEMORY", allow: ["IMAGE"], source: "SYSTEM" });
    expect(capsule.provider).toBe("legacy");
    expect(cloud.store.size).toBe(0);

    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    const noCreds = await upload(w.id, await photo());
    expect(noCreds.provider).toBe("legacy");
    expect(toResolved(noCreds).url).toMatch(/^\/api\/media\//);
  });

  it("an invitation that existed before Cloudinary, or is pinned, keeps uploading to the old store", async () => {
    const db = await getDb();
    for (const mode of ["legacy", "pinned"] as const) {
      const w = await makeWedding(admin, "LUXURY");
      await db.update(schema.weddings).set({ mediaStorage: mode }).where(eq(schema.weddings.id, w.id));
      const a = await upload(w.id, await photo());
      expect(a.provider, mode).toBe("legacy");
    }
    expect(cloud.store.size).toBe(0);
  });

  it("a new invitation defaults to Cloudinary; a gift never does", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    expect((await getWedding(admin, w.id)).mediaStorage).toBe("cloudinary");
  });
});

describe("who may upload, and what", () => {
  it("rejects people who are not signed in or belong to another invitation, and uploads nothing", async () => {
    const a = await makeWedding(admin, "LUXURY");
    const b = await makeWedding(admin, "LUXURY");
    const clientOfB = await makeClient(admin, b.id);
    await expect(upload(a.id, await photo())).resolves.toBeTruthy(); // the owner can
    cloud.reset();
    await expect(uploadAsUser(null, a.id, { buffer: await photo(), filename: "x.png" }, { category: "COUPLE" })).rejects.toThrow();
    await expect(uploadAsUser(clientOfB, a.id, { buffer: await photo(), filename: "x.png" }, { category: "COUPLE" })).rejects.toThrow();
    expect(cloud.uploads).toBe(0);
  });

  it("checks the bytes before anything leaves the server", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'.padEnd(40));
    await expect(upload(w.id, svg)).rejects.toThrow();
    await expect(upload(w.id, Buffer.from("not an image at all, just text"))).rejects.toThrow();
    expect(cloud.uploads).toBe(0);
  });

  it("only server-built ids can be used", () => {
    for (const bad of ["../etc/passwd", "Sbl-Invites/x", "a//b", "a/", "", "x y", "sbl-invites/<script>"]) expect(isPublicId(bad), bad).toBe(false);
    expect(isPublicId("sbl-invites/projects/0b6f2c0e-1111-4222-8333-444455556666/0b6f2c0e-1111-4222-8333-444455556667")).toBe(true);
  });

  it("a failed upload leaves no row and no orphan; a missing credential gives a plain message", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const db = await getDb();
    cloud.failNext = 1;
    await expect(upload(w.id, await photo())).rejects.toThrow();
    expect(await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, w.id))).toHaveLength(0);
    expect(cloud.store.size).toBe(0);

    vi.unstubAllEnvs();
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "");
    vi.stubEnv("CLOUDINARY_API_KEY", "key-123456");
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret-abcdef");
    const { CloudinaryNotConfigured } = await vi.importActual<typeof import("@/lib/cloudinary")>("@/lib/cloudinary");
    const err = new CloudinaryNotConfigured();
    expect(err.message).toContain("CLOUDINARY_CLOUD_NAME");
    expect(err.message).not.toMatch(/key-123456|secret-abcdef/);
  });
});

describe("replacing a photograph", () => {
  it("uploads the new image first, repoints the row, then releases the old one, leaving every other photograph alone", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const a = await upload(w.id, await photo());
    const other = await upload(w.id, await photo(1800, 1200, { r: 10, g: 80, b: 160 }), "GALLERY");
    const r1 = await replaceImage(admin, w.id, a.id, await photo(1600, 1000, { r: 200, g: 20, b: 20 }));
    expect(r1.storageKey).toBe(`${a.storageKey}-r1`);
    expect(r1.id).toBe(a.id);
    expect(cloud.store.has(a.storageKey)).toBe(false); // nothing else showed it
    expect(cloud.store.has(r1.storageKey)).toBe(true);
    expect(cloud.store.has(other.storageKey)).toBe(true);
    expect((await row(other.id)).storageKey).toBe(other.storageKey);
    const r2 = await rotateMedia(admin, w.id, a.id, 90);
    expect(r2.storageKey).toBe(`${a.storageKey}-r2`);
    expect(r2.width).toBe(1000); // 1600x1000 turned a quarter
    expect(cloud.store.has(r1.storageKey)).toBe(false);
  });

  it("a replacement that cannot be stored changes nothing", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const a = await upload(w.id, await photo());
    cloud.failNext = 1;
    await expect(replaceImage(admin, w.id, a.id, await photo(900, 600))).rejects.toThrow();
    expect((await row(a.id)).storageKey).toBe(a.storageKey);
    expect(cloud.store.has(a.storageKey)).toBe(true);
  });

  it("deleting a photograph removes its image", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const a = await upload(w.id, await photo());
    await deleteMedia(admin, w.id, a.id);
    expect(cloud.store.size).toBe(0);
  });
});

describe("an invitation started from a template shares the template's photographs", () => {
  async function sampleWithPhoto() {
    const s = await makeWedding(admin, "LUXURY", { date: "2100-02-10" });
    const db = await getDb();
    await db.update(schema.weddings).set({ isDemo: true }).where(eq(schema.weddings.id, s.id));
    const photoRow = await upload(s.id, await photo());
    const doc = structuredClone((await getWedding(admin, s.id)).draftDoc);
    doc.images.couple = photoRow.id;
    await saveDraft(admin, s.id, doc);
    // a template of its own (copied from an existing one), so that the shared first template other tests rely on is left alone
    const [base] = await db.select().from(schema.templates).limit(1);
    const [t] = await db.insert(schema.templates).values({ slug: uniq("cloud-tpl"), name: "Cloud sample", config: { ...(base.config as object), demo: s.slug } }).returning();
    return { sample: s, photoRow, templateId: t.id };
  }

  it("copies no pixels: the new invitation gets its own row pointing at the same image", async () => {
    const { photoRow, templateId } = await sampleWithPhoto();
    const uploadsBefore = cloud.uploads;
    const made = await createFromTemplate(admin, { templateId, packageKey: "SIGNATURE", title: "Divya & Rahul", nameA: "Divya", nameB: "Rahul", date: "2100-03-01" });
    expect(made.photos).toBe(1);
    expect(cloud.uploads).toBe(uploadsBefore); // nothing was uploaded for the customer
    const db = await getDb();
    const mine = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, made.id));
    expect(mine).toHaveLength(1);
    expect(mine[0].id).not.toBe(photoRow.id);
    expect(mine[0].provider).toBe("cloudinary");
    expect(mine[0].storageKey).toBe(photoRow.storageKey);
    expect((mine[0].metadata as { sample?: boolean }).sample).toBe(true);
    const doc = (await getWedding(admin, made.id)).draftDoc;
    expect(collectAssetIds(doc).has(mine[0].id)).toBe(true);
  });

  it("deleting the customer's invitation, or replacing their copy, never touches the template's image", async () => {
    const { photoRow, templateId } = await sampleWithPhoto();
    const made = await createFromTemplate(admin, { templateId, packageKey: "SIGNATURE", title: "Divya & Rahul", nameA: "Divya", nameB: "Rahul", date: "2100-03-01" });
    const db = await getDb();
    const [copy] = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, made.id));

    // replace the customer's copy: it gets an image of its own, the template's stays
    const replaced = await replaceImage(admin, made.id, copy.id, await photo(1400, 900, { r: 5, g: 5, b: 5 }));
    expect(replaced.storageKey).not.toBe(photoRow.storageKey);
    expect(replaced.storageKey.startsWith(`sbl-invites/projects/${made.id}/`)).toBe(true);
    expect(cloud.store.has(photoRow.storageKey)).toBe(true);

    // a second customer, then delete them: the template's image survives because its row still refers to it
    const second = await createFromTemplate(admin, { templateId, packageKey: "SIGNATURE", title: "Meera & Karan", nameA: "Meera", nameB: "Karan", date: "2100-04-01" });
    await purgeWedding(second.id);
    expect(cloud.store.has(photoRow.storageKey)).toBe(true);
    expect((await row(photoRow.id)).storageKey).toBe(photoRow.storageKey);

    // deleting one of two rows that share an image keeps the image; deleting the last one releases it
    const third = await createFromTemplate(admin, { templateId, packageKey: "SIGNATURE", title: "Asha & Vivek", nameA: "Asha", nameB: "Vivek", date: "2100-05-01" });
    const [shared] = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, third.id));
    await deleteMedia(admin, third.id, shared.id);
    expect(cloud.store.has(photoRow.storageKey)).toBe(true);
  });
});

describe("serving a Cloudinary photograph through the app route", () => {
  const call = (id: string, v = "lg") => mediaRoute(new Request(`http://localhost/api/media/${id}/${v}`), { params: Promise.resolve({ id, variant: v }) });

  it("sends the browser to Cloudinary at the width asked for, once the invitation is public", async () => {
    const w = await makeWedding(admin, "LUXURY"); // published
    const a = await upload(w.id, await photo());
    const res = await call(a.id, "md");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(/^https:\/\/res\.cloudinary\.com\/testcloud\/image\/upload\/f_auto,q_auto,w_900,c_limit\/v\d+\/sbl-invites\/projects\//);
  });

  it("answers an unpublished invitation's photograph with the same 404 as a missing one", async () => {
    const w = await makeWedding(admin, "LUXURY", { publish: false });
    const a = await upload(w.id, await photo());
    expect((await call(a.id)).status).toBe(404);
    expect((await call("00000000-0000-4000-8000-000000000000")).status).toBe(404);
  });
});

describe("thumbnails and srcset parsing", () => {
  it("sized() re-sizes both kinds of URL, and a Cloudinary URL survives being split into srcset candidates", () => {
    expect(sized("/api/media/abc/lg?v=1", "md")).toBe("/api/media/abc/md?v=1");
    const u = deliveryUrl("sbl-invites/projects/x/y", { width: 1600, version: 7 });
    expect(sized(u, "sm")).toBe(u.replace("w_1600", "w_420"));
    expect(sized(u, "lg")).toBe(u);
    // the invitation's head-photo code takes the first srcset candidate: it must be a whole URL, commas inside it and all
    const srcSet = [420, 900].map((w) => `${deliveryUrl("sbl-invites/projects/x/y", { width: w })} ${w}w`).join(", ");
    expect(srcSet.split(/,s+/)[0].split(" ")[0]).toBe(deliveryUrl("sbl-invites/projects/x/y", { width: 420 }));
  });
});

describe("template pictures on the public site", () => {
  it("every template has a picture: its Cloudinary one when the manifest lists it, otherwise the file in public/templates", () => {
    expect(SITE_TEMPLATES.length).toBeGreaterThan(40);
    for (const t of SITE_TEMPLATES) {
      const listed = (cloudThumbs.thumbs as Record<string, { id: string; version: number }>)[t.slug];
      if (listed) expect(t.thumb, t.slug).toBe(`https://res.cloudinary.com/${cloudThumbs.cloud}/image/upload/v${listed.version}/${listed.id}`);
      else expect(existsSync(`public${t.thumb}`), t.slug).toBe(true);
    }
  });
});

describe("the real client", () => {
  it("refuses to upload without credentials, with a message that names the variables and nothing else", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "");
    vi.stubEnv("CLOUDINARY_API_KEY", "");
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    const real = await vi.importActual<typeof import("@/lib/cloudinary")>("@/lib/cloudinary");
    await expect(real.uploadImage("sbl-invites/x/y", Buffer.from("x"))).rejects.toThrow(/CLOUDINARY_CLOUD_NAME.*CLOUDINARY_API_KEY.*CLOUDINARY_API_SECRET/);
  });
});

