import "server-only";
import type { UserActor } from "@/domain/auth/access";
import { getCurrentActor } from "@/lib/session";
import { run } from "@/lib/action";
import type { ActionResult } from "@/lib/errors";

/**
 * Standard shape of every server action: resolve the signed-in actor from the session cookie,
 * run the domain service (which does its own authorisation), and return { ok, data | error }.
 * The browser never tells us who it is.
 */
export async function act<T>(fn: (actor: UserActor | null) => Promise<T>, ctx: { area?: string; weddingId?: string } = {}): Promise<ActionResult<T>> {
  const actor = await getCurrentActor();
  return run(() => fn(actor), ctx);
}
