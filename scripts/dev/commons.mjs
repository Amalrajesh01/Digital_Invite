// Find and fetch openly licensed photographs from Wikimedia Commons (CC0, public domain, CC BY, CC BY-SA only).
//   node scripts/dev/commons.mjs search "<terms>" [--sheet=out.png] [--n=24]   → prints candidates and writes a numbered contact sheet
//   node scripts/dev/commons.mjs get <pageid> [<pageid> …]                    → saves assets/stock/wc-<pageid>.jpg (longest side 1800) and prints its CREDITS line
// Every file keeps its author, licence and source page: the CREDITS line is what the licence requires us to publish.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const UA = "StackBridgeInvites/1.0 (https://invites.stackbridgelab.com; solutions@aoire.in) node";
const API = "https://commons.wikimedia.org/w/api.php";
const OK = /^(CC0|Public domain|PD|CC BY(-SA)? [0-9.]+)/i;
const strip = (h = "") => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res.json();
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  throw new Error("Commons API failed");
}

function info(p) {
  const ii = p.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata ?? {};
  const lic = m.LicenseShortName?.value ?? "";
  return { id: p.pageid, title: p.title.replace(/^File:/, ""), w: ii.width, h: ii.height, mime: ii.mime, license: lic, artist: strip(m.Artist?.value), thumb: ii.thumburl, url: ii.descriptionurl, ok: OK.test(lic) && /jpeg|png/.test(ii.mime) && Math.max(ii.width, ii.height) >= 1500 };
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "search") {
  const q = rest.find((a) => !a.startsWith("--"));
  const flag = (n, d) => rest.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=") ?? d;
  const data = await api({ action: "query", generator: "search", gsrnamespace: "6", gsrlimit: flag("n", "24"), gsrsearch: `${q} filetype:bitmap`, prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "360" });
  const all = (data.query?.pages ?? []).map(info).filter(Boolean); const items = all.filter((x) => x.ok); console.log(`${all.length} found, ${items.length} usable`); if (process.env.DEBUG) for (const a of all) console.log(a.ok, a.license, a.mime, a.w, a.h, a.title);
  const tiles = [];
  for (const [i, it] of items.entries()) {
    console.log(`${String(i + 1).padStart(2)}  ${it.id}  ${it.w}x${it.h}  ${it.license}  ${it.title.slice(0, 70)}  — ${it.artist.slice(0, 40)}`);
    try {
      const buf = Buffer.from(await (await fetch(it.thumb, { headers: { "User-Agent": UA } })).arrayBuffer());
      const img = await sharp(buf).resize(240, 240, { fit: "cover" }).jpeg({ quality: 70 }).toBuffer();
      tiles.push({ img, n: i + 1 });
    } catch { /* skip an unreadable thumbnail */ }
  }
  const cols = 6, cell = 240, rows = Math.ceil(tiles.length / cols);
  if (tiles.length) {
    const overlay = tiles.map((t) => ({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="30"><rect width="44" height="30" fill="#000" fill-opacity=".75"/><text x="22" y="22" font-size="20" fill="#fff" text-anchor="middle" font-family="Arial">${t.n}</text></svg>`), left: ((t.n - 1) % cols) * cell, top: Math.floor((t.n - 1) / cols) * cell }));
    const base = sharp({ create: { width: cols * cell, height: rows * cell, channels: 3, background: "#222" } }).composite([...tiles.map((t) => ({ input: t.img, left: ((t.n - 1) % cols) * cell, top: Math.floor((t.n - 1) / cols) * cell })), ...overlay]);
    await base.jpeg({ quality: 75 }).toFile(flag("sheet", "commons-sheet.jpg"));
    console.log("sheet →", flag("sheet", "commons-sheet.jpg"));
  }
} else if (cmd === "get") {
  await mkdir("assets/stock", { recursive: true });
  const data = await api({ action: "query", pageids: rest.join("|"), prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "2000" });
  for (const p of data.query.pages) {
    const it = info(p);
    if (!it?.ok) { console.log(`skip ${p.pageid}: not an open licence / too small`); continue; }
    const buf = Buffer.from(await (await fetch(it.thumb, { headers: { "User-Agent": UA } })).arrayBuffer());
    const id = `wc-${it.id}`;
    const out = await sharp(buf).rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    await writeFile(`assets/stock/${id}.jpg`, out);
    console.log(`| \`${id}\` | ${it.artist.slice(0, 60) || "Unknown"} | ${it.license} — [${it.title}](${it.url}) |`);
  }
} else {
  console.log("usage: commons.mjs search \"<terms>\" | get <pageid> …");
}
