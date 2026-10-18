import { z } from "zod";
import { getCurrentActor } from "@/lib/session";
import { fail } from "@/lib/http";
import { previewReportPdf } from "@/domain/reports/service";

export const dynamic = "force-dynamic";

/** The platform owner's "Download PDF": today's report for one wedding, exactly as it would be emailed. */
export async function GET(_req: Request, { params }: { params: Promise<{ weddingId: string }> }) {
  try {
    const weddingId = z.string().uuid().parse((await params).weddingId);
    const { pdf, filename } = await previewReportPdf(await getCurrentActor(), weddingId);
    return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
  } catch (e) {
    return fail(e, { area: "reports" });
  }
}
