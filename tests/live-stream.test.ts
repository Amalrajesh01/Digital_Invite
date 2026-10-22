import { describe, expect, it } from "vitest";
import { streamLink, streamPhase, streamWindow } from "@/domain/live/stream";
import { LiveDoc } from "@/domain/doc/schema";

describe("live stream links", () => {
  it("embeds only YouTube and Vimeo, from exact hostnames", () => {
    expect(streamLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ")?.embed).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
    expect(streamLink("https://youtu.be/dQw4w9WgXcQ")?.embed).toContain("/embed/dQw4w9WgXcQ");
    expect(streamLink("https://www.youtube.com/live/dQw4w9WgXcQ?feature=share")?.embed).toContain("/embed/dQw4w9WgXcQ");
    expect(streamLink("https://vimeo.com/123456789")?.embed).toBe("https://player.vimeo.com/video/123456789");
    expect(streamLink("https://evilyoutube.com/watch?v=dQw4w9WgXcQ")).toMatchObject({ provider: "other", embed: null });
    expect(streamLink("https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ")).toMatchObject({ provider: "other", embed: null });
    expect(streamLink("https://www.youtube.com/watch?v=../../x")?.embed).toBeNull();
  });
  it("opens other services as plain links and refuses anything that is not https", () => {
    expect(streamLink("https://us02web.zoom.us/j/123")).toMatchObject({ provider: "zoom", embed: null });
    expect(streamLink("https://meet.google.com/abc-defg-hij")?.provider).toBe("meet");
    for (const bad of ["http://youtu.be/dQw4w9WgXcQ", "javascript:alert(1)", "data:text/html,x", "https://user:pw@zoom.us/j/1", "not a url", ""]) expect(streamLink(bad), bad).toBeNull();
  });
});

describe("live stream schedule", () => {
  const tz = "Asia/Kolkata";
  const at = (iso: string) => Date.parse(iso);
  it("is always open without a start time", () => {
    expect(streamPhase(streamWindow({ startsAt: "", endsAt: "" }, tz), at("2026-01-01T00:00:00Z"))).toBe("live");
  });
  it("reads times in the wedding's zone and moves before → live → after", () => {
    const w = streamWindow({ startsAt: "2026-11-14T10:30", endsAt: "2026-11-14T13:00" }, tz); // 05:00Z – 07:30Z
    expect(streamPhase(w, at("2026-11-14T04:59:00Z"))).toBe("before");
    expect(streamPhase(w, at("2026-11-14T05:00:00Z"))).toBe("live");
    expect(streamPhase(w, at("2026-11-14T07:29:00Z"))).toBe("live");
    expect(streamPhase(w, at("2026-11-14T07:30:00Z"))).toBe("after");
  });
  it("ends four hours after the start when no end is given", () => {
    const w = streamWindow({ startsAt: "2026-11-14T10:30", endsAt: "" }, tz);
    expect(streamPhase(w, at("2026-11-14T08:59:00Z"))).toBe("live");
    expect(streamPhase(w, at("2026-11-14T09:00:00Z"))).toBe("after");
  });
  it("loads old documents (no schedule fields) and rejects a malformed time", () => {
    expect(LiveDoc.parse({ streamUrl: "https://youtu.be/dQw4w9WgXcQ" })).toMatchObject({ startsAt: "", showCountdown: true });
    expect(LiveDoc.safeParse({ startsAt: "tomorrow" }).success).toBe(false);
  });
});
