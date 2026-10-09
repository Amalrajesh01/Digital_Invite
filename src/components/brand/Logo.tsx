import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";

/** The official StackBridge Labs logo. `tone="dark"` is the white version for dark backgrounds. */
export function Logo({ tone = "light", className, height = 36 }: { tone?: "light" | "dark"; className?: string; height?: number }) {
  return (
    <img src={tone === "dark" ? "/brand/logo-on-dark.png" : "/brand/logo-on-light.png"} alt={brand.company} style={{ height, width: "auto" }} className={cn("block select-none", className)} />
  );
}

/** Mark + product name lockup used in the studio sidebar and the site header: “Invites” over “by Stack Bridge Labs”. */
export function ProductLockup({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img src={tone === "dark" ? "/brand/mark-white.png" : "/brand/mark.png"} alt="" aria-hidden width={28} height={28} className="size-7 object-contain" />
      <span className="leading-none">
        <span className={cn("block text-[16px] font-bold tracking-[-0.02em]", tone === "dark" ? "text-white" : "text-ink")}>{brand.short}</span>
        <span className={cn("mt-1 block text-[9.5px] font-semibold uppercase tracking-[0.16em]", tone === "dark" ? "text-[#9db1f5]" : "text-accent")}>by {brand.company}</span>
      </span>
    </span>
  );
}
