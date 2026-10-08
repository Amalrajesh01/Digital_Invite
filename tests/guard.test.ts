import { describe, expect, it } from "vitest";
import { guardPreview } from "@/lib/guard";

const browser = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", "accept-language": "en-IN,en;q=0.9" };

describe("preview guard", () => {
  it("lets an ordinary browser through", () => {
    expect(guardPreview(new Headers(browser), "1.1.1.1").ok).toBe(true);
  });
  it("refuses AI crawlers, scripted clients and header-less requests", () => {
    for (const ua of ["Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.1; +https://openai.com/gptbot)", "python-requests/2.32.0 extra padding", "curl/8.4.0 extra padding to be long", ""]) {
      expect(guardPreview(new Headers({ ...browser, "user-agent": ua }), "2.2.2.2").ok).toBe(false);
    }
    expect(guardPreview(new Headers({ "user-agent": browser["user-agent"] }), "2.2.2.3").ok).toBe(false);
  });
  it("rate-limits one address", () => {
    let last = true;
    for (let i = 0; i < 60; i++) last = guardPreview(new Headers(browser), "3.3.3.3").ok;
    expect(last).toBe(false);
  });
});
