import { beforeAll, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { bootstrap, makeWedding } from "./helpers";
import type { AdminActor } from "@/domain/auth/access";
import { MUSIC_CATEGORIES, MUSIC_LIBRARY, attribution, libraryTrack, searchLibrary } from "@/domain/music/library";
import { addLibraryTrack } from "@/domain/music/service";
import { listTracks } from "@/domain/media/service";
import { sniffMedia } from "@/domain/media/validate";

describe("the music library", () => {
  it("has at least twenty distinct, licensed tracks that exist on disk and are real MP3s", () => {
    expect(MUSIC_LIBRARY.length).toBeGreaterThanOrEqual(20);
    expect(new Set(MUSIC_LIBRARY.map((t) => t.id)).size).toBe(MUSIC_LIBRARY.length);
    expect(new Set(MUSIC_LIBRARY.map((t) => t.file)).size).toBe(MUSIC_LIBRARY.length);
    expect(new Set(MUSIC_LIBRARY.map((t) => t.title)).size).toBe(MUSIC_LIBRARY.length);
    for (const t of MUSIC_LIBRARY) {
      const file = path.join(process.cwd(), "assets", "music", t.file);
      expect(existsSync(file), t.id).toBe(true);
      expect(sniffMedia(readFileSync(file))?.kind, t.id).toBe("AUDIO");
      expect(t.seconds, t.id).toBeGreaterThan(30);
      expect(t.licence.name && t.licence.url && t.composer && t.source, t.id).toBeTruthy();
      expect(MUSIC_CATEGORIES.some((c) => c.key === t.category && !("pending" in c)), t.id).toBe(true);
      expect(t.moods.length, t.id).toBeGreaterThan(0);
    }
  });

  it("covers every ready category, and leaves the faith-specific ones empty until they are verified", () => {
    for (const c of MUSIC_CATEGORIES) {
      const n = MUSIC_LIBRARY.filter((t) => t.category === c.key).length;
      if ("pending" in c) expect(n, c.key).toBe(0);
      else expect(n, c.key).toBeGreaterThan(0);
    }
  });

  it("searches by words, category and mood, and only knows its own ids", () => {
    expect(searchLibrary({ q: "harp" }).length).toBeGreaterThan(0);
    expect(searchLibrary({ category: "minimal-piano" }).every((t) => t.category === "minimal-piano")).toBe(true);
    expect(searchLibrary({ q: "zzzz-no-such-song" })).toEqual([]);
    expect(libraryTrack("../../etc/passwd")).toBeUndefined();
    expect(libraryTrack("there-is-romance")?.title).toBe("There is Romance");
    expect(attribution(MUSIC_LIBRARY[0])).toContain("Kevin MacLeod");
  });
});

describe("picking a library track for an invitation", () => {
  let admin: AdminActor;
  let wedding: { id: string; slug: string };
  beforeAll(async () => {
    admin = await bootstrap();
    wedding = await makeWedding(admin, "LUXURY");
  });

  it("copies it into the invitation's media as a song with its credit, once", async () => {
    const first = await addLibraryTrack(admin, wedding.id, "there-is-romance", { primary: true });
    expect(first.title).toBe("There is Romance");
    expect(first.artist).toContain("CC BY 4.0");
    expect(first.isPrimary).toBe(true);
    const again = await addLibraryTrack(admin, wedding.id, "there-is-romance");
    expect(again.id).toBe(first.id);
    expect(await listTracks(admin, wedding.id)).toHaveLength(1);
  });

  it("can change which song is the main one, and refuses ids it does not have", async () => {
    await addLibraryTrack(admin, wedding.id, "prelude-in-c");
    await addLibraryTrack(admin, wedding.id, "prelude-in-c", { primary: true });
    const tracks = await listTracks(admin, wedding.id);
    expect(tracks).toHaveLength(2);
    expect(tracks.filter((t) => t.isPrimary).map((t) => t.title)).toEqual(["Prelude in C (BWV 846)"]);
    await expect(addLibraryTrack(admin, wedding.id, "no-such-track")).rejects.toThrow();
  });
});
