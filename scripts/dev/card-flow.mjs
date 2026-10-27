// A phone tap on a design opens the full invitation; a desktop click opens the design's page.  npx tsx scripts/dev/card-flow.mjs
import { chromium } from "playwright";
const base = process.env.BASE ?? "http://localhost:3000";
const browser = await chromium.launch();
let bad = 0;
const check = (ok, what, d = "") => { console.log(`${ok ? "✔" : "✘"} ${what}${d ? `  (${d})` : ""}`); if (!ok) bad++; };
for (const [name, vp, mobile] of [["phone", { width: 390, height: 844 }, true], ["desktop", { width: 1280, height: 800 }, false]]) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, locale: "en-IN", extraHTTPHeaders: { "Accept-Language": "en-IN,en;q=0.9" }, userAgent: mobile ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" });
  const page = await ctx.newPage();
  await page.goto(`${base}/templates/baptism`, { waitUntil: "networkidle", timeout: 120000 });
  check(/Invitations start from\s*₹[\d,]+/.test(await page.locator("main").innerText()), `${name}: the page says what invitations start from`);
  if (mobile) check(/Starts from\s*₹[\d,]+/i.test(await page.locator("body").innerText()), "phone: the sticky bar shows the starting price");
  await page.locator("article.reel-card a").first().click();
  await page.waitForURL((u) => u.pathname !== "/templates/baptism", { timeout: 90000 }).catch(() => {}); await page.waitForTimeout(3000);
  const url = new URL(page.url());
  if (mobile) {
    check(url.pathname.startsWith("/preview/t/"), "phone: tapping a design opens the full invitation", url.pathname);
    check(await page.getByRole("link", { name: "Use This Design" }).isVisible(), "phone: 'Use This Design' is on screen");
    await page.getByRole("button", { name: /Designs/ }).click();
    await page.waitForTimeout(1500);
    check(new URL(page.url()).pathname === "/templates/baptism", "phone: ← Designs goes back", new URL(page.url()).pathname);
  } else check(/^\/templates\/baptism\/[^/]+$/.test(url.pathname), "desktop: a click opens the design's page", url.pathname);
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
