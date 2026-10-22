// Template QA and gallery thumbnails.
//   npx tsx scripts/dev/tpl.mjs <slug|all|category:<slug>> [--out=.shots/tpl] [--thumbs] [--gate] [--scroll=0.25,0.55] [--w=390 --h=844]
// For each template it opens /preview/t/<slug> like a visitor on a phone and writes
//   <slug>-gate.png (the opening, with --gate)   <slug>-hero.png (the first screen)   <slug>-sNN.png (screens down the page, with --scroll)
// With --thumbs it instead writes public/templates/<slug>.webp — the picture the gallery shows for the template.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--")) ?? "all";
const opt = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=") ?? d;
const base = process.env.BASE ?? "http://localhost:3000";
const out = opt("out", ".shots/tpl");
const extraWait = Number(opt("wait", 0)); // slower motion profiles are still arriving at 3 s; --wait=3000 waits for them
const W = Number(opt("w", 390)), H = Number(opt("h", 844));
// a normal phone browser, so the preview guard (which refuses scripted clients) lets our own QA through
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

const { TEMPLATE_SPECS } = await import("../../src/domain/design/template-specs.ts");
const specs = TEMPLATE_SPECS.filter((s) => !s.legacy && (target === "all" || s.slug === target || (target.startsWith("category:") && s.category === target.slice(9))));
mkdirSync(out, { recursive: true });
if (args.includes("--thumbs")) mkdirSync("public/templates", { recursive: true });

const browser = await chromium.launch();
for (const s of specs) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, locale: "en-IN", userAgent: UA, isMobile: true, hasTouch: true, extraHTTPHeaders: { "Accept-Language": "en-IN,en;q=0.9" } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
  const wantGate = args.includes("--gate");
  await page.goto(`${base}/preview/t/${s.slug}${wantGate ? "" : "?gate=0"}`, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
  await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }" }).catch(() => {});
  await page.waitForTimeout((wantGate ? 1500 : 3200) + (wantGate ? 0 : extraWait));
  if (wantGate) {
    await page.screenshot({ path: `${out}/${s.slug}-gate.png` });
    await page.locator(".gate [role=button], .gate .inv-btn").first().click({ timeout: 4000, force: true }).catch(() => errors.push("no gate button"));
    await page.waitForTimeout(3800 + extraWait);
  }
  if (args.includes("--thumbs")) {
    const buf = await page.screenshot({ type: "png" });
    await sharp(buf).resize({ width: 540 }).webp({ quality: 78 }).toFile(`public/templates/${s.slug}.webp`);
  } else {
    await page.screenshot({ path: `${out}/${s.slug}-hero.png` });
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (const [i, p] of opt("scroll", "").split(",").filter(Boolean).entries()) {
      for (let y = 0; y <= total; y += 500) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(60); }
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * Number(p)));
      await page.waitForTimeout(1300);
      await page.screenshot({ path: `${out}/${s.slug}-s${i + 1}.png` });
    }
  }
  console.log(s.slug, errors.length ? "ERRORS: " + [...new Set(errors)].join(" | ") : "ok");
  await ctx.close();
}
await browser.close();
