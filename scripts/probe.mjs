import { chromium } from "playwright";
const [url, expr] = process.argv.slice(2);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await p.goto(url, { waitUntil: "networkidle" }).catch(() => {});
await p.locator("text=Continue without music").first().click().catch(() => {});
await p.waitForTimeout(3500);
console.log(JSON.stringify(await p.evaluate(expr), null, 1));
await b.close();
