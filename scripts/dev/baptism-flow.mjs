// Interaction QA for the baptism templates, on a phone:  node scripts/dev/baptism-flow.mjs [slug,slug,…|all] [--w=390 --h=844]
// For each template: the viewer (open from a thumbnail, next by key and by swipe, close by Esc and by swipe-down, focus and scroll position kept),
// the blessing card (opens, suggestions fill the box, nothing is sent from a preview), the finale's calendar file, the candle (where there is one),
// a very long name (no overflow), reduced motion (nothing running on the hero), and what the first screen costs.
import { chromium } from "playwright";

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--")) ?? "heavenly-grace,a-new-beginning,blessing-from-above,kerala-christian-heritage,candle-of-faith";
const opt = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=") ?? d;
const base = process.env.BASE ?? "http://localhost:3000";
const W = Number(opt("w", 390)), H = Number(opt("h", 844));
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const { BAPTISM_SPECS } = await import("../../src/domain/design/template-specs-baptism.ts");
const slugs = target === "all" ? BAPTISM_SPECS.map((s) => s.slug) : target.split(",");

let failed = 0;
const check = (ok, what, detail = "") => { console.log(`  ${ok ? "✔" : "✘"} ${what}${detail ? `  (${detail})` : ""}`); if (!ok) failed++; };

async function open(browser, slug, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: "en-IN", userAgent: UA, isMobile: true, hasTouch: false, extraHTTPHeaders: { "Accept-Language": "en-IN,en;q=0.9" }, acceptDownloads: true, ...extra });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 140)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|status of (403|404)/.test(m.text())) errors.push(m.text().slice(0, 140)); });
  await page.goto(`${base}/preview/t/${slug}?gate=0`, { waitUntil: "networkidle", timeout: 120000 });
  await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }" });
  await page.waitForTimeout(2500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 420) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(50); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  return { ctx, page, errors };
}
const toSection = async (page, type) => { await page.locator(`[data-section-type="${type}"]`).first().evaluate((n) => n.scrollIntoView({ block: "start" })); await page.waitForTimeout(1200); };

const browser = await chromium.launch();
for (const slug of slugs) {
  console.log(`\n${slug}`);
  const { ctx, page, errors } = await open(browser, slug);

  // ── the viewer ──
  await toSection(page, "gallery");
  const tile = page.locator("[data-lb]").first();
  const n = await page.locator("[data-lb]").count();
  check(n >= 5 && n <= 8, "the gallery has five to eight photographs", `${n}`);
  const before = await page.evaluate(() => window.scrollY);
  await tile.evaluate((n) => n.scrollIntoView({ block: "center" })); await page.waitForTimeout(400);
  const yBefore = await page.evaluate(() => window.scrollY);
  await tile.click({ force: true });
  await page.waitForTimeout(700);
  const dlg = page.locator("dialog[open]");
  check((await dlg.count()) === 1, "tapping a photograph opens the viewer");
  const counter = async () => (await dlg.locator("[aria-live=polite]").first().textContent().catch(() => "")) ?? "";
  check(/^1 of \d+$/.test((await counter()).trim()), "it opens on that photograph", (await counter()).trim());
  const imgOk = await dlg.locator("img").first().evaluate((i) => i.complete && i.naturalWidth > 0).catch(() => false);
  check(imgOk, "the photograph is shown, at its own proportions");
  const ratio = await dlg.locator("img").first().evaluate((i) => { const r = i.getBoundingClientRect(); return [r.width / r.height, i.naturalWidth / i.naturalHeight]; }).catch(() => [0, 1]);
  check(Math.abs(ratio[0] - ratio[1]) / ratio[1] < 0.02, "it is never stretched", `${ratio[0].toFixed(3)} vs ${ratio[1].toFixed(3)}`);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(600);
  check(/^2 of/.test((await counter()).trim()), "the right arrow moves on", (await counter()).trim());
  // a swipe to the left, made with the pointer
  const box = await dlg.locator("img").first().boundingBox();
  if (box) {
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.8, y); await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.3, y, { steps: 6 }); await page.mouse.up();
    await page.waitForTimeout(700);
    check(/^3 of/.test((await counter()).trim()), "a swipe moves on", (await counter()).trim());
  }
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(500);
  check(/^2 of/.test((await counter()).trim()), "the left arrow goes back");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  check((await page.locator("dialog[open]").count()) === 0, "Escape closes it");
  const yAfter = await page.evaluate(() => window.scrollY);
  check(Math.abs(yAfter - yBefore) < 4, "the page has not moved", `${yBefore} → ${yAfter}`);
  const focusKept = await page.evaluate(() => document.activeElement?.hasAttribute("data-lb") ?? false);
  check(focusKept, "focus is back on the photograph that was tapped");
  // swipe down closes
  await tile.click({ force: true }); await page.waitForTimeout(600);
  const b2 = await page.locator("dialog[open] img").first().boundingBox();
  if (b2) { await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 3); await page.mouse.down(); await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 3 + 220, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(600); }
  check((await page.locator("dialog[open]").count()) === 0, "a swipe down closes it");
  void before;

  // ── the blessing card ──
  if (await page.locator('[data-section-type="guestbook"] .bc-cover').count()) {
    await toSection(page, "guestbook");
    let sent = 0;
    page.on("request", (r) => { if (/\/messages/.test(r.url()) && r.method() === "POST") sent++; });
    await page.locator(".bc-cover").click();
    await page.waitForTimeout(1400);
    check((await page.locator(".bc-inside").count()) === 1, "the card opens onto a form");
    await page.locator(".bc-idea").first().click();
    const filled = await page.locator("#gb-body").inputValue();
    check(filled.length > 10, "a suggestion fills the blessing", filled.slice(0, 40));
    await page.locator("#gb-name").fill("A friend").catch(() => {});
    await page.locator(".bc-inside button.inv-btn").click();
    await page.waitForTimeout(700);
    check(sent === 0, "nothing is sent from a preview");
    check((await page.locator(".bc-inside").textContent())?.toLowerCase().includes("preview"), "the preview says so");
  } else console.log("  – this template shows its blessings as a wall");

  // ── the finale and the calendar ──
  await toSection(page, "finale");
  const dl = page.waitForEvent("download", { timeout: 6000 }).catch(() => null);
  await page.getByRole("button", { name: /add to calendar/i }).last().click().catch(() => {});
  const file = await dl;
  if (file) {
    const text = await (await import("node:fs/promises")).readFile(await file.path(), "utf8");
    check(/BEGIN:VEVENT/.test(text) && /DTSTART:2027/.test(text) && /LOCATION:/.test(text), "the calendar file carries the real date and place", file.suggestedFilename());
  } else check(false, "the finale adds the day to a calendar");
  check((await page.locator("[data-section-type=finale] h2").first().textContent())?.trim().length > 2, "the finale shows the child’s name");

  // ── the candle ──
  if (await page.locator(".gh-wickbtn").count()) {
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
    check((await page.locator(".hv-grace").getAttribute("data-lit")) === "0", "the candle starts unlit, and the page is complete without it", "");
    await page.locator(".gh-wickbtn").click();
    await page.waitForTimeout(1800);
    check((await page.locator(".hv-grace").getAttribute("data-lit")) === "1", "a tap lights it");
    check(Number(await page.locator(".gh-lit-msg").evaluate((e) => getComputedStyle(e).opacity)) > 0.9, "and the blessing appears");
  }

  // ── a very long name ──
  await page.evaluate(() => window.scrollTo(0, 0));
  const long = await page.evaluate(() => {
    const el = document.querySelector(".gh-name");
    if (!el) return null;
    el.setAttribute("data-len", "long");
    el.textContent = "Alexandrina Maximilianus Wolfeschlegelstein";
    return { over: document.documentElement.scrollWidth - innerWidth, nameOver: el.scrollWidth - el.clientWidth };
  });
  check(!long || (long.over <= 1 && long.nameOver <= 1), "a very long name does not overflow the screen", long ? JSON.stringify(long) : "no hero name");

  const audioPlaying = await page.evaluate(() => [...document.querySelectorAll("audio")].some((a) => !a.paused));
  check(!audioPlaying, "no sound plays by itself");
  check(errors.length === 0, "no errors in the console", errors.slice(0, 2).join(" | "));
  await ctx.close();

  // ── reduced motion: the hero is the finished picture and nothing is running ──
  const r = await open(browser, slug, { reducedMotion: "reduce" });
  const running = await r.page.evaluate(() => document.querySelector(".hv-grace") ? document.getAnimations().filter((a) => a.playState === "running" && (a.effect?.target?.closest?.(".hv-grace"))).length : -1);
  check(running === 0, "reduced motion: nothing on the hero is moving", `${running} running`);
  const frameOpacity = await r.page.evaluate(() => { const f = document.querySelector(".hv-grace .gh-frame, .hv-grace .gh-beyond"); return f ? Number(getComputedStyle(f).opacity) : 1; });
  check(frameOpacity > 0.95, "reduced motion: the portrait is fully there");
  await r.ctx.close();

  // ── what the first screen costs ──
  const c = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, locale: "en-IN", userAgent: UA, isMobile: true, extraHTTPHeaders: { "Accept-Language": "en-IN,en;q=0.9" } });
  const p = await c.newPage();
  let bytes = 0, imgs = 0;
  p.on("response", async (res) => { try { const len = Number(res.headers()["content-length"] ?? 0) || (await res.body()).length; bytes += len; if (/image\//.test(res.headers()["content-type"] ?? "")) imgs++; } catch { /* a response that vanished */ } });
  await p.addInitScript(() => { window.__lcp = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); });
  await p.goto(`${base}/preview/t/${slug}?gate=0`, { waitUntil: "load", timeout: 120000 });
  await p.waitForTimeout(3500);
  const lcp = await p.evaluate(() => Math.round(window.__lcp));
  console.log(`  · first screen: ${(bytes / 1024).toFixed(0)} KB over ${imgs} images, largest paint at ${lcp} ms (a development server, uncached)`);
  await c.close();
}
await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
