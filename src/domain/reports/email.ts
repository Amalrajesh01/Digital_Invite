import { brand } from "@/lib/brand";
import type { Mail } from "@/domain/mail/transport";
import type { ReportData } from "./data";
import { dateLong, people, renderReportPdf, reportFileName, timeShort } from "./pdf";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const REPLY = { YES: "Coming", MAYBE: "Maybe", NO: "Not coming" } as const;

/** The email that carries the PDF: a short summary a phone shows without opening anything, then the attachment. Guest names are escaped, they are typed by the public. */
export async function composeReportEmail(d: ReportData, to: string[]): Promise<Mail> {
  const t = d.totals;
  const when = `${dateLong(d.generatedAt)}, ${timeShort(d.generatedAt)} India time`;
  const lines = [
    `${t.yes} replied yes, ${people(t.people)} coming`,
    `${t.maybe} maybe, ${t.no} not coming`,
    t.pending ? `${t.pending} of ${t.guests} guests have not replied yet` : t.guests ? "Every guest has replied" : "No guests on the list yet",
    `${d.views30} views of the invitation in the last 30 days`,
  ];
  const recent = d.recent.slice(0, 5).map((g) => `${g.name}: ${g.reply ? REPLY[g.reply] : "Not replied"}${g.reply === "YES" && g.people ? ` (${people(g.people)})` : ""}`);
  const more = d.recent.length - recent.length;
  const newLine = d.recent.length ? `${d.recent.length} new ${d.recent.length === 1 ? "reply" : "replies"} in the last 24 hours` : "No new replies in the last 24 hours";

  const text = [
    "Hello,",
    "",
    `Here is the daily RSVP report for ${d.title}, as of ${when}.`,
    "",
    newLine + (recent.length ? ":" : "."),
    ...recent.map((r) => `  - ${r}`),
    ...(more > 0 ? [`  - and ${more} more`] : []),
    "",
    "Where things stand:",
    ...lines.map((l) => `  - ${l}`),
    "",
    "The full report, with every guest, is attached as a PDF.",
    "",
    `${brand.name}`,
  ].join("\n");

  const stat = (n: number | string, label: string) => `<td style="width:25%;padding:14px 12px;background:#f3f5fb;border-radius:8px;text-align:left"><div style="font-size:24px;font-weight:700;color:#111c44">${esc(String(n))}</div><div style="font-size:12px;color:#5b6483;margin-top:2px">${esc(label)}</div></td>`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111c44">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
<tr><td style="font-size:11px;letter-spacing:1.4px;font-weight:700;color:#3f5fd8">DAILY RSVP REPORT</td></tr>
<tr><td style="font-size:26px;font-weight:700;padding:6px 0 4px">${esc(d.title)}</td></tr>
<tr><td style="font-size:13px;color:#5b6483;padding-bottom:20px">${esc(when)}</td></tr>
<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="6" style="margin:0 -6px"><tr>${stat(t.guests, "guests on the list")}${stat(t.yes, `coming · ${people(t.people)}`)}${stat(t.maybe + t.no, "maybe or not coming")}${stat(t.pending, "not replied yet")}</tr></table></td></tr>
<tr><td style="padding:22px 0 6px;font-size:15px;font-weight:700">${esc(newLine)}</td></tr>
${recent.length ? `<tr><td style="font-size:14px;line-height:1.7;color:#111c44">${recent.map((r) => `${esc(r)}<br>`).join("")}${more > 0 ? `<span style="color:#5b6483">and ${more} more</span>` : ""}</td></tr>` : ""}
<tr><td style="padding:22px 0 0;font-size:14px;line-height:1.6;color:#111c44">The full report, with every guest and their reply, is attached as a PDF.</td></tr>
<tr><td style="padding:26px 0 0;font-size:12px;color:#5b6483;border-top:1px solid #e1e5f0;margin-top:20px">${esc(brand.name)}</td></tr>
</table></td></tr></table></body></html>`;

  return {
    to,
    subject: `Daily RSVP report: ${d.title} (${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(d.generatedAt)})`,
    text,
    html,
    attachments: [{ filename: reportFileName(d), content: await renderReportPdf(d), contentType: "application/pdf" }],
  };
}
