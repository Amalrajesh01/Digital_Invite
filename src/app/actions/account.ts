"use server";
import { act } from "@/lib/act";
import { changePassword } from "@/domain/auth/service";
import { clearSessionCookie } from "@/lib/session";
import { unauthorized } from "@/lib/errors";

export const changePasswordAction = async (current: string | null, next: string) =>
  act(async (a) => {
    if (!a) throw unauthorized();
    // Signed in by a one-time link (no password yet) may set the first password without the old one.
    await changePassword(a.userId, current, next);
    await clearSessionCookie();
    return true;
  }, { area: "auth" });
