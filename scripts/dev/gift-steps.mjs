// Walks the For My Love builder on a phone and screenshots every step.   node scripts/dev/gift-steps.mjs [outdir]
// It really creates a draft gift (deleted by the daily expiry job after 14 days, or by its maker).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const out = process.argv[2] ?? ".shots/site/gift";
mkdirSync(out, { recursive: true });
const base = process.env.BASE ?? "http://localhost:3000";
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-IN", userAgent: UA, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
await page.goto(base + "/for-my-love/make", { waitUntil: "networkidle" });
const hide = () => page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }" });
await hide();
const shot = async (n) => { await page.waitForTimeout(900); await page.screenshot({ path: `${out}/${n}.png`, fullPage: true }); console.log("saved", n); };
await page.getByRole("button", { name: /Anniversary/ }).first().click();
await page.waitForTimeout(2500);
await shot("2-names");
await page.getByPlaceholder(/./).first().fill("Arjun").catch(() => {});
const inputs = page.locator("input.field-input, input[type=text]");
const n = await inputs.count();
if (n >= 2) { await inputs.nth(0).fill("Arjun"); await inputs.nth(1).fill("Meera"); }
await shot("2b-names-filled");
await page.getByRole("button", { name: /^Next/ }).click(); await shot("3-feel");
await page.getByRole("button", { name: /^Next/ }).click(); await shot("4-words");
const ta = page.locator("textarea").first();
if (await ta.count()) await ta.fill("Thank you for every ordinary day.");
await shot("4b-words-filled");
await page.getByRole("button", { name: /^Next/ }).click(); await shot("5-photos");
await page.getByRole("button", { name: /^(Next|Skip)/ }).click(); await shot("6-music");
await page.getByRole("button", { name: /^(Next|Skip music)/ }).click(); await shot("7-preview");
await page.getByRole("button", { name: /^Next/ }).click().catch(() => {}); await shot("8-send");
console.log(errors.length ? "ERRORS: " + [...new Set(errors)].join(" | ") : "no page errors");
await browser.close();
