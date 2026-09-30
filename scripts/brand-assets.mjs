// Builds compact brand assets in public/brand from the two official StackBridge Labs logo SVGs
// (assets/brand/sbl-logo-light.svg = colour mark for light backgrounds, sbl-logo-dark.svg = white for dark).
//   node scripts/brand-assets.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const NAVY = "#0b1b35";
mkdirSync("public/brand", { recursive: true });

const render = (svg, width) => sharp(svg, { density: 300 }).resize({ width }).png().toBuffer();
const trimmed = async (svg, width) => sharp(await render(svg, width)).trim({ threshold: 8 }).toBuffer();

const onLight = await trimmed("assets/brand/sbl-logo-light.svg", 2400);
const onDark = await trimmed("assets/brand/sbl-logo-dark.svg", 2400);
const meta = await sharp(onLight).metadata();

await sharp(onLight).resize({ width: 960 }).png().toFile("public/brand/logo-on-light.png");
await sharp(onDark).resize({ width: 960 }).png().toFile("public/brand/logo-on-dark.png");

// The "S" mark is the left ~21% of the trimmed lockup.
const markW = Math.round(meta.width * 0.215);
const markColour = await sharp(onLight).extract({ left: 0, top: 0, width: markW, height: meta.height }).trim({ threshold: 8 }).toBuffer();
const markWhite = await sharp(onDark).extract({ left: 0, top: 0, width: markW, height: meta.height }).trim({ threshold: 8 }).toBuffer();
await sharp(markColour).resize({ height: 256 }).png().toFile("public/brand/mark.png");
await sharp(markWhite).resize({ height: 256 }).png().toFile("public/brand/mark-white.png");

// App icons: navy rounded square with the white mark.
async function icon(size, radius, out) {
  const m = await sharp(markWhite).resize({ height: Math.round(size * 0.56) }).toBuffer();
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${NAVY}"/></svg>`);
  await sharp(bg).composite([{ input: m, gravity: "center" }]).png().toFile(out);
}
await icon(512, 112, "src/app/icon.png");
await icon(180, 0, "public/brand/apple-touch-icon.png");
await icon(180, 0, "src/app/apple-icon.png");

// Social sharing image (1200×630).
const logo = await sharp(onDark).resize({ width: 560 }).toBuffer();
const lm = await sharp(logo).metadata();
const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="${NAVY}"/><rect x="0" y="0" width="1200" height="8" fill="#4a6cf7"/>
<text x="600" y="400" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="46" font-weight="700" fill="#ffffff">Digital wedding invitations</text>
<text x="600" y="458" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="30" fill="#9db1f5">Invite. Experience. Remember.</text></svg>`);
await sharp(text).composite([{ input: logo, left: Math.round((1200 - lm.width) / 2), top: 120 }]).jpeg({ quality: 90 }).toFile("public/brand/og-image.jpg");
console.log("brand assets written");
