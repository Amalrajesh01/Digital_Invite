/** Platform branding. Change here and it changes everywhere (dashboards, emails, footer, public site). */
export const brand = {
  /** The product. */
  name: "Invites by Stack Bridge Labs",
  short: "Invites",
  tagline: "Invite. Experience. Remember.",
  /** The company that owns it. */
  company: "Stack Bridge Labs",
  companyUrl: "https://www.stackbridgelab.com",
  contactUrl: "https://www.stackbridgelab.com/contact",
  /** Digits with country code — the number every "talk to us" button opens on WhatsApp. */
  whatsapp: "917356741055",
  /** Optional: set SUPPORT_EMAIL to show a mailto link; otherwise the contact page is used. */
  get supportEmail() {
    return process.env.SUPPORT_EMAIL || "";
  },
  madeBy: "Built by developers for the world",
} as const;

/** A mailto link when SUPPORT_EMAIL is configured, otherwise the Stack Bridge Labs contact page. */
export function contactHref(subject?: string): string {
  const email = brand.supportEmail;
  if (!email) return brand.contactUrl;
  return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
}
