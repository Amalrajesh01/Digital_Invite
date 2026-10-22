// The long pictures the site scrolls on every template card: the first few screens of each invitation, stacked into one tall image.
//   npx tsx scripts/dev/tall.mjs <slug|all|category:<slug>> [--screens=4] [--w=390 --h=844]
// Writes public/templates/tall/<slug>.webp. Needs the dev server (BASE) with the samples seeded, like tpl.mjs.
// The "For My Love" gifts open differently (a tap on a gift, an envelope, a begin button), so they are walked the way love.mjs does.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--")) ?? "all";
const opt = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=") ?? d;
const base = process.env.BASE ?? "http://localhost:3000";
const SCREENS = Number(opt("screens", 4));
const W = Number(opt("w", 390)), H = Number(opt("h", 844));
const OUT_W = 520;
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

const { TEMPLATE_SPECS } = await import("../../src/domain/design/template-specs.ts");
const { LOVE_SPECS } = await import("../../src/domain/love/templates.ts");
const specs = [
  ...TEMPLATE_SPECS.filter((s) => !s.legacy && (target === "all" || s.slug === target || (target.startsWith("category:") && s.category === target.slice(9)))),
  ...LOVE_SPECS.filter((s) => target === "all" || s.slug === target || target === "category:for-my-love").map((s) => ({ ...s, love: true })),
];
mkdirSync("public/templates/tall", { recursive: true });
const OPEN = { story: ".ls-start .inv-btn", letter: ".ll-env", surprise: ".lsu-gift", sorry: ".lq-ask .inv-btn" }; // what a visitor taps first, per love experience

/** The music and share pills at the top of a screen; they belong to the first screen of a stacked picture only. */
const hidePills = (page) => page.evaluate(() => {
  for (const el of document.querySelectorAll("body *")) {
    if (getComputedStyle(el).position !== "fixed") continue;
    const r = el.getBoundingClientRect();
    if (r.top < 70 && r.height < 70) el.style.setProperty("display", "none", "important");
  }
});

/** `n` screens down the page. Floating chrome (the RSVP pill, overlays, confetti) belongs to no screen of a stacked picture, so it is
 *  removed (music and share stay on the first); a love gift's own screens are fixed layers, so there only the pills go (`keepPills`
 *  keeps them on the first screen when it is the first of the whole picture). */
async function scrollShots(page, n, { chrome, keepPills }) {
  const shots = [];
  // never scroll past the end: a short page would only repeat its last screen
  n = Math.max(1, Math.min(n, Math.floor((await page.evaluate(() => document.documentElement.scrollHeight)) / H)));
  for (let y = 0; y <= H * n; y += 400) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(70); } // fire every reveal
  await page.waitForTimeout(2200);
  for (let i = 0; i < n; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * H);
    await page.waitForTimeout(i === 0 ? 900 : 700);
    if (chrome) await page.evaluate((first) => {
      for (const el of document.querySelectorAll("body *")) {
        if (getComputedStyle(el).position !== "fixed") continue;
        const r = el.getBoundingClientRect();
        if (first && r.top < 70 && r.height < 70) continue;
        el.style.setProperty("display", "none", "important");
      }
    }, i === 0);
    else if (!(keepPills && i === 0)) await hidePills(page);
    shots.push(await page.screenshot({ type: "png" }));
  }
  return shots;
}

const browser = await chromium.launch();
for (const s of specs) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, locale: "en-IN", userAgent: UA, isMobile: true, hasTouch: true, extraHTTPHeaders: { "Accept-Language": "en-IN,en;q=0.9" } });
  const page = await ctx.newPage();
  try {
    await page.goto(`${base}/preview/t/${s.slug}${s.love ? "" : "?gate=0"}`, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
    // the dev badge, and the cinematic flavour's letterbox bars (they would cut every screen of a stacked picture)
    await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; } .inv::before { display: none !important; }" });
    await page.waitForTimeout(s.love ? 2600 : 3500);
    let shots = [];
    if (s.love) {
      const tap = async (sel) => page.locator(sel).first().click({ timeout: 4000, force: true }).catch(() => {});
      if (OPEN[s.experience]) shots.push(await page.screenshot({ type: "png" })); // the start screen is the first thing seen
      if (OPEN[s.experience]) { await tap(OPEN[s.experience]); await page.waitForTimeout(s.experience === "letter" ? 3200 : 2200); }
      if (s.experience === "surprise") {
        await hidePills(page);
        shots.push(await page.screenshot({ type: "png" }));
        for (let i = 0; i < 2; i++) { await tap(".lsu-next"); await page.waitForTimeout(1300); await hidePills(page); shots.push(await page.screenshot({ type: "png" })); }
      } else {
        shots.push(...(await scrollShots(page, SCREENS - shots.length, { chrome: false, keepPills: shots.length === 0 })));
      }
    } else {
      shots = await scrollShots(page, SCREENS, { chrome: true });
    }
    const frames = shots.length;
    const h = Math.round((H * 2 * OUT_W) / (W * 2)); // one frame's height at the output width
    const frame = await Promise.all(shots.map((b) => sharp(b).resize({ width: OUT_W, height: h, fit: "fill" }).toBuffer()));
    await sharp({ create: { width: OUT_W, height: h * frame.length, channels: 3, background: "#ffffff" } })
      .composite(frame.map((input, i) => ({ input, top: i * h, left: 0 })))
      .webp({ quality: 66 }).toFile(`public/templates/tall/${s.slug}.webp`);
    console.log(s.slug, `${frames} screens`);
  } catch (e) {
    console.log(s.slug, "FAILED", String(e).slice(0, 160));
  }
  await ctx.close();
}
await browser.close();
