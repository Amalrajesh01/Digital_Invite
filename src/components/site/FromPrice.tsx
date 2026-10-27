import Link from "next/link";
import { cn } from "@/lib/cn";
import { inr, loadPublicPackages } from "@/domain/catalogue/pricing";

/** The cheapest way in, stated once: "Starts from ₹999 with Essential". */
export async function FromPrice({ className }: { className?: string }) {
  const p = (await loadPublicPackages()).find((x) => x.key === "ESSENTIAL");
  if (!p) return null;
  return (
    <p className={cn("text-[15px] text-ink-2/85", className)}>
      Invitations start from <strong className="font-semibold text-ink tnum">{inr(p.priceMin)}</strong> with the {p.name} package, one-time. <Link href="/pricing" className="font-medium text-accent underline underline-offset-4">See pricing</Link>
    </p>
  );
}
