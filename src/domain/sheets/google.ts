import { createSign } from "node:crypto";
import { env } from "@/lib/env";

/**
 * A very small Google Sheets client: no SDK, no dependency. It signs a service-account login (RS256 JWT, built with Node's own
 * crypto), trades it for a short-lived access token, and writes values with the Sheets REST API. The service account is a robot
 * Google user whose e-mail address the sheet's owner shares each spreadsheet with (as Editor); nothing of the owner's own
 * Google account is ever stored here. `fetchImpl` is injectable so tests never touch the network.
 */
export type Fetch = typeof fetch;
export interface Tab { title: string; rows: (string | number)[][] }

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export class SheetError extends Error {
  constructor(message: string, readonly code: "NOT_CONFIGURED" | "NO_ACCESS" | "NOT_FOUND" | "FAILED") { super(message); }
}

export const googleConfigured = () => !!env.googleServiceAccount;
export const serviceAccountEmail = () => env.googleServiceAccount?.client_email ?? null;

/** The id inside a Google Sheets link (or the id itself). */
export function spreadsheetIdFrom(input: string): string | null {
  const s = input.trim();
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/) ?? s.match(/^([a-zA-Z0-9_-]{30,})$/);
  return m ? m[1] : null;
}

async function accessToken(f: Fetch): Promise<string> {
  const sa = env.googleServiceAccount;
  if (!sa) throw new SheetError("Google Sheets is not set up on this server yet.", "NOT_CONFIGURED");
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: TOKEN_URL, iat: now, exp: now + 3300 }));
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.private_key);
  const res = await f(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${b64url(sig)}` }) });
  if (!res.ok) throw new SheetError("Google refused the login. Check the service account key on the server.", "FAILED");
  return ((await res.json()) as { access_token: string }).access_token;
}

async function call<T>(f: Fetch, token: string, url: string, body?: unknown): Promise<T> {
  const res = await f(url, { method: body === undefined ? "GET" : "POST", headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (res.ok) return (await res.json()) as T;
  if (res.status === 403) throw new SheetError(`Google says this account may not edit the sheet. Share it with ${serviceAccountEmail()} as an Editor.`, "NO_ACCESS");
  if (res.status === 404) throw new SheetError("Google could not find that sheet. Check the link.", "NOT_FOUND");
  throw new SheetError(`Google returned an error (${res.status}).`, "FAILED");
}

/** Replaces the contents of each named tab (creating the tab if it is missing). Values are written as-is: nothing is ever read as a formula. */
export async function writeTabs(spreadsheetId: string, tabs: Tab[], f: Fetch = fetch): Promise<void> {
  const token = await accessToken(f);
  const base = `${SHEETS}/${encodeURIComponent(spreadsheetId)}`;
  const meta = await call<{ sheets?: { properties: { title: string } }[] }>(f, token, `${base}?fields=sheets.properties.title`);
  const have = new Set((meta.sheets ?? []).map((s) => s.properties.title));
  const missing = tabs.filter((t) => !have.has(t.title));
  if (missing.length) await call(f, token, `${base}:batchUpdate`, { requests: missing.map((t) => ({ addSheet: { properties: { title: t.title } } })) });
  const quoted = (t: string) => `'${t.replace(/'/g, "''")}'`;
  await call(f, token, `${base}/values:batchClear`, { ranges: tabs.map((t) => quoted(t.title)) });
  await call(f, token, `${base}/values:batchUpdate`, { valueInputOption: "RAW", data: tabs.map((t) => ({ range: `${quoted(t.title)}!A1`, values: t.rows })) });
}
