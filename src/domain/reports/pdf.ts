import { readFileSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { IST, type Reply, type ReportData, type ReportGuest } from "./data";

/**
 * The daily report as a PDF (A4): headline numbers, replies in the last 24 hours, views, then every guest by reply.
 * Fonts are Noto Sans (Latin, ₹) and Noto Sans Malayalam from assets/fonts; a name that mixes both scripts is drawn run by run.
 * shortcut: scripts other than Latin and Malayalam (Tamil, Hindi…) show as empty boxes, add that script's Noto font in FONTS when a client needs it.
 */
const W = 595.28, H = 841.89, M = 42, CW = W - 2 * M, BOTTOM = H - 62;
const INK = "#111C44", ACCENT = "#3F5FD8", MUTED = "#5B6483", RULE = "#E1E5F0", SOFT = "#F3F5FB";
const REPLY: Record<Reply | "NONE", { label: string; color: string }> = {
  YES: { label: "Coming", color: "#15803D" },
  MAYBE: { label: "Maybe", color: "#B45309" },
  NO: { label: "Not coming", color: "#B91C1C" },
  NONE: { label: "Not replied", color: "#64748B" },
};
const FONTS = { sans: "NotoSans-Regular.ttf", "sans-b": "NotoSans-Bold.ttf", ml: "NotoSansMalayalam-Regular.ttf", "ml-b": "NotoSansMalayalam-Bold.ttf" } as const;
const MALAYALAM = /[ഀ-ൿ‌‍]/;

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, ...o }).format(d);
export const dateLong = (d: Date) => fmt(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const timeShort = (d: Date) => fmt(d, { hour: "numeric", minute: "2-digit", hour12: true });
const weddingDay = (s: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${s}T00:00:00Z`));
export const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

export const reportFileName = (d: ReportData) => `invitation-report-${d.slug || "invitation"}-${new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(d.generatedAt)}.pdf`;

export function renderReportPdf(d: ReportData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margins: { top: M, left: M, right: M, bottom: 0 }, bufferPages: true, info: { Title: `${d.title} — daily RSVP report`, Author: "Invites by Stack Bridge Labs", Subject: "Daily RSVP report" } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });
  const dir = path.join(process.cwd(), "assets", "fonts");
  for (const [name, file] of Object.entries(FONTS)) doc.registerFont(name, path.join(dir, file));

  // ── text that may mix Latin and Malayalam ────────────────────────────────
  const runs = (s: string) => {
    const out: { t: string; ml: boolean }[] = [];
    for (const ch of s) {
      const ml = MALAYALAM.test(ch) || (/\s/.test(ch) && !!out.length && out[out.length - 1].ml);
      if (out.length && out[out.length - 1].ml === ml) out[out.length - 1].t += ch; else out.push({ t: ch, ml });
    }
    return out;
  };
  const face = (ml: boolean, bold: boolean) => `${ml ? "ml" : "sans"}${bold ? "-b" : ""}`;
  const measure = (s: string, size: number, bold: boolean, track = 0) => runs(s).reduce((n, r) => n + doc.font(face(r.ml, bold)).fontSize(size).widthOfString(r.t, { characterSpacing: r.ml ? 0 : track }), 0);
  const wrap = (s: string, w: number, size: number, bold: boolean, maxLines: number) => {
    const lines: string[] = [];
    let cur = "";
    for (const word of s.replace(/\s+/g, " ").trim().split(" ")) {
      const t = cur ? `${cur} ${word}` : word;
      if (measure(t, size, bold) <= w) { cur = t; continue; }
      if (cur) { lines.push(cur); cur = ""; }
      let piece = ""; // one word wider than the box: break it by letters
      for (const ch of word) { if (piece && measure(piece + ch, size, bold) > w) { lines.push(piece); piece = ch; } else piece += ch; }
      cur = piece;
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      const keep = lines.slice(0, maxLines);
      let last = keep[maxLines - 1];
      while (last && measure(`${last}…`, size, bold) > w) last = last.slice(0, -1);
      keep[maxLines - 1] = `${last.trimEnd()}…`;
      return keep;
    }
    return lines.length ? lines : [""];
  };
  /** Draws text and returns the height it used. Without `w` it is one line; with `w` it wraps (at most `lines` lines, then "…"). */
  const put = (s: string, x: number, y: number, o: { size?: number; bold?: boolean; color?: string; w?: number; align?: "left" | "right" | "center"; lines?: number; track?: number } = {}) => {
    const size = o.size ?? 9.5, bold = !!o.bold, track = o.track ?? 0, lh = size * 1.4;
    const lines = o.w ? wrap(s, o.w, size, bold, o.lines ?? 99) : [s];
    lines.forEach((line, i) => {
      let cx = x;
      if (o.w && o.align) { const w = measure(line, size, bold, track); cx = o.align === "right" ? x + o.w - w : o.align === "center" ? x + (o.w - w) / 2 : x; }
      for (const r of runs(line)) {
        doc.font(face(r.ml, bold)).fontSize(size).fillColor(o.color ?? INK).text(r.t, cx, y + i * lh, { lineBreak: false, characterSpacing: r.ml ? 0 : track });
        cx += doc.widthOfString(r.t, { characterSpacing: r.ml ? 0 : track });
      }
    });
    return lines.length * lh;
  };
  const rule = (y: number, color = RULE) => doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.7).strokeColor(color).stroke();
  const heading = (s: string, y: number) => { put(s, M, y, { size: 12.5, bold: true }); return 24; };
  const newPage = () => { doc.addPage(); return M; };

  // ── header ───────────────────────────────────────────────────────────────
  let y = M;
  try { doc.image(readFileSync(path.join(process.cwd(), "public", "brand", "logo-on-light.png")), M, y - 4, { width: 112 }); } catch { put("Invites by Stack Bridge Labs", M, y, { size: 11, bold: true }); }
  put("DAILY RSVP REPORT", M, y, { size: 7.5, bold: true, color: ACCENT, w: CW, align: "right", track: 1.4 });
  put(dateLong(d.generatedAt), M, y + 13, { size: 10, bold: true, w: CW, align: "right" });
  put(`As of ${timeShort(d.generatedAt)} India time`, M, y + 28, { size: 8.5, color: MUTED, w: CW, align: "right" });
  y += 48;
  rule(y);
  y += 20;
  y += put(d.title, M, y, { size: 26, bold: true, w: CW, lines: 2 });
  const sub = [d.weddingDate ? weddingDay(d.weddingDate) : "", "Invitation:"].filter(Boolean);
  put(sub.join("  ·  "), M, y + 2, { size: 9.5, color: MUTED });
  const lx = M + measure(sub.join("  ·  "), 9.5, false) + 5;
  put(d.link.replace(/^https?:\/\//, ""), lx, y + 2, { size: 9.5, color: ACCENT, w: CW - (lx - M), lines: 1 });
  doc.link(lx, y + 1, Math.min(measure(d.link.replace(/^https?:\/\//, ""), 9.5, false), CW - (lx - M)), 14, d.link);
  y += 34;

  // ── headline numbers ─────────────────────────────────────────────────────
  const t = d.totals;
  const pct = t.guests ? Math.round((t.replied / t.guests) * 100) : 0;
  const cards: [string, string, string, string][] = [
    ["GUESTS ON THE LIST", String(t.guests), `${t.replied} replied (${pct}%)`, INK],
    ["COMING", String(t.yes), people(t.people), REPLY.YES.color],
    ["MAYBE / NOT COMING", `${t.maybe} / ${t.no}`, "undecided / declined", INK],
    ["NOT REPLIED YET", String(t.pending), t.pending ? "still to hear from" : "everyone has replied", t.pending ? REPLY.NONE.color : REPLY.YES.color],
  ];
  const gap = 10, cw = (CW - gap * 3) / 4;
  cards.forEach(([label, value, subline, color], i) => {
    const x = M + i * (cw + gap);
    doc.roundedRect(x, y, cw, 70, 7).fillColor(SOFT).fill();
    put(label, x + 12, y + 11, { size: 6.8, bold: true, color: MUTED, track: 0.8 });
    put(value, x + 12, y + 24, { size: 22, bold: true, color });
    put(subline, x + 12, y + 53, { size: 8, color: MUTED, w: cw - 20, lines: 1 });
  });
  y += 88;

  // replies at a glance: one bar split by reply
  const parts: [Reply | "NONE", number][] = [["YES", t.yes], ["MAYBE", t.maybe], ["NO", t.no], ["NONE", t.pending]];
  doc.roundedRect(M, y, CW, 9, 4.5).fillColor(SOFT).fill();
  if (t.guests) {
    doc.save().roundedRect(M, y, CW, 9, 4.5).clip();
    let bx = M;
    for (const [k, n] of parts) { const w = (n / t.guests) * CW; if (w > 0) doc.rect(bx, y, w + 0.5, 9).fillColor(REPLY[k].color).fill(); bx += w; }
    doc.restore();
  }
  let lgx = M;
  for (const [k, n] of parts) {
    doc.circle(lgx + 3.5, y + 21, 3.5).fillColor(REPLY[k].color).fill();
    const label = `${REPLY[k].label} ${n}`;
    put(label, lgx + 12, y + 16, { size: 8.5, color: INK });
    lgx += 12 + measure(label, 8.5, false) + 18;
  }
  y += 46;

  // ── replies in the last 24 hours ─────────────────────────────────────────
  y += heading("New replies in the last 24 hours", y);
  if (!d.recent.length) { put("No new replies since yesterday evening.", M, y, { size: 9.5, color: MUTED }); y += 26; }
  else {
    const shown = d.recent.slice(0, 8);
    for (const g of shown) {
      const r = REPLY[g.reply ?? "NONE"];
      put(g.name, M, y, { size: 9.5, bold: true, w: 250, lines: 1 });
      doc.circle(M + 270, y + 6, 3).fillColor(r.color).fill();
      put(g.reply === "YES" && g.people ? `${r.label} · ${people(g.people)}` : r.label, M + 278, y, { size: 9.5, color: r.color, w: 150, lines: 1 });
      put(timeShort(g.repliedAt!), M, y, { size: 8.5, color: MUTED, w: CW, align: "right" });
      y += 19;
      rule(y - 4);
    }
    if (d.recent.length > shown.length) { put(`and ${d.recent.length - shown.length} more — all replies are in the guest list below.`, M, y, { size: 8.5, color: MUTED }); y += 16; }
    y += 10;
  }

  // ── views ────────────────────────────────────────────────────────────────
  if (y + 150 > BOTTOM) y = newPage();
  y += heading("Invitation views, last 14 days", y) + 4;
  const chartW = 330, chartH = 70, base = y + chartH, maxV = Math.max(1, ...d.views.map((v) => v.views)), slot = chartW / d.views.length, barW = slot - 5;
  const peak = d.views.findIndex((v) => v.views === maxV); // label the highest day once, not every day that ties
  doc.moveTo(M, base).lineTo(M + chartW, base).lineWidth(0.7).strokeColor(RULE).stroke();
  d.views.forEach((v, i) => {
    const h = v.views ? Math.max(2, (v.views / maxV) * (chartH - 12)) : 0, x = M + i * slot + 2.5;
    if (h) doc.roundedRect(x, base - h, barW, h, 2).fillColor(i === d.views.length - 1 ? ACCENT : "#9DB0EE").fill();
    if (i === peak && h) put(String(v.views), x - 6, base - h - 11, { size: 7.5, bold: true, color: INK, w: barW + 12, align: "center" });
    const [yy, mm, dd] = v.day.split("-").map(Number);
    const label = i === 0 || i === d.views.length - 1 ? `${dd} ${new Date(Date.UTC(yy, mm - 1, dd)).toLocaleString("en-IN", { month: "short", timeZone: "UTC" })}` : i % 2 === 0 ? String(dd) : "";
    if (label) put(label, x - 8, base + 5, { size: 7, color: MUTED, w: barW + 16, align: "center" });
  });
  const sx = M + chartW + 40;
  put(String(d.views30), sx, y, { size: 22, bold: true });
  put("views in the last 30 days", sx, y + 30, { size: 8.5, color: MUTED });
  put(String(d.visitors30), sx, y + 48, { size: 22, bold: true });
  put("different visitors", sx, y + 78, { size: 8.5, color: MUTED });
  y = base + 40;

  // ── meal choices ─────────────────────────────────────────────────────────
  if (d.meals.length) {
    const rows = d.meals.slice(0, 6);
    if (y + 30 + rows.length * 18 > BOTTOM) y = newPage();
    y += heading("Meal choices (guests replying yes)", y);
    const top = rows[0].count;
    for (const m of rows) {
      put(m.meal, M, y, { size: 9.5, w: 150, lines: 1 });
      doc.roundedRect(M + 160, y + 2, Math.max(4, (m.count / top) * 200), 8, 4).fillColor("#9DB0EE").fill();
      put(String(m.count), M + 160 + Math.max(4, (m.count / top) * 200) + 8, y, { size: 9.5, bold: true });
      y += 18;
    }
    y += 14;
  }

  // ── every guest ──────────────────────────────────────────────────────────
  const col = { name: M + 10, reply: M + 188, ppl: M + 276, meal: M + 322, note: M + 392 };
  const colW = { name: 170, reply: 84, ppl: 36, meal: 62, note: W - M - 10 - (M + 392) };
  const tableHead = () => {
    doc.rect(M, y, CW, 22).fillColor(SOFT).fill();
    const h = { size: 6.8, bold: true, color: MUTED, track: 0.8 };
    put("GUEST", col.name, y + 8, h); put("REPLY", col.reply, y + 8, h); put("PEOPLE", col.ppl - 4, y + 8, { ...h, w: colW.ppl + 4, align: "right" }); put("MEAL", col.meal + 6, y + 8, h); put("NOTE", col.note, y + 8, h);
    y += 22;
  };
  if (y + 30 + 22 + 4 * 30 > BOTTOM) y = newPage(); // start the list on a fresh page rather than leave one or two rows behind
  y += heading(`Guest list (${t.guests})`, y);
  if (!d.guests.length) put("No guests yet. Replies appear here as they arrive.", M, y, { size: 9.5, color: MUTED });
  else {
    tableHead();
    d.guests.forEach((g: ReportGuest, i) => {
      const r = REPLY[g.reply ?? "NONE"];
      const note = [g.also ? `With: ${g.also}.` : "", g.note].filter(Boolean).join(" ");
      const rowH = Math.max(wrap(g.name, colW.name, 9.5, true, 2).length * 9.5 * 1.4, g.meal ? wrap(g.meal, colW.meal - 4, 8.5, false, 2).length * 8.5 * 1.4 : 0, note ? wrap(note, colW.note, 8.5, false, 3).length * 8.5 * 1.4 : 0, 9.5 * 1.4) + 11;
      if (y + rowH > BOTTOM) { y = newPage(); tableHead(); }
      if (i % 2) doc.rect(M, y, CW, rowH).fillColor("#F9FAFD").fill();
      put(g.name, col.name, y + 5.5, { size: 9.5, bold: true, w: colW.name, lines: 2 });
      doc.circle(col.reply + 3, y + 11.5, 3).fillColor(r.color).fill();
      put(r.label, col.reply + 11, y + 5.5, { size: 9, color: r.color, w: colW.reply - 11, lines: 1 });
      if (g.people != null) put(String(g.people), col.ppl - 4, y + 5.5, { size: 9.5, w: colW.ppl + 4, align: "right" });
      if (g.meal) put(g.meal, col.meal + 6, y + 5.5, { size: 8.5, w: colW.meal - 4, lines: 2 });
      if (note) put(note, col.note, y + 6, { size: 8.5, color: MUTED, w: colW.note, lines: 3 });
      y += rowH;
    });
    rule(y, RULE);
  }

  // ── footer on every page ─────────────────────────────────────────────────
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    rule(H - 44);
    put(`Invites by Stack Bridge Labs  ·  ${d.title}  ·  daily RSVP report`, M, H - 36, { size: 7.5, color: MUTED, w: CW - 70, lines: 1 });
    put(`Page ${i + 1} of ${pages.count}`, M, H - 36, { size: 7.5, color: MUTED, w: CW, align: "right" });
  }
  doc.end();
  return done;
}
