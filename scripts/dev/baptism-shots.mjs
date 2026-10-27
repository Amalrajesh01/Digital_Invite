// QA for the baptism templates: how each section of the child's story looks on a phone, and what is wrong with the page.
//   node scripts/dev/baptism-shots.mjs <slug|all> [--out=.shots/bq] [--w=390 --h=844] [--sections=hero,about,gallery,people,guestbook,finale] [--full]
// For every template it opens /preview/t/<slug> like a visitor on a phone, scrolls each section into view, lets its reveal play and writes
//   <slug>-<section>.png (the viewport at the top of the section)   and, with --full, <slug>-<section>-full.png (the whole section).
// It also reports, per template: console errors, failed requests, images that did not load, and horizontal overflow.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--")) ?? "all";
const opt = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=") ?? d;
const base = process.env.BASE ?? "http://localhost:3000";
const out = opt("out", ".shots/bq");
const W = Number(opt("w", 390)), H = Number(opt("h", 844));
const sections = opt("sections", "hero,about,gallery,people,guestbook,finale").split(",");
const full = args.includes("--full");
const reduce = args.includes("--reduced");
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

const { BAPTISM_SPECS } = await import("../../src/domain/design/template-specs-baptism.ts");
const slugs = BAPTISM_SPECS.map((s) => s.slug).filter((s) => target === "all" || target.split(",").includes(s));
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
let bad = 0;
for (const slug of slugs) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, locale: "en-IN", userAgent: UA, isMobile: true, hasTouch: true, reducedMotion: reduce ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(`error: ${e.message.slice(0, 160)}`));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource: the server responded with a status of (403|404)/.test(m.text())) problems.push(`console: ${m.text().slice(0, 160)}`); });
  page.on("requestfailed", (r) => { const why = r.failure()?.errorText ?? ""; if (!/ERR_ABORTED/.test(why) && !/analytics|track|webpack-hmr|.ics/.test(r.url())) problems.push(`request failed: ${r.url().slice(-90)} (${why})`); });
  page.on("response", (r) => { if (r.status() >= 400 && !/favicon|api.track|analytics/.test(r.url())) problems.push(`HTTP ${r.status()}: ${r.url().slice(-90)}`); });
  await page.goto(`${base}/preview/t/${slug}?gate=0`, { waitUntil: "networkidle", timeout: 120000 }).catch(() => problems.push("page did not settle"));
  await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }" }).catch(() => {});
  await page.waitForTimeout(4200);
  // scroll the whole page once so that lazy photographs load and every reveal has had its moment
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 420) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(70); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  const have = [];
  for (const sec of sections) {
    const sel = sec === "hero" ? "[data-section=hero]" : `[data-section-type="${sec}"]`;
    const el = page.locator(sel).first();
    if (!(await el.count())) continue;
    have.push(sec);
    await el.evaluate((n) => n.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(sec === "hero" ? 5200 : 2600);
    await page.screenshot({ path: `${out}/${slug}-${sec}.png` });
    if (full && sec !== "hero") {
      const h = await el.evaluate((n) => n.getBoundingClientRect().height);
      if (h > H * 1.05) { await el.screenshot({ path: `${out}/${slug}-${sec}-full.png` }).catch(() => problems.push(`could not capture ${sec} in full`)); }
    }
  }
  const check = await page.evaluate(() => {
    const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc.slice(-60));
    const unloaded = [...document.images].filter((i) => !i.complete).length;
    return { overflow: document.documentElement.scrollWidth - window.innerWidth, broken, unloaded, sections: [...document.querySelectorAll("[data-section-type]")].map((n) => n.getAttribute("data-section-type")) };
  });
  if (check.overflow > 1) problems.push(`horizontal overflow ${check.overflow}px`);
  if (check.broken.length) problems.push(`broken images: ${check.broken.join(", ")}`);
  if (check.unloaded) problems.push(`${check.unloaded} images still loading`);
  const uniq = [...new Set(problems)];
  if (uniq.length) bad++;
  console.log(slug.padEnd(28), `[${have.join(",")}]`, uniq.length ? `PROBLEMS: ${uniq.join(" | ")}` : "ok");
  await ctx.close();
}
await browser.close();
console.log(bad ? `\n${bad} template(s) with problems` : "\nall clean");
process.exit(bad ? 1 : 0);
