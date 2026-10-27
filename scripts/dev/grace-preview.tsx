// Renders each baptism hero scene on its own, in its own theme, and photographs it — no database or dev server needed.
//   npx tsx scripts/dev/grace-preview.tsx [out-dir] [slug,slug…]      (defaults: ./grace-out, all twenty; phone and desktop)
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { renderToStaticMarkup } from "react-dom/server";
import { BAPTISM_SPECS } from "../../src/domain/design/template-specs-baptism";
import { BAPTISM_THEMES } from "../../src/domain/design/themes-baptism";
import { themeStyle, themeFontHref } from "../../src/invitation/engine/theme";
import { GraceView } from "../../src/invitation/sections/GraceView";

const out = path.resolve(process.argv[2] ?? "grace-out");
const only = process.argv[3]?.split(",");
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(path.resolve("src/invitation/sections/hero-grace.css"), "utf8");
const base = fs.readFileSync(path.resolve("src/invitation/styles/invitation.css"), "utf8");

const SAMPLE = { eyebrow: "You are invited to the baptism of", name: "Anya Mariam", phrase: "a little blessing", date: "Sunday 14 March 2027", place: "St. Mary’s Church · Kochi", hosts: "Hosted by Reena & Joseph Thomas" };
const css2 = (s: object) => Object.entries(s as Record<string, unknown>).map(([k, v]) => `${k}:${String(v).replace(/"/g, "'")}`).join(";");

async function main() {
  const browser = await chromium.launch();
  for (const spec of BAPTISM_SPECS) {
    if (only && !only.includes(spec.slug)) continue;
    const theme = BAPTISM_THEMES.find((t) => t.slug === spec.theme)!;
    const html = renderToStaticMarkup(<GraceView variant={spec.hero} {...SAMPLE} size="medium" still />);
    const fonts = themeFontHref(theme.tokens, null);
    const page = `<!doctype html><html class="js"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${fonts ? `<link rel="stylesheet" href="${fonts}">` : ""}<style>${base}</style><style>${css}</style></head><body style="margin:0"><div class="inv" data-entered="true" data-flavor="${spec.direction}" style="${css2(themeStyle(theme.tokens, null))};background:var(--c-bg);color:var(--c-text);font-family:var(--f-body)">${html}</div></body></html>`;
    const file = path.join(out, `${spec.slug}.html`);
    fs.writeFileSync(file, page);
    for (const [tag, w, h, dpr] of [["m", 390, 844, 2], ["d", 1280, 760, 1]] as const) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
      const p = await ctx.newPage();
      await p.goto("file:///" + file.split("\\").join("/"));
      await p.waitForTimeout(Number(process.env.WAIT ?? 9000));
      await p.screenshot({ path: path.join(out, `${spec.slug}.${tag}.png`) });
      await ctx.close();
    }
    console.log("✔", spec.slug);
  }
  await browser.close();
}

main();
