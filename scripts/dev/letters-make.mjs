// A sender's whole journey for one Forever Letter, in a real browser, with screenshots.
//   npx tsx scripts/dev/letters-make.mjs <slug> [outDir]
// /for-my-love/make?letter=<slug> → names → settings → words → photos → music (library) → preview → send → the maker's page. Creates one real draft gift
// on the dev database (it expires on its own after 14 days; delete it from its page if you like).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const slug = process.argv[2] ?? "the-mystery-date";
const out = process.argv[3] ?? ".shots/fl/make";
const base = process.env.BASE ?? "http://localhost:3000";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, locale: "en-IN" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 160)));
page.on("response", (r) => { if (r.status() >= 500) errors.push(`${r.status()} ${r.url().replace(base, "")}`); });
const hide = () => page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }" }).catch(() => {});
const shot = async (name) => { await hide(); await page.waitForTimeout(500); await page.screenshot({ path: `${out}/${name}.png`, fullPage: true }); console.log("saved", name); };
const next = async () => { await page.getByRole("button", { name: /^(Next|Skip music)/ }).first().click(); await page.waitForTimeout(700); };

await page.goto(`${base}/for-my-love/make?letter=${slug}`, { waitUntil: "load", timeout: 90000 });
await page.getByLabel("Your name").first().waitFor({ timeout: 60000 });
await shot("1-names");
await page.getByLabel("Your name").first().fill("Arjun");
await page.getByLabel("Their name").fill("Meera");
await next();
await shot("2-settings");
await next();
await shot("3-words");
await next();
await shot("4-photos");
await next();
await shot("5-music");
const pick = page.getByRole("button", { name: "Use this" }).first();
if (await pick.count()) { await pick.click(); await page.waitForTimeout(2500); await shot("5b-music-chosen"); }
await next();
await page.waitForTimeout(3500);
await shot("6-preview");
await next();
await shot("7-send");
console.log(errors.length ? [...new Set(errors)].join("\n") : "no errors");
await browser.close();
