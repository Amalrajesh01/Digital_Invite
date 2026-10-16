// Public-site captures.   node scripts/dev/site.mjs <w> <h> <path=out> [<path=out> ...] [--full] [--wait=ms]
import { chromium } from "playwright";
const args = process.argv.slice(2);
const W = Number(args[0]), H = Number(args[1]);
const flags = args.filter((a) => a.startsWith("--"));
const pairs = args.slice(2).filter((a) => !a.startsWith("--"));
const base = process.env.BASE ?? "http://localhost:3000";
const wait = Number(flags.find((a) => a.startsWith("--wait="))?.split("=")[1] ?? 1200);
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: W < 600 ? 2 : 1, locale: "en-IN", userAgent: UA, isMobile: W < 600, hasTouch: W < 600 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));
for (const p of pairs) {
  const [path, out] = p.split("=");
  await page.goto(base + path, { waitUntil: "load", timeout: 90000 }).catch((e) => errors.push("goto " + path + ": " + e.message.slice(0, 100)));
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }" }).catch(() => {});
  if (flags.includes("--full")) { const h = await page.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < h; y += 600) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(80); } await page.evaluate(() => window.scrollTo(0, 0)); }
  await page.waitForTimeout(wait);
  await page.screenshot({ path: out, fullPage: flags.includes("--full") });
  console.log("saved", out, "←", page.url().replace(base, ""));
}
if (errors.length) console.log([...new Set(errors)].slice(0, 8).join("\n"));
await browser.close();
