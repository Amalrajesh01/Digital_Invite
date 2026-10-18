import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Encrypts a secret (the mail password) before it goes into the database: AES-256-GCM with a key derived from APP_SECRET.
 * Someone who only gets the database (a backup, a leaked dump) cannot read it. Changing APP_SECRET makes stored secrets
 * unreadable on purpose: `unseal` returns null and the owner is asked to type the password again.
 */
const key = () => createHash("sha256").update(`secret-box:v1:${env.appSecret}`).digest();
const b64 = (b: Buffer) => b.toString("base64url");

export function seal(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", b64(iv), b64(c.getAuthTag()), b64(body)].join(".");
}

export function unseal(sealed: string): string | null {
  try {
    const [v, iv, tag, body] = sealed.split(".");
    if (v !== "v1" || !iv || !tag || !body) return null;
    const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(body, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
