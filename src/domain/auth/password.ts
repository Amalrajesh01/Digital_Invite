import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

type ScryptOpts = { N: number; r: number; p: number; maxmem: number };

function scrypt(password: string, salt: Buffer, len: number, opts: ScryptOpts): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, len, opts, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

const N = 2 ** 15;
const OPTS: ScryptOpts = { N, r: 8, p: 1, maxmem: 128 * N * 8 * 2 };

/** scrypt (memory-hard, built into Node). Format: scrypt$N$salt$hash */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, OPTS);
  return `scrypt$${N}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) {
    // Burn comparable time so account existence is not revealed by timing.
    await scrypt(password, randomBytes(16), 64, OPTS);
    return false;
  }
  const [scheme, n, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt") return false;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const key = await scrypt(password, salt, expected.length, { ...OPTS, N: Number(n) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return "Include both letters and numbers.";
  return null;
}
