// Plays every Forever Letter from its opening to its last screen, the way a recipient would: tapping, guessing, flipping, scratching.
//   npx tsx scripts/dev/letters-flow.mjs [all|slug|n,n] [--lang=ml] [--reduced]
// Reports a screen it could not get past, any script error, any failed request. Nothing is sent: it uses the public demonstration.
import { chromium } from "playwright";
import { LETTERS } from "../../src/domain/letters/index.ts";

const args = process.argv.slice(2);
const which = args.find((a) => !a.startsWith("--")) ?? "all";
const lang = args.find((a) => a.startsWith("--lang="))?.split("=")[1] ?? "en";
const reduced = args.includes("--reduced");
const base = process.env.BASE ?? "http://localhost:3000";
const list = which === "all" ? LETTERS : LETTERS.filter((l) => which.split(",").some((k) => k === l.slug || Number(k) === l.n));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: reduced ? "reduce" : "no-preference", locale: lang === "ml" ? "ml-IN" : "en-IN" });
let failed = 0;

const click = async (page, sel) => { const el = page.locator(sel).first(); if (!(await el.count())) return false; if (!(await el.isEnabled().catch(() => false))) return false; await el.click({ timeout: 4000 }).catch(() => {}); return true; };

for (const l of list) {
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push("script error: " + e.message.slice(0, 140)));
  page.on("response", (r) => { if (r.status() >= 500) problems.push(`${r.status()} ${r.url().replace(base, "")}`); });
  await page.goto(`${base}/for-my-love/letter-demo/${l.slug}${lang === "ml" ? "?lang=ml" : ""}`, { waitUntil: "load", timeout: 90000 });
  const seen = [];
  let stuck = 0, last = "";
  for (let step = 0; step < 90; step++) {
    await page.waitForTimeout(reduced ? 120 : 380);
    const kind = (await page.locator(".fl").getAttribute("data-kind").catch(() => null)) ?? "?";
    const sig = kind + "|" + (await page.locator(".fl-stage").innerText().catch(() => "")).slice(0, 80);
    if (kind !== seen[seen.length - 1]) seen.push(kind);
    stuck = sig === last ? stuck + 1 : 0; last = sig;
    if (stuck > 6) { problems.push(`stuck on "${kind}"`); break; }
    if (kind === "closing") break;
    const done = await page.locator(".fl-ask-done").count();
    if (done && !(await page.locator(".fl-after .fl-btn").count())) break;
    let did = false;
    switch (kind) {
      case "gate": did = await click(page, ".fg-cta") || await click(page, ".fl-gate .fl-btn"); await page.waitForTimeout(reduced ? 200 : 1700); break;
      case "clues": did = await click(page, ".fl-fb .fl-btn") || await click(page, ".fl-option:not([disabled])") || await click(page, ".fl-after .fl-btn:not([disabled])"); break;
      case "quiz": did = await click(page, ".fl-fb .fl-btn") || await click(page, ".fl-option:not([disabled])") || await click(page, ".fl-after .fl-btn:not([disabled])"); break;
      case "flip": { await click(page, ".fl-fcard[aria-pressed=false]"); await click(page, ".fl-fcard[aria-pressed=false]"); did = await click(page, ".fl-after .fl-btn:not([disabled])"); break; }
      case "deck": did = await click(page, ".fl-back-card") || await click(page, ".fl-after .fl-btn:not([disabled])"); break;
      case "envelopes": await click(page, ".fl-env"); did = await click(page, ".fl-after .fl-btn:not(.fl-btn-ghost)") || await click(page, ".fl-after .fl-btn"); break;
      case "scratch": did = await click(page, ".fl-after .fl-btn"); break;
      case "order": case "match": case "tiles": did = (await click(page, ".fl-after .fl-quiet")) || (await click(page, ".fl-after .fl-btn")); if (!did) did = await click(page, ".fl-after .fl-btn"); break;
      case "choose": did = await click(page, ".fl-pair .fl-option"); break;
      case "ask": did = await click(page, ".fl-answer-yes") || await click(page, ".fl-answer-talk") || await click(page, ".fl-answer") || await click(page, ".fl-after .fl-btn"); break;
      default: did = await click(page, ".fl-after .fl-btn:not([disabled])") || await click(page, ".fl-after .fl-quiet"); break;
    }
    if (!did) { await page.waitForTimeout(500); }
  }
  const end = await page.locator(".fl").getAttribute("data-kind").catch(() => "?");
  const ok = (end === "closing" || (await page.locator(".fl-ask-done").count()) > 0) && !problems.length;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${String(l.n).padStart(2, "0")} ${l.slug}  ${seen.join(" › ")}${problems.length ? "  !! " + problems.join("; ") : ""}${end !== "closing" && !problems.length ? `  (ended on ${end})` : ""}`);
  await page.close();
}
await browser.close();
console.log(failed ? `\n${failed} experience(s) did not play through` : "\nevery experience plays through to its end");
process.exit(failed ? 1 : 0);
