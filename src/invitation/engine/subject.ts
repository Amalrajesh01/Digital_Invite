"use client";
import { EVENT_TYPE_INFO, type SubjectKind } from "@/domain/doc/event-types";
import { useInvitation } from "./context";

/**
 * Who — or what — the invitation is about. A wedding is about two people; a birthday about one; a conclave about an
 * occasion; a funeral about someone being remembered. The opening envelope, the hero and the footer all ask for
 * the subject instead of reaching for "the bride and groom" themselves.
 */
export interface Subject {
  kind: SubjectKind;
  isCouple: boolean;
  /** The headline as one string: "Priya & Karthik", "Meera", "Leadership Conclave 2026". */
  joined: string;
  /** First and second name. For a single subject `a` is the whole headline and `b` is empty. */
  a: string;
  b: string;
  /** Letters for the wax seal / monogram. */
  initials: string;
  /** First letter of each name (the animated monogram is drawn from these). */
  ia: string;
  ib: string;
  /** The line under the headline ("turns thirty") — empty for couples, who use the event-type phrase. */
  subtitle: string;
  /** The line above it ("You are invited to", "In loving memory of") — empty when the default wording applies. */
  invitation: string;
  hosts: string;
}

const letter = (s: string) => (s.trim().match(/\p{L}/u)?.[0] ?? "").toUpperCase();

/** Initials of a headline: the first letters of up to two significant words ("Leadership Conclave 2026" → "LC"). */
export function initialsOf(title: string): string {
  const words = title.split(/[\s&,.-]+/).filter((w) => /\p{L}/u.test(w) && !/^(the|of|and|for|in|a)$/i.test(w));
  return words.slice(0, 2).map(letter).join("");
}

export function useSubject(): Subject {
  const { view, L, t } = useInvitation();
  const doc = view.doc;
  const kind = EVENT_TYPE_INFO[doc.eventType].subject;

  if (kind === "couple") {
    const c = doc.couple;
    const bride = L(c.bride.name) || "Bride";
    const groom = L(c.groom.name) || "Groom";
    const [a, b] = c.order === "groom-first" ? [groom, bride] : [bride, groom];
    const [ia, ib] = c.order === "groom-first" ? [c.groom.name.en ?? groom, c.bride.name.en ?? bride] : [c.bride.name.en ?? bride, c.groom.name.en ?? groom];
    const initials = c.monogram || `${(ia ?? "").trim().charAt(0)}${(ib ?? "").trim().charAt(0)}`.toUpperCase();
    return {
      kind, isCouple: true, a, b, initials, joined: `${a} ${t("invite.and")} ${b}`,
      ia: (ia ?? "").trim().charAt(0).toUpperCase(), ib: (ib ?? "").trim().charAt(0).toUpperCase(),
      subtitle: "", invitation: L(c.invitation), hosts: L(doc.occasion.hosts),
    };
  }

  const o = doc.occasion;
  const title = L(o.title) || L(o.honoree.name) || view.wedding.title;
  const initials = o.monogram || initialsOf(title);
  return {
    kind, isCouple: false, a: title, b: "", initials, joined: title,
    ia: initials.charAt(0), ib: initials.charAt(1),
    subtitle: L(o.subtitle), invitation: L(o.invitation), hosts: L(o.hosts),
  };
}
