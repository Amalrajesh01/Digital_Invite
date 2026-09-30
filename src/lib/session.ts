import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getActorFromSessionToken } from "@/domain/auth/service";
import type { AdminActor, ClientActor, UserActor } from "@/domain/auth/access";
import { isMemberOf } from "@/domain/auth/access";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "aoire_session";

/** Resolved once per request. Every page/action asks this — never the browser. */
export const getCurrentActor = cache(async (): Promise<UserActor | null> => {
  const jar = await cookies();
  return getActorFromSessionToken(jar.get(SESSION_COOKIE)?.value);
});

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function currentSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function requireAdminPage(next = "/admin"): Promise<AdminActor> {
  const a = await getCurrentActor();
  if (!a) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (a.kind !== "admin") redirect("/client");
  return a;
}

export async function requireClientPage(weddingId: string, next?: string): Promise<UserActor> {
  const a = await getCurrentActor();
  if (!a) redirect(`/login?next=${encodeURIComponent(next ?? `/client/${weddingId}`)}`);
  if (a.kind === "client" && !isMemberOf(a, weddingId)) redirect("/client");
  return a;
}

export async function requireUserPage(next = "/client"): Promise<UserActor> {
  const a = await getCurrentActor();
  if (!a) redirect(`/login?next=${encodeURIComponent(next)}`);
  return a;
}

export async function requestMeta() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  return { ip, userAgent: h.get("user-agent") };
}

export type { AdminActor, ClientActor, UserActor };
