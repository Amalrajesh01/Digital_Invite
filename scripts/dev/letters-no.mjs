// The playful “No”: it hops away from a pointer at most three times, never from a keyboard, never under reduced motion,
// and an ordinary “No, thank you” is always there. Run against the demonstration of letter 1 (a lighthearted date invitation).
//   npx tsx scripts/dev/letters-no.mjs
import { chromium } from "playwright";
const base = process.env.BASE ?? "http://localhost:3000";
const slug = "steal-a-little-of-your-time";
const browser = await chromium.launch();
let bad = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? "  " + extra : ""}`); if (!ok) bad++; };

async function toAsk(page) {
  await page.goto(`${base}/for-my-love/letter-demo/${slug}?beat=3`, { waitUntil: "load" });
  await page.waitForSelector(".fl-answer", { timeout: 20000 });
  await page.waitForTimeout(1200);
}
const tx = (page) => page.locator(".fl-dodger").evaluate((e) => getComputedStyle(e).transform);

// 1 · mouse
{
  const ctx = await browser.newContext({ viewport: { width: 500, height: 800 } });
  const page = await ctx.newPage();
  await toAsk(page);
  check("the moving No exists when the sender switched it on", (await page.locator(".fl-dodger").count()) === 1);
  const seen = new Set();
  for (let i = 0; i < 6; i++) { await page.locator(".fl-dodger").hover({ force: true }).catch(() => {}); await page.mouse.move(5, 5); await page.waitForTimeout(450); seen.add(await tx(page)); }
  check("it hops at most three times, then stays put", seen.size === 3, `${seen.size} positions`);
  check("an ordinary “No, thank you” is there from the start", (await page.getByRole("button", { name: /I would rather not — thank you/i }).count()) === 1);
  await page.getByRole("button", { name: /I would rather not — thank you/i }).click().catch(() => {});
  await page.waitForTimeout(500);
  check("declining is received with thanks", (await page.locator(".fl-ask-done").count()) === 1);
  await ctx.close();
}
// 2 · keyboard: focusing and pressing Enter on the No declines at once, it never moves
{
  const ctx = await browser.newContext({ viewport: { width: 500, height: 800 } });
  const page = await ctx.newPage();
  await toAsk(page);
  await page.locator(".fl-dodger").focus();
  const before = await tx(page);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  check("keyboard: no hop, the answer is simply given", before === "matrix(1, 0, 0, 1, 0, 0)" && (await page.locator(".fl-ask-done").count()) === 1);
  await ctx.close();
}
// 3 · reduced motion: no effect at all
{
  const ctx = await browser.newContext({ viewport: { width: 500, height: 800 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await toAsk(page);
  check("reduced motion: the No never moves (it is an ordinary button)", (await page.locator(".fl-dodger").count()) === 0 && (await page.locator(".fl-answer-no").count()) === 1);
  await ctx.close();
}
// 4 · touch: a tap hops it, and after three it can be tapped
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await toAsk(page);
  for (let i = 0; i < 3; i++) { await page.locator(".fl-dodger").tap(); await page.waitForTimeout(400); }
  check("touch: three taps only move it", (await page.locator(".fl-ask-done").count()) === 0);
  await page.locator(".fl-dodger").tap(); await page.waitForTimeout(500);
  check("touch: the fourth tap says no", (await page.locator(".fl-ask-done").count()) === 1);
  await ctx.close();
}
await browser.close();
console.log(bad ? `\n${bad} check(s) failed` : "\nthe playful No behaves");
process.exit(bad ? 1 : 0);
