import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserPage } from "@/lib/session";
import { listWeddings } from "@/domain/wedding/service";
import { brand } from "@/lib/brand";
import { Logo } from "@/components/brand/Logo";
import { logoutAction } from "@/app/actions/auth";
import { PackageChip, StatusChip } from "@/components/ui/Chip";
import { formatDateLong } from "@/lib/time";

export const metadata: Metadata = { title: "Your weddings" };
export const dynamic = "force-dynamic";

/** A client with one wedding goes straight to it; with several they choose. */
export default async function ClientHome() {
  const actor = await requireUserPage("/client");
  if (actor.kind === "admin") redirect("/admin");
  const weddings = await listWeddings(actor);
  if (weddings.length === 1) redirect(`/client/${weddings[0].id}`);
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-6 py-16">
      <Logo height={44} />
      <h1 className="display mt-10 text-[44px]">Your weddings</h1>
      {weddings.length === 0 ? (
        <p className="mt-4 text-muted">No weddings are linked to your account yet. Please contact your invitation designer at {brand.company}.</p>
      ) : (
        <ul className="mt-8 divide-y divide-rule border-y border-rule">
          {weddings.map((w) => (
            <li key={w.id}><Link href={`/client/${w.id}`} className="flex items-center justify-between gap-4 py-5 hover:bg-paper-2/60 sm:-mx-3 sm:px-3"><span><span className="display block text-[26px]">{w.title || w.slug}</span><span className="text-[14px] text-muted">{w.weddingDate ? formatDateLong(w.weddingDate) : "Date to be announced"}</span></span><span className="flex flex-col items-end gap-1"><StatusChip status={w.effective} /><PackageChip pkg={w.packageKey} /></span></Link></li>
          ))}
        </ul>
      )}
      <form action={logoutAction} className="mt-10"><button className="btn btn-quiet btn-sm">Sign out</button></form>
    </main>
  );
}
