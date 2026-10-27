// Finds sideways scrolling on a phone:  npx tsx scripts/dev/hscroll.mjs [path,path,…]  (BASE=http://localhost:3000, --w=390)
// Reports pages wider than the screen and any visible element that scrolls sideways inside the page.
import { chromium } from "playwright";

const args = process.argv.slice(2);
const W = Number(args.find((a) => a.startsWith("--w="))?.slice(4) ?? 390);
const base = process.env.BASE ?? "http://localhost:3000";
const paths = (args.find((a) => !a.startsWith("--")) ?? "/,/templates,/pricing,/login,/preview/t/heavenly-grace,/preview/t/a-new-beginning,/preview/t/kerala-christian-heritage,/preview/t/royal-heritage,/preview/t/candle-of-faith").split(",");
const browser = await chromium.launch();
let bad = 0;
for (const p of paths) {
  const ctx = await browser.newContext({ viewport: { width: W, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  try {
    await page.goto(base + p + (p.startsWith("/preview") ? "?gate=0" : ""), { waitUntil: "networkidle", timeout: 120000 });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const vw = innerWidth, out = [];
      const wide = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - vw;
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        if (!/(auto|scroll)/.test(cs.overflowX) || el.scrollWidth <= el.clientWidth + 1 || el.clientWidth === 0) continue;
        const b = el.getBoundingClientRect();
        if (b.width === 0 || cs.visibility === "hidden") continue;
        out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")} (${el.scrollWidth}>${el.clientWidth})`);
      }
      return { wide, out: out.slice(0, 6) };
    });
    const ok = r.wide <= 1 && r.out.length === 0;
    if (!ok) bad++;
    console.log(`${ok ? "✔" : "✘"} ${p}${r.wide > 1 ? `  page ${r.wide}px too wide` : ""}${r.out.length ? `  scrolls: ${r.out.join(" | ")}` : ""}`);
  } catch (e) { bad++; console.log(`✘ ${p}  ${String(e).slice(0, 90)}`); }
  await ctx.close();
}
await browser.close();
console.log(bad ? `\n${bad} page(s) scroll sideways` : "\nno sideways scrolling");
process.exit(bad ? 1 : 0);
