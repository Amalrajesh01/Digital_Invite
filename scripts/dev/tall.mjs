// The long pictures the homepage grid scrolls: the first few screens of each invitation, stacked into one tall image.
//   npx tsx scripts/dev/tall.mjs <slug|all|category:<slug>> [--screens=4] [--w=390 --h=844]
// Writes public/templates/tall/<slug>.webp. Needs the dev server (BASE) with the samples seeded, like tpl.mjs.
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
const specs = TEMPLATE_SPECS.filter((s) => !s.legacy && (target === "all" || s.slug === target || (target.startsWith("category:") && s.category === target.slice(9))));
mkdirSync("public/templates/tall", { recursive: true });

const browser = await chromium.launch();
for (const s of specs) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, locale: "en-IN", userAgent: UA, isMobile: true, hasTouch: true, extraHTTPHeaders: { "Accept-Language": "en-IN,en;q=0.9" } });
  const page = await ctx.newPage();
  try {
    await page.goto(`${base}/preview/t/${s.slug}?gate=0`, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
    // the dev badge, and the cinematic flavour's letterbox bars (they would cut every screen of a stacked picture)
    await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; } .inv::before { display: none !important; }" });
    await page.waitForTimeout(3500);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const frames = Math.max(1, Math.min(SCREENS, Math.floor(total / H)));
    // walk the page once so every reveal has fired, then come back and let the slow motion profiles settle
    for (let y = 0; y <= H * frames; y += 400) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(70); }
    await page.waitForTimeout(2200);
    const shots = [];
    for (let i = 0; i < frames; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * H);
      await page.waitForTimeout(i === 0 ? 900 : 700);
      // floating chrome (the RSVP pill, overlays, confetti) belongs to no screen of a stacked picture; the music and share buttons stay on the first
      await page.evaluate((first) => {
        for (const el of document.querySelectorAll("body *")) {
          if (getComputedStyle(el).position !== "fixed") continue;
          const r = el.getBoundingClientRect();
          if (first && r.top < 70 && r.height < 70) continue;
          el.style.setProperty("display", "none", "important");
        }
      }, i === 0);
      shots.push(await page.screenshot({ type: "png" }));
    }
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
