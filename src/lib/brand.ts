/** Platform branding. Change here and it changes everywhere (dashboards, emails, footer). */
export const brand = {
  /** The product. */
  name: "StackBridge Invites",
  short: "StackBridge",
  tagline: "Invite. Experience. Remember.",
  /** The company that owns it. */
  company: "StackBridge Labs",
  companyUrl: "https://www.stackbridgelab.com",
  contactUrl: "https://www.stackbridgelab.com/contact",
  /** Optional: set SUPPORT_EMAIL to show a mailto link; otherwise the contact page is used. */
  get supportEmail() {
    return process.env.SUPPORT_EMAIL || "";
  },
  madeBy: "Built by developers for the world",
} as const;

/** A mailto link when SUPPORT_EMAIL is configured, otherwise the StackBridge Labs contact page. */
export function contactHref(subject?: string): string {
  const email = brand.supportEmail;
  if (!email) return brand.contactUrl;
  return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
}
