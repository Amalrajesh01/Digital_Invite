// QA captures of the five "For My Love" experiences.   npx tsx scripts/dev/love.mjs [slug|all] [--out=.shots/love] [--w=390 --h=844]
// With --thumbs it also writes public/templates/<slug>.webp (the gallery picture) from the screen after the first tap.
// For each: the start screen, the screen after the first tap, then a few screens further down (or further through, for the surprise).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--")) ?? "all";
const opt = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=") ?? d;
const base = process.env.BASE ?? "http://localhost:3000";
const out = opt("out", ".shots/love");
const W = Number(opt("w", 390)), H = Number(opt("h", 844));
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const { LOVE_SPECS } = await import("../../src/domain/love/templates.ts");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const s of LOVE_SPECS.filter((x) => target === "all" || x.slug === target)) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, locale: "en-IN", userAgent: UA, isMobile: true, hasTouch: true, extraHTTPHeaders: { "Accept-Language": "en-IN,en;q=0.9" } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
  await page.goto(`${base}/preview/t/${s.slug}`, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
  await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }" }).catch(() => {});
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${out}/${s.slug}-0-start.png` });
  const click = async (sel, name) => page.locator(sel).first().click({ timeout: 4000, force: true }).catch(() => errors.push(`no ${name}`));
  if (s.experience === "story") await click(".ls-start .inv-btn", "begin");
  if (s.experience === "letter") await click(".ll-env", "envelope");
  if (s.experience === "surprise") await click(".lsu-gift", "gift");
  if (s.experience === "sorry") await click(".lq-ask .inv-btn", "read now");
  await page.waitForTimeout(s.experience === "letter" ? 3200 : 2200);
  await page.screenshot({ path: `${out}/${s.slug}-1-open.png` });
  if (args.includes("--thumbs")) { mkdirSync("public/templates", { recursive: true }); await sharp(await page.screenshot({ type: "png" })).resize({ width: 540 }).webp({ quality: 78 }).toFile(`public/templates/${s.slug}.webp`); }
  if (s.experience === "surprise") {
    for (let i = 2; i <= 5; i++) { await click(".lsu-next", "next"); await page.waitForTimeout(1300); await page.screenshot({ path: `${out}/${s.slug}-${i}-step.png` }); }
    await click(".lsu-sub-nav .lv-quiet:last-child", "skip"); await page.waitForTimeout(1800); await page.screenshot({ path: `${out}/${s.slug}-6-end.png` });
  } else {
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (let y = 0; y <= total; y += 500) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(60); }
    for (const [i, p] of [0.25, 0.5, 0.75, 1].entries()) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * p)); await page.waitForTimeout(1500);
      await page.screenshot({ path: `${out}/${s.slug}-${i + 2}-scroll.png` });
    }
  }
  console.log(s.slug, errors.length ? "NOTES: " + [...new Set(errors)].join(" | ") : "ok");
  await ctx.close();
}
await browser.close();
