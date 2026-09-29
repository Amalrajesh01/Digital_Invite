import { z } from "zod";
import { getCurrentActor } from "@/lib/session";
import { fail } from "@/lib/http";
import { exportRsvpCsv } from "@/domain/guests/service";
import { requireWeddingAccess } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";

export const dynamic = "force-dynamic";

/** Downloads the guest & RSVP list as CSV (formula-injection safe). Requires the RSVP-dashboard feature. */
export async function GET(req: Request) {
  try {
    const weddingId = z.string().uuid().parse(new URL(req.url).searchParams.get("weddingId"));
    const actor = await getCurrentActor();
    const scope = await requireWeddingAccess(actor, weddingId, { feature: "rsvp_dashboard" });
    const csv = await exportRsvpCsv(actor, weddingId);
    await audit(actor, "rsvp.exported", { weddingId });
    return new Response("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${scope.weddingSlug}-rsvps-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return fail(e, { area: "export" });
  }
}
