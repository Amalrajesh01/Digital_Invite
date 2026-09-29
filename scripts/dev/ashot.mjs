// Authenticated screenshots:  node scripts/dev/ashot.mjs <who: admin|luxury|signature> <width> <height> <path=out> [<path=out> ...] [--full] [--click=sel] [--wait=ms]
import { chromium } from "playwright";
const args = process.argv.slice(2);
const who = args[0];
const width = Number(args[1]), height = Number(args[2]);
const flags = args.filter((a) => a.startsWith("--"));
const pairs = args.slice(3).filter((a) => !a.startsWith("--"));
const creds = { admin: ["admin@aoire.in", "ChangeMe-Now-123"], luxury: ["luxury.client@example.com", "Demo-Client-123"], signature: ["signature.client@example.com", "Demo-Client-123"] }[who];
const base = process.env.BASE ?? "http://localhost:3000";
const opt = (n) => flags.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=");
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: width < 600 ? 2 : 1, locale: "en-IN" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 300)));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 300)));
await page.goto(base + "/login", { waitUntil: "networkidle" });
await page.fill('input[type="email"]', creds[0]);
await page.fill('input[type="password"]', creds[1]);
await page.click('button[type="submit"]');
await page.waitForURL(/\/(admin|client)/, { timeout: 60000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);
for (const p of pairs) {
  const [rawPath, out] = p.split("=");
  const path = "/" + rawPath.replace(/^\/+/, "");
  await page.goto(base + path, { waitUntil: "load", timeout: 90000 }).catch((e) => errors.push("goto: " + e.message.slice(0, 120)));
  await page.waitForLoadState("networkidle").catch(() => {});
  const click = opt("click");
  if (click) { await page.locator(click).first().click({ timeout: 5000 }).catch(() => errors.push("click failed " + click)); await page.waitForTimeout(600); }
  await page.waitForTimeout(Number(opt("wait") ?? 700));
  await page.screenshot({ path: out, fullPage: flags.includes("--full") });
  console.log("saved", out, "←", page.url().replace(base, ""));
}
if (errors.length) console.log([...new Set(errors)].slice(0, 8).join("\n"));
await browser.close();
