// Screenshots of Forever Letters, as a phone shows them.
//   npx tsx scripts/dev/letters.mjs <slug|all|n,n,n> <outDir> [--beats=0,1,2] [--w=390] [--h=844] [--wait=1800] [--lang=ml]
// Opens the public demonstration of each letter (no login, nothing is stored). `--beats` are screen numbers: 0 is the opening.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { LETTERS } from "../../src/domain/letters/index.ts";

const args = process.argv.slice(2);
const which = args[0] ?? "all";
const out = args[1] ?? ".shots/fl/letters";
const flag = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=") ?? d;
const beats = flag("beats", "0").split(",").map(Number);
const W = Number(flag("w", 390)), H = Number(flag("h", 844)), wait = Number(flag("wait", 1800)), lang = flag("lang", "en");
const base = process.env.BASE ?? "http://localhost:3000";
const list = which === "all" ? LETTERS : LETTERS.filter((l) => which.split(",").some((k) => k === l.slug || Number(k) === l.n));
mkdirSync(out, { recursive: true });
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, userAgent: UA, isMobile: W < 600, hasTouch: W < 600, locale: "en-IN" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 160)); });
for (const l of list) {
  for (const b of beats) {
    const url = `${base}/for-my-love/letter-demo/${l.slug}?beat=${b}${lang === "ml" ? "&lang=ml" : ""}`;
    await page.goto(url, { waitUntil: "load", timeout: 90000 }).catch((e) => errors.push(`goto ${l.slug}: ${e.message.slice(0, 80)}`));
    await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }" }).catch(() => {});
    await page.waitForTimeout(wait);
    const file = `${out}/${String(l.n).padStart(2, "0")}-${l.slug}${beats.length > 1 ? `-b${b}` : ""}.png`;
    await page.screenshot({ path: file });
    console.log("saved", file);
  }
}
if (errors.length) console.log([...new Set(errors)].slice(0, 12).join("\n"));
await browser.close();
