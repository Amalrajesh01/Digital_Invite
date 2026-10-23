// The pictures of the Forever Letters gallery, made from the experiences themselves (never mock-ups).
//   npx tsx scripts/dev/letters-covers.mjs [all|slug|n,n] [--wait=2600]
// For each experience, against a running dev server: a COVER (its opening, as a phone shows it) and a TALL storyboard
// (up to six of its screens, stacked, which the gallery slowly scrolls). Written to public/letters/cover and public/letters/tall.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { LETTERS } from "../../src/domain/letters/index.ts";
import { beatHasContent, demoValues } from "../../src/domain/letters/values.ts";

const args = process.argv.slice(2);
const which = args.find((a) => !a.startsWith("--")) ?? "all";
const flag = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=") ?? d;
const wait = Number(flag("wait", 2600));
const base = process.env.BASE ?? "http://localhost:3000";
const list = which === "all" ? LETTERS : LETTERS.filter((l) => which.split(",").some((k) => k === l.slug || Number(k) === l.n));
mkdirSync("public/letters/cover", { recursive: true });
mkdirSync("public/letters/tall", { recursive: true });

const W = 390, H = 780;
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1.5, userAgent: UA, isMobile: true, hasTouch: true, locale: "en-IN" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 160)));

for (const l of list) {
  const v = demoValues(l);
  const n = l.beats.filter((b) => b.type === "gate" || beatHasContent(l, v, b)).length;
  const k = Math.min(6, n);
  const picks = [...new Set(Array.from({ length: k }, (_, i) => Math.round((i * (n - 1)) / Math.max(1, k - 1))))];
  const shots = [];
  for (const b of picks) {
    await page.goto(`${base}/for-my-love/letter-demo/${l.slug}?beat=${b}`, { waitUntil: "load", timeout: 90000 }).catch((e) => errors.push(`${l.slug}: ${e.message.slice(0, 80)}`));
    await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root], .fl-demo { display: none !important; }" }).catch(() => {});
    await page.waitForTimeout(b === 0 ? Math.min(wait, 2200) : wait + 1400);
    shots.push(await page.screenshot());
  }
  const cover = await sharp(shots[0]).resize({ width: 540 }).webp({ quality: 82 }).toBuffer();
  await sharp(cover).toFile(`public/letters/cover/${l.slug}.webp`);
  const frames = await Promise.all(shots.map((s) => sharp(s).resize({ width: 520 }).toBuffer()));
  const fh = (await sharp(frames[0]).metadata()).height;
  await sharp({ create: { width: 520, height: fh * frames.length, channels: 3, background: "#ffffff" } })
    .composite(frames.map((input, i) => ({ input, left: 0, top: i * fh }))).webp({ quality: 70 }).toFile(`public/letters/tall/${l.slug}.webp`);
  console.log(String(l.n).padStart(2, "0"), l.slug, `${picks.length} screens`);
}
if (errors.length) console.log([...new Set(errors)].slice(0, 10).join("\n"));
await browser.close();
