// Invitation QA captures.
//   node scripts/dev/inv.mjs <url> <prefix> [width=390] [height=844] [--sections=hero,story,…] [--progress=0,.5,1] [--gate]
//        [--opening=1200,2600] [--full] [--reduced] [--locale=ml] [--celebrate] [--wait=ms]
// Writes .shots/<prefix>-<name>.png. By default the opening gate is skipped (as a returning visitor would);
// pass --gate to tap through it like a first-time guest, and --opening=ms,ms to capture the celebration.
import { chromium } from "playwright";
const [url, prefix, w = "390", h = "844", ...rest] = process.argv.slice(2);
const flags = rest.filter((a) => a.startsWith("--"));
const opt = (n) => flags.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=");
const width = Number(w), height = Number(h);
const slug = new URL(url).pathname.split("/").filter(Boolean)[1];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: width < 600 ? 2 : 1, locale: "en-IN", reducedMotion: flags.includes("--reduced") ? "reduce" : "no-preference" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 240)));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 240)));
const skipGate = !flags.includes("--gate");
const quiet = !flags.includes("--celebrate");
await ctx.addInitScript(({ s, skip, quiet }) => { try { if (skip) sessionStorage.setItem(`inv-entered-${s}`, "1"); if (quiet) sessionStorage.setItem(`inv-celebrated-${s}`, "1"); } catch {} }, { s: slug, skip: skipGate, quiet });
if (opt("locale")) await ctx.addCookies([{ name: "inv_lang", value: opt("locale"), url: new URL(url).origin }]);
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
await page.waitForTimeout(800);
const shot = (name, full = false) => page.screenshot({ path: `.shots/${prefix}-${name}.png`, fullPage: full });

if (!skipGate) {
  await shot("gate");
  await page.locator(".cine").first().click({ timeout: 800 }).catch(() => {});
  const btn = page.getByRole("button", { name: /continue without music|tap to open|^enter/i }).first();
  await btn.click({ timeout: 5000 }).catch(() => errors.push("gate click failed"));
  const marks = (opt("opening") ?? "").split(",").filter(Boolean).map(Number);
  let t = 0;
  for (const m of marks) { await page.waitForTimeout(Math.max(0, m - t)); t = m; await shot(`open-${m}`); }
  await page.waitForTimeout(Math.max(0, 4200 - t));
} else {
  await page.waitForTimeout(600);
}

const sections = await page.evaluate(() => [...document.querySelectorAll("[data-section-type]")].map((e) => e.getAttribute("data-section-type")));
const total = () => page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const settle = Number(opt("wait") ?? 1500);
const scrollTo = async (y) => { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(settle); };

// warm up lazy sections + reveal observers by sweeping once
const th = await total();
for (let y = 0; y <= th; y += Math.max(300, height * 0.7)) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(110); }
await scrollTo(0);

const want = (opt("sections") ?? "").split(",").filter(Boolean);
for (const id of want) {
  const loc = page.locator(`[data-section-type="${id}"]`).first();
  if (!(await loc.count())) { console.log("missing:", id); continue; }
  const top = await loc.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await scrollTo(Math.max(0, top - 4));
  await shot(id);
}
for (const p of (opt("progress") ?? "").split(",").filter(Boolean)) {
  await scrollTo(Math.round((await total()) * Number(p)));
  await shot(`p${Math.round(Number(p) * 100)}`);
}
if (flags.includes("--full")) { await scrollTo(0); await shot("full", true); }
console.log("sections:", sections.join(", "));
if (errors.length) console.log([...new Set(errors)].slice(0, 10).join("\n"));
await browser.close();
