import { chromium } from "playwright";
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errs.push(m.text().slice(0, 1800)); });
p.on("pageerror", (e) => errs.push("PAGEERROR " + e.message.slice(0, 6000)));
await p.goto(process.argv[2], { waitUntil: "networkidle" }).catch(() => {});
await p.waitForTimeout(1500);
console.log(errs.join("\n-----\n"));
await b.close();
