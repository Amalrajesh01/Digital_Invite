// Section tour for visual QA:  node scripts/tour.mjs <url> <prefix> [width=390] [height=844] [ids=comma,separated]
import { chromium } from "playwright";
const [url, prefix, w = "390", h = "844", ids] = process.argv.slice(2);
const width = Number(w), height = Number(h);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: width < 600 ? 2 : 1, locale: "en-IN" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 200)));
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
await page.locator("text=/Continue without music|Enter|Tap to open/").first().click({ timeout: 4000 }).catch(() => {});
await page.waitForTimeout(3600);
const sections = await page.evaluate(() => [...document.querySelectorAll("[data-section-type]")].map((e) => e.getAttribute("data-section-type")));
const want = ids ? ids.split(",") : sections;
for (const id of want) {
  const loc = page.locator(`[data-section-type="${id}"]`).first();
  if (!(await loc.count())) { console.log("missing:", id); continue; }
  await loc.scrollIntoViewIfNeeded();
  const box = await loc.boundingBox();
  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, (box?.y ?? 0) + (await page.evaluate(() => window.scrollY)) - 8));
  await page.waitForTimeout(1700);
  await page.screenshot({ path: `.shots/${prefix}-${id}.png` });
}
console.log("sections:", sections.join(", "));
if (errors.length) console.log([...new Set(errors)].slice(0, 10).join("\n"));
await browser.close();
