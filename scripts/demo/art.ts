/**
 * Procedurally illustrated artwork for the demonstration weddings.
 * Original vector art (no stock photography, nothing to license). Customers upload real photographs;
 * these scenes exist so the demo looks finished on day one.
 */
import sharp from "sharp";

const grain = (seed: number, alpha = 0.16) =>
  `<filter id="gr${seed}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${seed}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 .45  0 0 0 ${alpha} 0"/></filter>`;

function wrap(w: number, h: number, defs: string, body: string, seed = 1, alpha = 0.16) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}${grain(seed, alpha)}</defs>${body}<rect width="${w}" height="${h}" filter="url(#gr${seed})" opacity=".9"/></svg>`;
}

const lg = (id: string, x1: number, y1: number, x2: number, y2: number, stops: [number, string][]) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
const rg = (id: string, stops: [number, string, number?][]) =>
  `<radialGradient id="${id}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}" ${op != null ? `stop-opacity="${op}"` : ""}/>`).join("")}</radialGradient>`;

// deterministic pseudo-random
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function palm(x: number, y: number, h: number, lean: number, color: string, r: () => number) {
  const tx = x + lean * h, ty = y - h;
  let s = `<path d="M${x} ${y} Q${x + lean * h * 0.15} ${y - h * 0.55} ${tx} ${ty}" stroke="${color}" stroke-width="${Math.max(4, h * 0.035)}" fill="none" stroke-linecap="round"/>`;
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (-170 + (i * 160) / (n - 1) + (r() - 0.5) * 10) * (Math.PI / 180);
    const len = h * (0.36 + r() * 0.12);
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + len * 0.45;
    const cx = tx + Math.cos(a) * len * 0.55, cy = ty + Math.sin(a) * len * 0.9 - len * 0.08;
    s += `<path d="M${tx} ${ty} Q${cx} ${cy} ${ex} ${ey}" stroke="${color}" stroke-width="${Math.max(2.5, h * 0.018)}" fill="none" stroke-linecap="round"/>`;
    for (let k = 1; k <= 6; k++) {
      const t = k / 7, px = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * cx + t * t * ex, py = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * cy + t * t * ey;
      s += `<path d="M${px} ${py} l${Math.cos(a + 1.2) * len * 0.16} ${Math.sin(a + 1.2) * len * 0.16 + 6} M${px} ${py} l${Math.cos(a - 1.2) * len * 0.16} ${Math.sin(a - 1.2) * len * 0.16 + 6}" stroke="${color}" stroke-width="${Math.max(1.6, h * 0.008)}" fill="none" stroke-linecap="round"/>`;
    }
  }
  return s;
}

function flame(x: number, y: number, s = 1) {
  return `<ellipse cx="${x}" cy="${y}" rx="${46 * s}" ry="${70 * s}" fill="url(#glow)" opacity=".85"/><path d="M${x} ${y - 30 * s} C${x + 14 * s} ${y - 6 * s} ${x + 10 * s} ${y + 14 * s} ${x} ${y + 16 * s} C${x - 10 * s} ${y + 14 * s} ${x - 14 * s} ${y - 6 * s} ${x} ${y - 30 * s}Z" fill="#ffd27a"/><path d="M${x} ${y - 14 * s} C${x + 6 * s} ${y - 2 * s} ${x + 4 * s} ${y + 8 * s} ${x} ${y + 10 * s} C${x - 4 * s} ${y + 8 * s} ${x - 6 * s} ${y - 2 * s} ${x} ${y - 14 * s}Z" fill="#fff4cf"/>`;
}

/** Nilavilakku — the Kerala traditional brass lamp. */
function lamp(cx: number, base: number, s: number, flames = 5) {
  let out = "";
  out += `<ellipse cx="${cx}" cy="${base}" rx="${120 * s}" ry="${22 * s}" fill="url(#brass)"/>`;
  out += `<path d="M${cx - 100 * s} ${base} Q${cx} ${base - 60 * s} ${cx + 100 * s} ${base} Z" fill="url(#brass)"/>`;
  out += `<rect x="${cx - 14 * s}" y="${base - 230 * s}" width="${28 * s}" height="${200 * s}" fill="url(#brass)"/>`;
  for (const [dy, w] of [[-70, 60], [-130, 48], [-190, 40]] as const) out += `<ellipse cx="${cx}" cy="${base + dy * s}" rx="${w * s}" ry="${9 * s}" fill="url(#brass)"/>`;
  out += `<path d="M${cx - 150 * s} ${base - 262 * s} Q${cx} ${base - 200 * s} ${cx + 150 * s} ${base - 262 * s} L${cx + 130 * s} ${base - 282 * s} Q${cx} ${base - 226 * s} ${cx - 130 * s} ${base - 282 * s}Z" fill="url(#brass)"/>`;
  const xs = flames === 5 ? [-130, -66, 0, 66, 130] : [-66, 0, 66];
  for (const dx of xs) out += flame(cx + dx * s, base - (300 - Math.abs(dx) * 0.05) * s, s * 0.85);
  return out;
}

function jasmine(x0: number, y0: number, x1: number, y1: number, sag: number, n: number, r: () => number, size = 9) {
  const cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + sag;
  let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#3d5a3a" stroke-width="2.4" fill="none" opacity=".9"/>`;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    const rr = size * (0.8 + r() * 0.5);
    s += `<g transform="translate(${x + (r() - 0.5) * 6} ${y + (r() - 0.5) * 6})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="${-rr * 0.9}" rx="${rr * 0.55}" ry="${rr}" fill="#fffaf0" transform="rotate(${a + r() * 20})" opacity=".97"/>`).join("")}<circle r="${rr * 0.32}" fill="#e6c36a"/></g>`;
  }
  return s;
}

const COMMON_DEFS =
  rg("glow", [[0, "#ffd88a", 0.95], [0.4, "#ff9d4d", 0.35], [1, "#ff7a2a", 0]]) +
  lg("brass", 0, 0, 1, 0, [[0, "#7a5416"], [0.3, "#e8c66a"], [0.55, "#fff0b8"], [0.8, "#c99a35"], [1, "#6a4710"]]);

// ── scenes ──────────────────────────────────────────────────────────────────

/** Hero: two figures on a jetty at dusk, backwaters, palms, jasmine garlands. */
export function heroScene(): string {
  const W = 1600, H = 2000, r = rng(7);
  const defs =
    COMMON_DEFS +
    lg("sky", 0, 0, 0, 1, [[0, "#1f2049"], [0.28, "#5a3a72"], [0.5, "#b8557a"], [0.68, "#f08c6a"], [0.8, "#f9c47a"], [1, "#fde3a8"]]) +
    lg("lake", 0, 0, 0, 1, [[0, "#f6b06e"], [0.25, "#a5527a"], [1, "#221a44"]]) +
    rg("sun", [[0, "#fff6d6", 1], [0.25, "#ffd27a", 0.95], [1, "#ffb25c", 0]]);
  let b = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  for (let i = 0; i < 60; i++) b += `<circle cx="${r() * W}" cy="${r() * 620}" r="${r() * 2.2 + 0.4}" fill="#fff" opacity="${0.25 + r() * 0.5}"/>`;
  b += `<circle cx="800" cy="1180" r="420" fill="url(#sun)"/><circle cx="800" cy="1180" r="118" fill="#fff1c9"/>`;
  b += `<path d="M0 1180 Q300 1150 560 1178 T1100 1170 T1600 1182 L1600 1210 L0 1210Z" fill="#2c2148" opacity=".9"/>`;
  b += `<rect x="0" y="1200" width="${W}" height="${H - 1200}" fill="url(#lake)"/>`;
  for (let i = 0; i < 34; i++) { const y = 1215 + i * 22, w = 120 + r() * 340, x = 340 + r() * 900; b += `<rect x="${x}" y="${y}" width="${w * (1 - i / 60)}" height="2.5" rx="1.2" fill="#ffe0a3" opacity="${0.5 - i * 0.011}"/>`; }
  b += `<g opacity=".92">${palm(140, 1210, 760, 0.16, "#150f2a", r)}${palm(300, 1215, 520, 0.1, "#1d1436", r)}${palm(1500, 1208, 820, -0.16, "#150f2a", r)}${palm(1330, 1214, 560, -0.1, "#1d1436", r)}</g>`;
  // vallam (boat) far right
  b += `<g transform="translate(1040 1262)" fill="#160f2b"><path d="M0 0 Q160 32 330 0 Q300 -6 288 -22 L40 -22 Q20 -6 0 0Z"/><path d="M60 -22 Q160 -110 250 -22Z" opacity=".95"/><rect x="150" y="-90" width="3" height="70"/></g>`;
  // jetty
  b += `<path d="M420 1500 L1180 1500 L1300 2000 L300 2000Z" fill="#2a1d35"/>`;
  for (let i = 0; i < 12; i++) b += `<path d="M${430 + i * 62} 1500 L${330 + i * 78} 2000" stroke="#150f22" stroke-width="3" opacity=".7"/>`;
  b += `<rect x="420" y="1496" width="760" height="8" fill="#3a2a48"/>`;
  // couple silhouettes
  const groom = `<g fill="#120c22"><circle cx="0" cy="-238" r="30"/><path d="M-16 -212 L16 -212 L20 -196 Q60 -186 66 -140 L58 -40 L34 -40 L30 -120 L0 -120 L-30 -120 L-34 -40 L-58 -40 L-66 -140 Q-60 -186 -20 -196Z"/><path d="M-40 -130 L40 -130 L64 0 L-64 0Z"/></g>`;
  const bride = `<g fill="#0f0a1e"><circle cx="0" cy="-236" r="27"/><circle cx="-18" cy="-262" r="15"/><path d="M-13 -212 L13 -212 L16 -196 Q48 -188 52 -150 L40 -110 L34 -110 L38 -60 L26 -52 L-30 -52 L-40 -110 L-52 -150 Q-48 -188 -16 -196Z"/><path d="M-32 -116 Q-70 -30 -96 0 L96 0 Q70 -30 32 -116Z"/><path d="M28 -196 Q90 -150 46 -40" fill="none" stroke="#0f0a1e" stroke-width="14" opacity=".9"/></g>`;
  b += `<g transform="translate(690 1990) scale(1.75)">${groom}</g><g transform="translate(880 1990) scale(1.72)">${bride}</g>`;
  b += `<path d="M755 1610 Q805 1650 815 1600" fill="none" stroke="#120c22" stroke-width="22" stroke-linecap="round"/>`;
  // garlands
  b += jasmine(-20, 40, 1620, 40, 190, 70, r, 12) + jasmine(-20, 40, 800, 130, 60, 30, r, 11) + jasmine(1620, 40, 800, 130, 60, 30, r, 11);
  for (let i = 0; i < 5; i++) b += jasmine(200 + i * 300, 40 + (i % 2) * 6, 200 + i * 300, 320 + (i % 3) * 90, 0, 9, r, 9);
  b += `<g opacity=".95">${lamp(190, 1930, 0.55, 3)}${lamp(1410, 1930, 0.55, 3)}</g>`;
  return wrap(W, H, defs, b, 3, 0.2);
}

function figureBust(kind: "bride" | "groom") {
  return kind === "bride"
    ? `<g><path d="M300 1500 Q330 1120 600 1090 Q870 1120 900 1500Z" fill="#7a1f2b"/><path d="M300 1500 Q420 1250 600 1230 Q780 1250 900 1500Z" fill="#f4e6c2"/><path d="M380 1500 Q440 1300 600 1260" stroke="#c99a35" stroke-width="16" fill="none"/><path d="M820 1500 Q760 1300 600 1260" stroke="#c99a35" stroke-width="16" fill="none"/><rect x="556" y="960" width="88" height="160" rx="36" fill="#b9805a"/><ellipse cx="600" cy="800" rx="150" ry="184" fill="#c48d64"/><path d="M440 800 Q430 560 600 545 Q770 560 760 800 Q730 690 600 660 Q470 690 440 800Z" fill="#160c14"/><circle cx="600" cy="520" r="78" fill="#160c14"/><circle cx="600" cy="520" r="52" fill="none" stroke="#fffaf0" stroke-width="7" stroke-dasharray="3 12" stroke-linecap="round"/><ellipse cx="528" cy="820" rx="22" ry="12" fill="#3a2418"/><ellipse cx="672" cy="820" rx="22" ry="12" fill="#3a2418"/><path d="M578 880 Q600 900 622 880" stroke="#8a3a3a" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="600" cy="746" r="8" fill="#a5282f"/><circle cx="452" cy="850" r="10" fill="#e6c36a"/><circle cx="748" cy="850" r="10" fill="#e6c36a"/><path d="M440 700 Q430 900 470 1010" stroke="#fffaf0" stroke-width="14" fill="none" stroke-dasharray="2 14" stroke-linecap="round"/></g>`
    : `<g><path d="M280 1500 Q300 1130 600 1100 Q900 1130 920 1500Z" fill="#f1e3c0"/><path d="M520 1100 L600 1230 L680 1100Z" fill="#c99a35"/><path d="M600 1230 L600 1500" stroke="#c99a35" stroke-width="8"/><rect x="552" y="960" width="96" height="170" rx="38" fill="#b47a52"/><ellipse cx="600" cy="810" rx="152" ry="190" fill="#c08560"/><path d="M448 780 Q450 590 600 578 Q750 590 752 780 Q730 700 600 690 Q470 700 448 780Z" fill="#150e12"/><ellipse cx="530" cy="820" rx="22" ry="11" fill="#2a1a12"/><ellipse cx="670" cy="820" rx="22" ry="11" fill="#2a1a12"/><path d="M572 892 Q600 908 628 892" stroke="#6a2f2b" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M540 920 Q600 990 660 920 Q650 960 600 972 Q550 960 540 920Z" fill="#150e12" opacity=".85"/></g>`;
}

export function portraitScene(kind: "bride" | "groom"): string {
  const W = 1200, H = 1600;
  const defs = COMMON_DEFS + lg("bg", 0, 0, 0, 1, kind === "bride" ? [[0, "#f6e6d0"], [1, "#e8b99a"]] : [[0, "#e9eef0"], [1, "#b9c9c2"]]) + rg("halo", [[0, "#fff3d6", 0.9], [1, "#fff3d6", 0]]);
  let b = `<rect width="${W}" height="${H}" fill="url(#bg)"/><circle cx="600" cy="820" r="520" fill="url(#halo)"/>`;
  const r = rng(kind === "bride" ? 11 : 12);
  for (let i = 0; i < 26; i++) b += `<circle cx="${r() * W}" cy="${r() * 700}" r="${r() * 5 + 1}" fill="#c99a35" opacity="${0.1 + r() * 0.25}"/>`;
  b += figureBust(kind);
  b += `<rect x="0" y="0" width="${W}" height="18" fill="#c99a35" opacity=".8"/><rect x="0" y="${H - 18}" width="${W}" height="18" fill="#c99a35" opacity=".8"/>`;
  return wrap(W, H, defs, b, kind === "bride" ? 4 : 5, 0.14);
}

export function venueScene(): string {
  const W = 1800, H = 1350, r = rng(21);
  const defs = COMMON_DEFS + lg("sky", 0, 0, 0, 1, [[0, "#6f9ec9"], [0.5, "#f2c79a"], [1, "#fbe6bf"]]) + lg("water", 0, 0, 0, 1, [[0, "#e7b487"], [1, "#2f5d6a"]]);
  let b = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  b += `<circle cx="1380" cy="560" r="90" fill="#fff0c4" opacity=".9"/><circle cx="1380" cy="560" r="230" fill="url(#glow)" opacity=".55"/>`;
  b += `<rect y="760" width="${W}" height="${H - 760}" fill="url(#water)"/>`;
  for (let i = 0; i < 40; i++) b += `<rect x="${r() * W}" y="${790 + i * 14}" width="${80 + r() * 260}" height="2" fill="#fff5db" opacity="${0.34 - i * 0.006}"/>`;
  b += `<g opacity=".95">${palm(120, 780, 700, 0.12, "#1f3a34", r)}${palm(1700, 780, 760, -0.14, "#1f3a34", r)}${palm(1560, 780, 500, -0.08, "#2a4a40", r)}</g>`;
  // pavilion (Kerala tiled roof)
  b += `<rect x="470" y="600" width="860" height="180" fill="#f1e2c4"/><path d="M400 610 L900 300 L1400 610Z" fill="#a4482f"/><path d="M400 610 L900 300 L1400 610 L1340 610 L900 340 L460 610Z" fill="#7d3524"/>`;
  for (let i = 0; i < 9; i++) b += `<path d="M${470 + i * 108} 590 L${900 + (i - 4) * 12} 330" stroke="#7d3524" stroke-width="3" opacity=".45"/>`;
  for (let i = 0; i < 7; i++) b += `<rect x="${500 + i * 130}" y="610" width="26" height="170" fill="#6b3a24"/><rect x="${492 + i * 130}" y="606" width="42" height="12" fill="#4a2716"/>`;
  b += `<rect x="470" y="770" width="860" height="14" fill="#5a3320"/>`;
  b += `<g opacity=".85">${jasmine(510, 620, 1290, 620, 46, 42, r, 9)}</g>`;
  for (let i = 0; i < 7; i++) b += `<circle cx="${560 + i * 130}" cy="700" r="46" fill="url(#glow)" opacity=".8"/><circle cx="${560 + i * 130}" cy="700" r="8" fill="#ffd27a"/>`;
  b += `<path d="M470 784 L1330 784 L1420 830 L380 830Z" fill="#3b2818"/>`;
  b += `<g fill="#1f2b2c" opacity=".92"><path d="M1400 940 Q1560 976 1740 940 Q1706 932 1690 914 L1440 914 Q1420 932 1400 940Z"/></g>`;
  return wrap(W, H, defs, b, 6, 0.15);
}

function still(id: string, bg: [string, string], body: (r: () => number) => string, w = 1200, h = 1500, seed = 2) {
  const defs = COMMON_DEFS + lg("bg", 0, 0, 0.3, 1, [[0, bg[0]], [1, bg[1]]]);
  return wrap(w, h, defs, `<rect width="${w}" height="${h}" fill="url(#bg)"/>${body(rng(seed * 31 + id.length))}`, seed, 0.17);
}

export function galleryScenes(): Record<string, string> {
  const out: Record<string, string> = {};
  out.lamp = still("lamp", ["#3a0f18", "#12060a"], (r) => `<circle cx="600" cy="620" r="470" fill="url(#glow)" opacity=".5"/>${lamp(600, 1300, 1.25, 5)}${Array.from({ length: 24 }, () => `<circle cx="${r() * 1200}" cy="${r() * 1500}" r="${r() * 3 + 1}" fill="#ffd27a" opacity="${r() * 0.5}"/>`).join("")}`, 1200, 1500, 8);
  out.garland = still("garland", ["#f3ead6", "#d9c79c"], (r) => `<rect y="0" width="1200" height="60" fill="#b58a2a" opacity=".8"/><rect y="70" width="1200" height="8" fill="#b58a2a" opacity=".6"/><rect y="1440" width="1200" height="60" fill="#b58a2a" opacity=".8"/>${jasmine(-40, 260, 1240, 520, 480, 60, r, 24)}${jasmine(-40, 640, 1240, 900, 420, 60, r, 22)}${jasmine(-40, 1020, 1240, 1240, 360, 54, r, 20)}`, 1200, 1500, 9);
  out.boat = still("boat", ["#f7c28a", "#2f5f6b"], (r) => `<circle cx="600" cy="640" r="140" fill="#fff0c4"/><circle cx="600" cy="640" r="380" fill="url(#glow)" opacity=".5"/><rect y="760" width="1200" height="740" fill="#2f5f6b" opacity=".85"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${r() * 1000}" y="${790 + i * 22}" width="${100 + r() * 240}" height="2.4" fill="#ffe0a3" opacity="${0.5 - i * 0.012}"/>`).join("")}<g transform="translate(240 900)" fill="#132225"><path d="M0 0 Q360 80 720 0 Q660 -12 630 -46 L90 -46 Q40 -14 0 0Z"/><path d="M150 -46 Q360 -230 560 -46Z"/><rect x="348" y="-200" width="5" height="150"/></g>${palm(90, 780, 820, 0.14, "#0f2320", r)}${palm(1120, 780, 700, -0.12, "#0f2320", r)}`, 1200, 1500, 10);
  out.pookalam = still("pookalam", ["#4a1a26", "#241018"], (r) => {
    let s = `<circle cx="600" cy="750" r="520" fill="#2b1219"/>`;
    const rings = [[500, "#f2b632", 20], [430, "#fffaf0", 16], [360, "#e8613c", 14], [290, "#f2b632", 12], [220, "#b3202f", 10], [150, "#fffaf0", 8]] as const;
    for (const [rad, col, n] of rings) for (let i = 0; i < n * 2; i++) { const a = (i * Math.PI) / n; s += `<ellipse cx="${600 + Math.cos(a) * rad * 0.9}" cy="${750 + Math.sin(a) * rad * 0.9}" rx="${rad * 0.13}" ry="${rad * 0.07}" fill="${col}" transform="rotate(${(a * 180) / Math.PI} ${600 + Math.cos(a) * rad * 0.9} ${750 + Math.sin(a) * rad * 0.9})" opacity=".95"/>`; }
    s += `<circle cx="600" cy="750" r="66" fill="#f2b632"/><circle cx="600" cy="750" r="30" fill="#b3202f"/>`;
    return s + Array.from({ length: 16 }, () => `<circle cx="${r() * 1200}" cy="${r() * 1500}" r="${r() * 4 + 1}" fill="#f2b632" opacity="${r() * 0.4}"/>`).join("");
  }, 1200, 1500, 11);
  out.sadhya = still("sadhya", ["#2f6b3f", "#173d24"], () => {
    let s = `<path d="M-40 180 Q600 -60 1240 180 L1240 1320 Q600 1560 -40 1320Z" fill="#3f8a4a"/><path d="M600 60 L600 1440" stroke="#2c6a38" stroke-width="10"/>`;
    const dots: [number, number, number, string][] = [[300, 420, 70, "#f5f0e0"], [470, 380, 56, "#e8b03a"], [640, 420, 62, "#c3452a"], [820, 400, 58, "#f0d27a"], [930, 520, 64, "#8a4a20"], [340, 650, 76, "#fff8e8"], [520, 700, 60, "#d98a2c"], [720, 690, 66, "#a83a2a"], [900, 780, 60, "#efe3c0"], [420, 940, 70, "#6a8a3a"], [640, 960, 84, "#fffaf0"], [850, 1000, 62, "#c9682c"], [300, 1100, 56, "#e0b040"], [560, 1180, 60, "#d9d0a8"], [780, 1200, 58, "#b8452c"]];
    for (const [x, y, r, c] of dots) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#000" stroke-opacity=".08" stroke-width="3"/><circle cx="${x - r * 0.2}" cy="${y - r * 0.25}" r="${r * 0.35}" fill="#fff" opacity=".14"/>`;
    s += `<rect x="150" y="1250" width="120" height="16" rx="8" fill="#f3e4c1" transform="rotate(-12 150 1250)"/>`;
    return s;
  }, 1200, 1500, 12);
  out.gopuram = still("gopuram", ["#2a2d5e", "#f0a368"], (r) => {
    let s = `<circle cx="600" cy="1000" r="240" fill="#ffe0a0" opacity=".9"/><circle cx="600" cy="1000" r="460" fill="url(#glow)" opacity=".5"/>`;
    s += `<g fill="#1d1430"><path d="M330 1500 L370 640 L830 640 L870 1500Z"/>`;
    for (let i = 0; i < 9; i++) { const w = 400 - i * 34, y = 1440 - i * 90; s += `<rect x="${600 - w / 2}" y="${y - 34}" width="${w}" height="34"/><rect x="${600 - w / 2 + 18}" y="${y - 74}" width="${w - 36}" height="40" opacity=".92"/>`; }
    s += `<path d="M520 640 Q600 470 680 640Z"/><rect x="594" y="410" width="12" height="90"/><circle cx="600" cy="396" r="18"/></g>`;
    for (let i = 0; i < 40; i++) s += `<circle cx="${r() * 1200}" cy="${r() * 700}" r="${r() * 2 + 0.6}" fill="#fff" opacity="${0.3 + r() * 0.5}"/>`;
    return s;
  }, 1200, 1500, 13);
  out.bangles = still("bangles", ["#f5e2d0", "#e0b59a"], (r) => {
    let s = "";
    const cols = ["#b3202f", "#c99a35", "#2f6b3f", "#e8b03a", "#7a1f2b", "#1f5a7a", "#c99a35"];
    for (let k = 0; k < 3; k++) for (let i = 0; i < 7; i++) s += `<circle cx="${430 + k * 170 + i * 6}" cy="${620 + k * 120}" r="${210 - i * 2}" fill="none" stroke="${cols[(i + k) % cols.length]}" stroke-width="16" opacity=".95"/>`;
    for (let i = 0; i < 40; i++) s += `<g transform="translate(${r() * 1200} ${900 + r() * 500}) rotate(${r() * 360})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cy="-22" rx="11" ry="24" fill="#fffaf0" transform="rotate(${a})"/>`).join("")}<circle r="7" fill="#e6c36a"/></g>`;
    return s;
  }, 1200, 1500, 14);
  out.kasavu = still("kasavu", ["#f6eed8", "#eadfbf"], () => {
    let s = "";
    for (let i = 0; i < 9; i++) s += `<rect x="0" y="${170 + i * 130}" width="1200" height="${i % 2 ? 22 : 56}" fill="#c99a35" opacity="${i % 2 ? 0.55 : 0.85}"/>`;
    for (let i = 0; i < 26; i++) s += `<path d="M${i * 48} 40 l24 30 l24 -30" fill="none" stroke="#c99a35" stroke-width="5" opacity=".6"/>`;
    return s + `<rect x="0" y="0" width="1200" height="30" fill="#c99a35"/><rect x="0" y="1470" width="1200" height="30" fill="#c99a35"/>`;
  }, 1200, 1500, 15);
  return out;
}

export function storyScenes(): Record<string, string> {
  const out: Record<string, string> = {};
  const W = 1400, H = 1050;
  const sc = (bg: [string, string], body: (r: () => number) => string, seed: number) => wrap(W, H, COMMON_DEFS + lg("bg", 0, 0, 0, 1, [[0, bg[0]], [1, bg[1]]]), `<rect width="${W}" height="${H}" fill="url(#bg)"/>${body(rng(seed))}`, seed, 0.16);
  out.cafe = sc(["#f5dcc0", "#c98f66"], (r) => `<rect y="820" width="${W}" height="230" fill="#7a4a2c"/><ellipse cx="480" cy="800" rx="230" ry="46" fill="#5a3320" opacity=".5"/><g><path d="M340 640 L360 800 Q480 850 600 800 L620 640Z" fill="#fff8ec"/><ellipse cx="480" cy="640" rx="140" ry="34" fill="#5a3320"/><path d="M620 690 q70 10 40 66 q-20 30 -60 24" fill="none" stroke="#fff8ec" stroke-width="16"/></g><g><path d="M800 660 L820 810 Q940 860 1060 810 L1080 660Z" fill="#fff8ec"/><ellipse cx="940" cy="660" rx="140" ry="34" fill="#5a3320"/></g>${[420, 470, 520, 900, 950, 1000].map((x) => `<path d="M${x} 590 q-30 -50 0 -100 q30 -50 0 -100" fill="none" stroke="#fff" stroke-width="7" opacity=".5" stroke-linecap="round"/>`).join("")}<rect x="0" y="0" width="${W}" height="380" fill="#f0c9a4" opacity=".35"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${140 + i * 110}" cy="${120 + r() * 80}" r="${16 + r() * 18}" fill="url(#glow)" opacity=".9"/>`).join("")}`, 31);
  out.corridor = sc(["#d8e3e8", "#8aa0ac"], () => `${Array.from({ length: 6 }, (_, i) => `<path d="M${140 + i * 210} 840 L${140 + i * 210} 320 Q${240 + i * 210} 200 ${340 + i * 210} 320 L${340 + i * 210} 840Z" fill="#f4efe4" stroke="#b9a988" stroke-width="6"/>`).join("")}<rect y="840" width="${W}" height="210" fill="#b58a5c"/><path d="M0 900 H${W} M0 960 H${W}" stroke="#8a6238" stroke-width="3"/><g fill="#2a2440"><circle cx="640" cy="620" r="34"/><path d="M596 664 h88 l14 180 h-116z"/><circle cx="780" cy="628" r="32"/><path d="M738 670 h84 l18 174 h-120z" fill="#7a1f2b"/></g>`, 32);
  out.train = sc(["#f7d6a6", "#5f8a6a"], (r) => `<rect width="${W}" height="${H}" fill="#5a3a24"/><rect x="180" y="150" width="1040" height="700" rx="26" fill="#fbe3b4"/><rect x="180" y="500" width="1040" height="350" fill="#4f8a58"/><rect x="180" y="150" width="1040" height="360" rx="26" fill="#f6c98b"/><circle cx="1000" cy="330" r="80" fill="#fff0c4"/>${Array.from({ length: 9 }, (_, i) => `<g transform="translate(${240 + i * 110} ${520 + (i % 3) * 20})">${palm(0, 220, 200, 0.05, "#1f4a30", r)}</g>`).join("")}<path d="M180 500 Q500 470 800 510 T1220 490" stroke="#3a6a44" stroke-width="10" fill="none"/><rect x="150" y="120" width="1100" height="760" rx="40" fill="none" stroke="#3a2416" stroke-width="60"/><rect x="690" y="150" width="20" height="700" fill="#3a2416"/>`, 33);
  return out;
}

/** Pookalam "spot the difference": variant B differs in three places (coordinates are % of the image). */
export function pookalamPuzzle(variant: "a" | "b"): string {
  const W = 1200, H = 900, r = rng(41);
  const defs = COMMON_DEFS + lg("bg", 0, 0, 0, 1, [[0, "#f6ead2"], [1, "#e2cfa4"]]);
  let s = `<rect width="${W}" height="${H}" fill="url(#bg)"/><circle cx="600" cy="450" r="340" fill="#3a1b22"/>`;
  const rings = [[320, "#f2b632", 18], [260, "#fffaf0", 14], [200, "#e8613c", 12], [140, "#f2b632", 10], [84, "#b3202f", 8]] as const;
  for (const [rad, col, n] of rings) for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n, x = 600 + Math.cos(a) * rad * 0.88, y = 450 + Math.sin(a) * rad * 0.88;
    let c: string = col;
    if (variant === "b" && rad === 260 && i >= 6 && i <= 8) c = "#e8613c";
    s += `<ellipse cx="${x}" cy="${y}" rx="${rad * 0.13}" ry="${rad * 0.07}" fill="${c}" transform="rotate(${(a * 180) / Math.PI} ${x} ${y})"/>`;
  }
  s += `<circle cx="600" cy="450" r="44" fill="${variant === "b" ? "#fffaf0" : "#f2b632"}"/><circle cx="600" cy="450" r="20" fill="#b3202f"/>`;
  s += lamp(140, 800, 0.36, 3);
  if (variant === "a") s += lamp(1060, 800, 0.36, 3);
  // difference 3: an extra bird on the b image
  if (variant === "b") s += `<path d="M960 170 q30 -30 60 0 q30 -30 60 0" fill="none" stroke="#3a1b22" stroke-width="8" stroke-linecap="round"/>`;
  for (let i = 0; i < 20; i++) s += `<circle cx="${r() * W}" cy="${r() * H}" r="${r() * 3 + 1}" fill="#c99a35" opacity="${r() * 0.3}"/>`;
  return wrap(W, H, defs, s, 42, 0.12);
}
// Difference locations for the puzzle above, in % of image size.
export const PUZZLE_SPOTS = [
  { x: 50, y: 74.5, r: 7 }, // recoloured petals
  { x: 50, y: 50, r: 5 }, // centre colour
  { x: 88, y: 84, r: 12 }, // missing lamp
  { x: 85, y: 19, r: 9 }, // extra bird
];

export async function toPng(svg: string, width: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 96 }).resize({ width, withoutEnlargement: false }).png().toBuffer();
}
export async function toJpeg(svg: string, width: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 96 }).resize({ width }).jpeg({ quality: 88 }).toBuffer();
}
export async function toSepia(svg: string, width: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 96 }).resize({ width }).modulate({ saturation: 0.35 }).tint({ r: 190, g: 160, b: 120 }).jpeg({ quality: 86 }).toBuffer();
}
