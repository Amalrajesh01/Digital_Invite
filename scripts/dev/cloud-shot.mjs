// Does an invitation's photography load, and from where?  node scripts/dev/cloud-shot.mjs <slug> [out.png] [--mobile] [--url=<base>]
// Opens /invite/<slug>, scrolls to the bottom so lazy images load, then reports every image by host (Cloudinary vs this app),
// the status codes, and any <img> that did not render. Exit code 1 if an image failed.
import { chromium } from "playwright";
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--") && !a.endsWith(".png"));
const out = args.find((a) => a.endsWith(".png"));
if (!slug) { console.error("usage: node scripts/dev/cloud-shot.mjs <slug> [out.png] [--mobile] [--url=http://localhost:3000]"); process.exit(2); }
const base = (args.find((a) => a.startsWith("--url="))?.slice(6) ?? process.env.BASE ?? "http://localhost:3000").replace(/\/$/, "");
const mobile = args.includes("--mobile");
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 }, deviceScaleFactor: mobile ? 2 : 1, locale: "en-IN" });
const page = await ctx.newPage();
const images = [];
page.on("response", (r) => { if (r.request().resourceType() === "image") images.push({ url: r.url(), status: r.status(), type: r.headers()["content-type"] ?? "" }); });
await page.goto(`${base}/invite/${slug}`, { waitUntil: "load", timeout: 90000 });
await page.waitForTimeout(2000);
// the invitation opens on an envelope screen: open it without music, then scroll the whole story so lazy images are requested
await page.getByText("Continue without music").first().click({ timeout: 4000 }).catch(() => {});
await page.waitForTimeout(2500);
for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(120); }
await page.waitForLoadState("networkidle").catch(() => {});
// any picture still waiting (lazy) is brought into view and given a moment
const waiting = await page.evaluate(() => [...document.images].filter((i) => !i.complete).length);
if (waiting) {
  const n = await page.evaluate(() => document.images.length);
  for (let k = 0; k < n; k++) { await page.evaluate((j) => document.images[j]?.scrollIntoView({ block: "center" }), k); await page.waitForTimeout(150); }
  await page.waitForLoadState("networkidle").catch(() => {});
}
await page.waitForTimeout(800);
const broken = await page.evaluate(() => [...document.images].filter((i) => i.currentSrc && (!i.complete || i.naturalWidth === 0)).map((i) => i.currentSrc));
await page.evaluate(() => window.scrollTo(0, 0));
if (out) await page.screenshot({ path: out });
const by = {};
for (const i of images) {
  const host = new URL(i.url).host;
  (by[host] ??= { count: 0, bad: 0, types: new Set() });
  by[host].count++; by[host].types.add(i.type.split(";")[0]);
  if (i.status >= 400) by[host].bad++;
}
for (const [h, v] of Object.entries(by)) console.log(`${h.padEnd(32)} ${String(v.count).padStart(3)} images  ${v.bad} failed  ${[...v.types].join(", ")}`);
const widths = [...new Set(images.filter((i) => i.url.includes("res.cloudinary.com")).map((i) => /w_(\d+)/.exec(i.url)?.[1]).filter(Boolean))];
if (widths.length) console.log(`cloudinary widths requested: ${widths.sort((a, b) => a - b).join(", ")}`);
console.log(broken.length ? `✖ ${broken.length} <img> did not render:\n  ${broken.join("\n  ")}` : "✔ every <img> on the page rendered");
if (out) console.log("saved", out);
await browser.close();
if (broken.length || images.some((i) => i.status >= 400)) process.exit(1);
