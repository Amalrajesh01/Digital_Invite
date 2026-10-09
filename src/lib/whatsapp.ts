import { brand } from "@/lib/brand";
import { EVENT_TYPE_INFO, type EventType } from "@/domain/doc/event-types";

/**
 * Every "talk to us" button on the product site and in the footer of every invitation opens WhatsApp on the same
 * number with a message that already says what the visitor is interested in — so the first reply is about their event,
 * not "how can I help?". Pure functions: safe on the server and in the browser.
 */
export function waLink(message?: string, number: string = brand.whatsapp): string {
  const base = `https://wa.me/${number.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** "Hi, I'm interested in creating a wedding invitation." — the opening line for a given occasion. */
export function enquiryMessage(type: EventType): string {
  const info = EVENT_TYPE_INFO[type];
  if (info.tone === "solemn") return "Hi, I’d like to talk to your team about a memorial invitation.";
  return `Hi, I’m interested in creating ${info.enquiry}.`;
}

export function enquiryLink(type: EventType): string {
  return waLink(enquiryMessage(type));
}

/** Messages for the product site, by page. */
export const WA = {
  general: "Hi, I’d like to know more about digital invitations.",
  pricing: "Hi, I’d like to know which invitation package suits me.",
  template: (name: string) => `Hi, I’d like an invitation like “${name}”.`,
  category: (name: string) => `Hi, I’m interested in creating ${name.toLowerCase().match(/^[aeiou]/) ? "an" : "a"} ${name.toLowerCase()} invitation.`,
  custom: "Hi, I have an event in mind that I don’t see in your templates. Can we talk about a custom invitation?",
} as const;
