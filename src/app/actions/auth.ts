"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { consumeMagicLink, destroySession, login, requestMagicLink } from "@/domain/auth/service";
import { clearSessionCookie, currentSessionToken, requestMeta, setSessionCookie } from "@/lib/session";
import { run } from "@/lib/action";
import { enqueue } from "@/domain/notify/service";
import { env } from "@/lib/env";
import { invalid } from "@/lib/errors";

const LoginInput = z.object({ email: z.string().trim().min(3).max(200), password: z.string().min(1).max(200), next: z.string().optional() });

/** Only same-site relative paths are allowed as a post-login destination (no open redirects). */
function safeNext(next: string | undefined, fallback: string) {
  return next && /^\/(?!\/)[\w\-/?=&%.]*$/.test(next) && !next.startsWith("/login") ? next : fallback;
}

export async function loginAction(raw: unknown) {
  return run(async () => {
    const parsed = LoginInput.safeParse(raw);
    if (!parsed.success) throw invalid("Enter your email and password.");
    const meta = await requestMeta();
    const s = await login(parsed.data.email, parsed.data.password, meta);
    await setSessionCookie(s.token, s.expiresAt);
    return { redirectTo: safeNext(parsed.data.next, s.role === "SUPER_ADMIN" ? "/admin" : "/client") };
  }, { area: "auth" });
}

export async function requestMagicLinkAction(raw: unknown) {
  return run(async () => {
    const email = z.string().trim().email().parse(typeof raw === "string" ? raw : (raw as { email?: string })?.email);
    const meta = await requestMeta();
    const res = await requestMagicLink(email, meta.ip);
    let devLink: string | undefined;
    if (res) {
      const link = `${env.appUrl}/login/magic/${res.token}`;
      await enqueue({ template: "magic_link", channel: "EMAIL", userId: res.userId, to: res.email, vars: { name: res.name, link }, link });
      // Without an email provider (development) show the link so the flow can be tried end-to-end.
      if (!env.isProd && !env.resendKey) devLink = link;
    }
    // Same answer whether or not the account exists.
    return { sent: true as const, devLink };
  }, { area: "auth" });
}

export async function logoutAction() {
  await destroySession(await currentSessionToken());
  await clearSessionCookie();
  redirect("/login");
}

export async function consumeMagic(token: string) {
  const meta = await requestMeta();
  const s = await consumeMagicLink(token, { userAgent: meta.userAgent });
  await setSessionCookie(s.token, s.expiresAt);
  return s;
}
