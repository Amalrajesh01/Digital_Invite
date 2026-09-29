import "server-only";
import { notFound } from "next/navigation";
import type { UserActor } from "@/domain/auth/access";
import { requireWeddingAccess } from "@/domain/auth/access";
import type { Entitlements } from "@/domain/packages/entitlements";
import { getWedding, type WeddingRow } from "@/domain/wedding/service";
import { env } from "@/lib/env";

export interface WsCtx {
  actor: UserActor;
  weddingId: string;
  slug: string;
  role: "admin" | "client";
  base: string;
  ent: Entitlements;
  wedding: WeddingRow;
  appUrl: string;
}

export async function loadWsCtx(actor: UserActor, weddingId: string): Promise<WsCtx> {
  const scope = await requireWeddingAccess(actor, weddingId).catch(() => notFound());
  const wedding = await getWedding(actor, weddingId);
  const role = actor.kind === "admin" ? "admin" : "client";
  return { actor, weddingId, slug: scope.weddingSlug, role, base: role === "admin" ? `/admin/weddings/${weddingId}` : `/client/${weddingId}`, ent: scope.entitlements, wedding, appUrl: env.appUrl };
}
