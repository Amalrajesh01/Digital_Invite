// Renders the bride & groom illustrations in every style — apart and together, illustrated heads and real-photo heads:
//   npx tsx scripts/dev/figures-preview.tsx   → .shots/figures.png
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { Bride, Groom, type HeadPhoto } from "../../src/invitation/engine/figures";
import type { FigureStyle } from "../../src/domain/doc/event-types";

const uri = (id: string) => `data:image/jpeg;base64,${readFileSync(`assets/stock/${id}.jpg`).toString("base64")}`;
const headB: HeadPhoto = { src: uri("VPwSJhu5uhs"), fx: 0.5, fy: 0.38, ratio: 1201 / 1800, tilt: 4, zoom: 0.62 };
const headG: HeadPhoto = { src: uri("mab4JkLEe80"), fx: 0.5, fy: 0.33, ratio: 1200 / 1800, tilt: -4, zoom: 1.4 };

const styles: FigureStyle[] = ["classic", "kerala", "western"];
const row = (join: number, bg: string, photo: boolean) =>
  `<div class="row" style="background:${bg};--join:${join}">` +
  styles.map((s) => `<div class="pair">${renderToStaticMarkup(<div className="f"><Bride style={s} head={photo ? headB : undefined} /></div>)}${renderToStaticMarkup(<div className="f"><Groom style={s} head={photo ? headG : undefined} /></div>)}</div>`).join("") +
  `</div>`;
const html = `<!doctype html><meta charset="utf-8"><style>
:root{--c-accent:#C9A24B}
body{margin:0;font:12px sans-serif}
.row{display:flex;justify-content:space-around;padding:20px 10px}
.pair{display:flex;align-items:flex-end}
.f{height:340px}.f svg{height:100%;width:auto;display:block}
.pair .f + .f{margin-left:-48px}
</style>${row(0, "#F4EFE3", true)}${row(1, "#2B0F14", true)}`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: ".shots/figures.png", fullPage: true });
  await browser.close();
  console.log("saved .shots/figures.png");
}
void main();
