import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no look-alikes (l, o, 0, 1)

/** Short readable id for items *inside* JSON documents (events, chapters …). */
export function newId(len = 10): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** URL-safe secret with 128+ bits of entropy — used for guest invitation tokens. */
export function secureToken(bytes = 18): string {
  return randomBytes(bytes).toString("base64url");
}

/** Human-friendly code for QR passes (uppercase, no ambiguous chars). */
export function passCode(len = 10): string {
  const bytes = randomBytes(len);
  const alpha = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alpha[bytes[i] % alpha.length];
  return out;
}
