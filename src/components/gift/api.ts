"use client";
import type { LoveDoc } from "@/domain/doc/schema";
import type { InvitationDoc } from "@/domain/doc/schema";
import type { ResolvedMedia } from "@/domain/media/service";

/** What a gift's maker holds: the id, the secret that proves it is theirs, and the token that lets their browser preview it. */
export interface GiftCreds { id: string; token: string; viewToken: string }

export interface OwnerGift {
  id: string;
  ref: string;
  state: "DRAFT" | "SUBMITTED" | "LIVE" | "PAUSED";
  love: LoveDoc;
  doc: InvitationDoc;
  photos: ResolvedMedia[];
  music: { id: string; title: string } | null;
  viewToken: string;
  publicUrl: string | null;
  expiresAt: string | null;
  contact: { name: string; phone: string };
  published: boolean;
}

const KEY = "sb-gift";
export const saveCreds = (c: GiftCreds) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} };
export const clearCreds = () => { try { localStorage.removeItem(KEY); } catch {} };
export function readCreds(): GiftCreds | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GiftCreds) : null;
  } catch {
    return null;
  }
}
/** `#g=<id>.<secret>` — the secret rides after the “#”, so it is never sent to a server or written to a log. */
export const credsHash = (c: Pick<GiftCreds, "id" | "token">) => `#g=${c.id}.${c.token}`;
export function credsFromHash(hash: string): { id: string; token: string } | null {
  const m = /^#g=([0-9a-f-]{36})\.([A-Za-z0-9_-]{20,})$/.exec(hash);
  return m ? { id: m[1], token: m[2] } : null;
}

export class GiftError extends Error {}

export async function giftFetch<T>(creds: Pick<GiftCreds, "token"> | null, url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (creds) headers.set("x-gift-token", creds.token);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new GiftError("We could not reach the server. Please check your connection and try again.");
  }
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; data?: T; error?: { message?: string } };
  if (!res.ok || json.ok === false) throw new GiftError(json.error?.message ?? "Something went wrong. Please try again.");
  return json.data as T;
}
