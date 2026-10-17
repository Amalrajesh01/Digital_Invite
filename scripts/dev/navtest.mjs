// Opens the phone menu on a page and reports what it covers.   node scripts/dev/navtest.mjs <path> <out.png> [--studio]
import { chromium } from "playwright";
const [path = "/", out = ".shots/site/nav.png"] = process.argv.slice(2);
const base = process.env.BASE ?? "http://localhost:3000";
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: UA, isMobile: true, hasTouch: true, locale: "en-IN" });
const page = await ctx.newPage();
if (process.argv.includes("--studio")) {
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "admin@stackbridgelab.com"); await page.fill('input[type="password"]', "ChangeMe-Now-123");
  await page.click('button[type="submit"]'); await page.waitForURL(/\/admin/, { timeout: 60000 });
}
await page.goto(base + path, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }" });
const btn = page.locator('button[aria-label="Open menu"], button[aria-label="Menu"], button[aria-controls]').first();
console.log("menu button found:", await btn.count());
await btn.tap({ timeout: 5000 }).catch(async (e) => { console.log("tap failed:", e.message.slice(0, 100)); await btn.click({ force: true }); });
await page.waitForTimeout(800);
const m = await page.evaluate(() => { const el = document.querySelector("#mobile-nav, [role=dialog], nav[aria-label=Mobile]"); if (!el) return null; const r = (el.closest("#mobile-nav") ?? el).getBoundingClientRect(); return { top: Math.round(r.top), height: Math.round(r.height), width: Math.round(r.width), vh: innerHeight }; });
console.log("menu box:", JSON.stringify(m));
await page.screenshot({ path: out });
await browser.close();
