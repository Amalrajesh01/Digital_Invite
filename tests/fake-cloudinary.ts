import { vi } from "vitest";
import sharp from "sharp";

/** An in-memory stand-in for the Cloudinary calls (the real ones are exercised by `npm run cloudinary:check -- --smoke`). Same rules: an id is never overwritten unless asked. */
export const cloud = {
  store: new Map<string, { data: Buffer; version: number }>(),
  /** upload calls made, including repeats that found the id already there */
  uploads: 0,
  /** make the next N uploads fail */
  failNext: 0,
  /** answer the next N delivery checks as broken */
  brokenNext: 0,
  reset() {
    this.store.clear();
    this.uploads = 0;
    this.failNext = 0;
    this.brokenNext = 0;
  },
};

let version = 1_700_000_000;

export async function fakeModule() {
  const real = await vi.importActual<typeof import("@/lib/cloudinary")>("@/lib/cloudinary");
  return {
    ...real,
    async uploadImage(publicId: string, data: Buffer, opts: { overwrite?: boolean } = {}) {
      if (!real.isPublicId(publicId)) throw new Error("Invalid image id.");
      cloud.uploads++;
      if (cloud.failNext > 0) {
        cloud.failNext--;
        throw new Error("Cloudinary: simulated outage");
      }
      let held = cloud.store.get(publicId);
      const existing = !!held && !opts.overwrite;
      if (!held || opts.overwrite) {
        held = { data, version: ++version };
        cloud.store.set(publicId, held);
      }
      const m = await sharp(held.data).metadata();
      return { publicId, version: held.version, format: m.format ?? "webp", bytes: held.data.length, width: m.width ?? 0, height: m.height ?? 0, existing };
    },
    async destroyImage(publicId: string) {
      return cloud.store.delete(publicId);
    },
    async fetchOriginal(publicId: string) {
      const h = cloud.store.get(publicId);
      return h ? { data: h.data, contentType: "image/webp" } : null;
    },
    async probeImage(publicId: string) {
      if (cloud.brokenNext > 0) {
        cloud.brokenNext--;
        return { ok: false, status: 404, contentType: "", bytes: 0 };
      }
      const h = cloud.store.get(publicId);
      return h ? { ok: true, status: 200, contentType: "image/webp", bytes: h.data.length } : { ok: false, status: 404, contentType: "", bytes: 0 };
    },
  };
}
