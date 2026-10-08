// Interaction QA for the invitation:  node scripts/dev/inv-flow.mjs <url> <prefix> [width=1440] [height=900]
// Opens the gallery lightbox (keyboard + close), plays through the RSVP, checks the film poster and the music pill,
// and prints anything that threw in the browser console.
import { chromium } from "playwright";
const [url, prefix, w = "1440", h = "900"] = process.argv.slice(2);
const slug = new URL(url).pathname.split("/").filter(Boolean)[1];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: Number(w) < 600 ? 2 : 1, locale: "en-IN" });
await ctx.addInitScript((s) => { try { sessionStorage.setItem(`inv-entered-${s}`, "1"); sessionStorage.setItem(`inv-celebrated-${s}`, "1"); } catch {} }, slug);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 240)));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 240)));
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
const snap = (n) => page.screenshot({ path: `.shots/${prefix}-${n}.png` });
const goTo = async (type) => { const loc = page.locator(`[data-section-type="${type}"]`).first(); if (!(await loc.count())) return false; await loc.scrollIntoViewIfNeeded(); await page.waitForTimeout(1400); return true; };
const report = [];

// sweep once so lazy sections mount
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 700) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(90); }

// ── gallery lightbox
if (await goTo("gallery")) {
  const thumb = page.locator('[data-section-type="gallery"] button[aria-label^="Open photo"]').first();
  await thumb.scrollIntoViewIfNeeded();
  await thumb.click();
  await page.waitForTimeout(900);
  const open1 = await page.locator("dialog[open]").count();
  const idx1 = await page.locator("dialog[open] p.tabular-nums").first().textContent().catch(() => "");
  await snap("lightbox");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
  const idx2 = await page.locator("dialog[open] p.tabular-nums").first().textContent().catch(() => "");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const open2 = await page.locator("dialog[open]").count();
  report.push(`lightbox: opened=${open1} counter ${idx1?.trim()} → ${idx2?.trim()} (ArrowRight) closed-after-Esc=${open2 === 0}`);
}

// ── film
const hasFilm = (await page.locator("[data-section-type=film] .film-frame").count()) > 0;
if (hasFilm && (await goTo("film"))) {
  await snap("film");
  const play = page.getByRole("button", { name: /play film/i }).first();
  report.push(`film: poster visible=${await play.isVisible()}`);
  await play.click();
  await page.waitForTimeout(800);
  report.push(`film: iframe after play=${await page.locator('[data-section-type="film"] iframe').count()}`);
} else report.push(`film: no film configured → nothing rendered (wrapper height ${await page.locator("[data-section-type=film]").first().evaluate((e) => e.offsetHeight).catch(() => 0)}px) — as designed`);

// ── music pill states
const pill = page.locator(".music-pill").first();
if (await pill.count()) {
  const s0 = await pill.getAttribute("data-state");
  await pill.click();
  await page.waitForTimeout(500);
  const s1 = await pill.getAttribute("data-state");
  await pill.click();
  await page.waitForTimeout(300);
  const s2 = await pill.getAttribute("data-state");
  report.push(`music: ${s0} → ${s1} → ${s2}`);
}

// ── RSVP
if (await goTo("rsvp")) {
  await page.getByRole("button", { name: /joyfully accept|accept/i }).first().click();
  await page.waitForTimeout(500);
  await page.fill("#rsvp-name", "Test Guest");
  const phone = page.locator("#rsvp-phone");
  if (await phone.count()) await phone.fill("9876543210");
  const meal = page.locator("#rsvp-meal");
  if (await meal.count()) await meal.selectOption({ index: 1 });
  await snap("rsvp-form");
  await page.getByRole("button", { name: /send my reply/i }).click();
  await page.waitForTimeout(1800);
  await snap("rsvp-thanks");
  const thanks = await page.locator(".rsvp-thanks-title").textContent().catch(() => null);
  report.push(`rsvp: thank-you shown=${thanks?.trim()}`);
}

// ── chat links
const chat = await page.locator("a.inv-chat-btn").evaluateAll((as) => as.map((a) => a.href.slice(0, 60)));
report.push(`chat links: ${chat.length} → ${chat[0] ?? "none"}`);

console.log(report.join("\n"));
if (errors.length) console.log("ERRORS:\n" + [...new Set(errors)].slice(0, 8).join("\n"));
await browser.close();
