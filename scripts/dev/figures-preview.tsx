// Renders the bride & groom illustrations in every style, apart and together, for visual QA:
//   npx tsx scripts/dev/figures-preview.tsx   → .shots/figures.png
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { Bride, Groom } from "../../src/invitation/engine/figures";
import type { FigureStyle } from "../../src/domain/doc/event-types";

const styles: FigureStyle[] = ["classic", "kerala", "western"];
const row = (join: number, bg: string) =>
  `<div class="row" style="background:${bg};--join:${join}">` +
  styles.map((s) => `<div class="pair">${renderToStaticMarkup(<div className="f"><Bride style={s} /></div>)}${renderToStaticMarkup(<div className="f"><Groom style={s} /></div>)}</div>`).join("") +
  `</div>`;
const html = `<!doctype html><meta charset="utf-8"><style>
:root{--c-accent:#C9A24B}
body{margin:0;font:12px sans-serif}
.row{display:flex;justify-content:space-around;padding:24px 10px}
.pair{display:flex;align-items:flex-end}
.f{height:380px}.f svg{height:100%;width:auto;display:block}
.pair .f + .f{margin-left:-6px}
</style>${row(0, "#F4EFE3")}${row(1, "#2B0F14")}`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: ".shots/figures.png", fullPage: true });
  await browser.close();
  console.log("saved .shots/figures.png");
}
void main();
