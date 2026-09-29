// Screenshot helper for visual QA:  node scripts/shot.mjs <url> <out.png> [width=390] [height=844] [--full] [--click="selector"] [--wait=ms] [--scroll=selector]
import { chromium } from "playwright";
const args = process.argv.slice(2);
const [url, out] = args;
const num = (i, d) => (args[i] && !args[i].startsWith("--") ? Number(args[i]) : d);
const width = num(2, 390), height = num(3, 844);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=");
const full = args.includes("--full");
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: width < 600 ? 2 : 1, locale: "en-IN", reducedMotion: args.includes("--reduced") ? "reduce" : "no-preference" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
const click = opt("click");
if (click) for (const sel of click.split("|")) { await page.locator(sel).first().click({ timeout: 8000 }).catch(() => errors.push("click failed: " + sel)); await page.waitForTimeout(Number(opt("clickwait") ?? 3200)); }
const scroll = opt("scroll");
if (scroll) { await page.locator(scroll).first().scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(1200); }
if (full) {
  // trigger reveal-on-scroll by scrolling through the page
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(90); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
}
await page.waitForTimeout(Number(opt("wait") ?? 800));
await page.screenshot({ path: out, fullPage: full });
if (errors.length) console.log(errors.slice(0, 12).join("\n"));
console.log("saved", out);
await browser.close();
