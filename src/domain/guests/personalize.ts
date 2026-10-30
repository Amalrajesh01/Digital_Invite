/**
 * Mail-merge for the couple's own words: "{first}, here is how our weekend unfolds".
 *
 * Tokens: {name} (full name), {first}, {relationship}, {seats}. A fallback follows a bar — {first|friend} — and is used when
 * there is no guest, so the same sentence reads well on the public link: "Dear friend". With no guest and no fallback the
 * token is removed and the sentence is tidied ("{first}, welcome" → "Welcome"). Pure: runs on the server and in the browser.
 */
export interface PersonalVars {
  name?: string;
  first?: string;
  relationship?: string;
  seats?: number;
}

const TOKEN = /\{\s*(name|first|relationship|seats)\s*(?:\|([^{}]*))?\}/gi;

export const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export function personalize(text: string, v: PersonalVars | null | undefined): string {
  if (!text || !text.includes("{")) return text;
  let removedAtStart = false;
  const out = text.replace(TOKEN, (m, key: string, fallback: string | undefined, offset: number) => {
    const k = key.toLowerCase() as keyof PersonalVars;
    const raw = v?.[k];
    const value = raw === undefined || raw === null || raw === "" || raw === 0 ? (fallback ?? "").trim() : String(raw);
    if (!value && text.slice(0, offset).trim() === "") removedAtStart = true;
    return value;
  });
  // A removed token must not leave "  ," or a sentence that starts in lower case.
  let tidy = out.replace(/\s+([,.!?;:])/g, "$1").replace(/\s{2,}/g, " ").trim();
  if (removedAtStart) tidy = tidy.replace(/^[,.;:\s]+/, "").replace(/^\p{Ll}/u, (c) => c.toUpperCase());
  return tidy;
}

/** Does the text contain a token at all? (Cheap check before walking a whole document.) */
export const hasTokens = (text: string | undefined | null) => !!text && /\{\s*(name|first|relationship|seats)/i.test(text);

/**
 * The envelope already says "Dear Priya,". A message the couple wrote that itself begins "Dear Priya Nair," would say it twice,
 * so a leading salutation to this guest is dropped (and the sentence starts with a capital again). Anything else is untouched.
 */
export function stripSalutation(text: string, names: string[]): string {
  const alt = names.map((n) => n.trim()).filter(Boolean).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  if (!alt) return text;
  const stripped = text.replace(new RegExp(`^\\s*(?:dear|hi|hello|hey|പ്രിയപ്പെട്ട)\\s+(?:${alt})\\s*[,!:–-]*\\s*`, "iu"), "");
  return stripped === text ? text : stripped.replace(/^\p{Ll}/u, (c) => c.toUpperCase());
}
