import { unstable_rethrow } from "next/navigation";
import { type ActionResult, toUserError } from "@/lib/errors";
import { logError } from "@/domain/platform/logging";
import { AppError } from "@/lib/errors";

/**
 * Wraps a server action body: returns { ok, data } or { ok:false, error } — never a stack trace.
 * Unexpected failures are logged (with wedding context when supplied) and shown as a friendly message.
 */
export async function run<T>(fn: () => Promise<T>, ctx: { area?: string; weddingId?: string } = {}): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data } as ActionResult<T>;
  } catch (e) {
    unstable_rethrow(e);
    const user = toUserError(e);
    if (user.code === "INTERNAL" && !(e instanceof AppError)) {
      await logError(ctx.area ?? "action", e, { weddingId: ctx.weddingId });
    }
    return { ok: false, error: user };
  }
}
