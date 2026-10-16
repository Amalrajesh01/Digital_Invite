// End-to-end check of a love gift's life:  node scripts/dev/gift-e2e.mjs
// maker (HTTP) creates → writes → sends; studio (browser) publishes → pauses → deletes. Prints what a stranger sees at each step.
import { chromium } from "playwright";
const base = process.env.BASE ?? "http://localhost:3000";
const H = { "content-type": "application/json", origin: base };
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return t.slice(0, 200); } };
const log = (...a) => console.log(...a);

const created = await j(await fetch(`${base}/api/gift`, { method: "POST", headers: H, body: JSON.stringify({ occasion: "anniversary" }) }));
const d = created.data ?? created;
log("create →", Object.keys(d).join(","));
const { id, token } = d;
const T = { ...H, "x-gift-token": token };

const got = await j(await fetch(`${base}/api/gift/${id}`, { headers: T }));
const love = (got.data ?? got).love;
love.from = "Arjun"; love.to = "Meera"; love.headline = { en: "Five years, and I would choose you again" }; love.letter = { en: "Meera, thank you for every ordinary day that turned out to be the best of my life." };
love.experience = "letter"; love.date = "2026-12-12"; love.language = "en";
const save = await j(await fetch(`${base}/api/gift/${id}`, { method: "PUT", headers: T, body: JSON.stringify(love) }));
log("save →", JSON.stringify(save).slice(0, 120));

const wrong = await fetch(`${base}/api/gift/${id}`, { headers: { ...H, "x-gift-token": "nope" } });
log("wrong token →", wrong.status);

const sub = await j(await fetch(`${base}/api/gift/${id}/submit`, { method: "POST", headers: T, body: JSON.stringify({ name: "Arjun Test", phone: "+91 98460 00011" }) }));
log("submit →", JSON.stringify(sub).slice(0, 160));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "en-IN" });
const page = await ctx.newPage();
await page.goto(base + "/login", { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "admin@stackbridgelab.com");
await page.fill('input[type="password"]', "ChangeMe-Now-123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin/, { timeout: 60000 });
await page.goto(base + "/admin/gifts", { waitUntil: "networkidle" });
const row = page.locator("tr", { hasText: "Arjun Test" }).first();
log("studio sees →", (await row.innerText()).replace(/\s+/g, " "));
await row.getByRole("button", { name: "Publish" }).click();
await page.waitForTimeout(2500);
await page.reload({ waitUntil: "networkidle" });
const row2 = page.locator("tr", { hasText: "Arjun Test" }).first();
log("after publish →", (await row2.innerText()).replace(/\s+/g, " "));
const slugHref = await row2.locator('a[href*="wa.me"]').getAttribute("href");
const link = decodeURIComponent(slugHref).split("private link: ")[1] ?? "";
log("link →", link);
const UA = { "user-agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36" };
const pub = await fetch(link.replace(/^https?:\/\/[^/]+/, base), { headers: UA });
const html = await pub.text();
log("stranger opens it →", pub.status, "noindex:", /noindex/.test(html), "cache:", pub.headers.get("cache-control"), "has letter text:", html.includes("ordinary day"));
await row2.getByRole("button", { name: "Pause" }).click();
const seen = [];
for (let i = 0; i < 3; i++) { await page.waitForTimeout(1500); const r = await fetch(link.replace(/^https?:\/\/[^/]+/, base), { headers: UA }); const t = await r.text(); seen.push(`${r.status}${t.includes("ordinary day") ? " LEAKS GIFT" : " no gift text"}`); }
log("paused →", seen.join(" | "));
await page.reload({ waitUntil: "networkidle" });
await page.locator("tr", { hasText: "Arjun Test" }).first().getByRole("button", { name: "Delete" }).click();
await page.getByRole("button", { name: "Delete", exact: true }).last().click();
await page.waitForTimeout(2500);
const gone = await fetch(link.replace(/^https?:\/\/[^/]+/, base), { headers: UA });
const owner = await fetch(`${base}/api/gift/${id}`, { headers: T });
log("deleted → public", gone.status, "· maker's own link", owner.status);
// tidy up any test gifts left behind by an earlier, interrupted run
await page.goto(base + "/admin/gifts", { waitUntil: "networkidle" });
for (let n = 0; n < 5 && (await page.locator("tr", { hasText: "Arjun Test" }).count()); n++) {
  await page.locator("tr", { hasText: "Arjun Test" }).first().getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).last().click();
  await page.waitForTimeout(2000);
  await page.reload({ waitUntil: "networkidle" });
}
log("test gifts left:", await page.locator("tr", { hasText: "Arjun Test" }).count());
await browser.close();
