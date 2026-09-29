import { cn } from "@/lib/cn";

export type Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "brass" | "accent";

export function Chip({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn("chip", `chip-${tone}`, className)}>{children}</span>;
}

const RSVP_TONE: Record<string, [Tone, string]> = { YES: ["ok", "Attending"], NO: ["bad", "Declined"], MAYBE: ["warn", "Maybe"], PENDING: ["neutral", "No reply"] };
export function RsvpChip({ status }: { status: string | null | undefined }) {
  const [tone, label] = RSVP_TONE[status ?? "PENDING"] ?? RSVP_TONE.PENDING;
  return <Chip tone={tone}>{label}</Chip>;
}

const MOD_TONE: Record<string, [Tone, string]> = { PENDING: ["warn", "Waiting"], APPROVED: ["ok", "Approved"], REJECTED: ["bad", "Hidden"] };
export function ModerationChip({ status }: { status: string }) {
  const [tone, label] = MOD_TONE[status] ?? MOD_TONE.PENDING;
  return <Chip tone={tone}>{label}</Chip>;
}

const STATUS: Record<string, [Tone, string]> = {
  DRAFT: ["neutral", "Draft"],
  PREVIEW: ["info", "Preview"],
  PUBLISHED: ["ok", "Live"],
  LIVE_EVENT: ["accent", "Wedding day"],
  POST_EVENT: ["brass", "Thank-you"],
  MEMORY: ["brass", "Memories"],
  ANNIVERSARY: ["accent", "Anniversary"],
};
export function StatusChip({ status }: { status: string }) {
  const [tone, label] = STATUS[status] ?? STATUS.DRAFT;
  return <Chip tone={tone}>{label}</Chip>;
}

const PKG: Record<string, Tone> = { ESSENTIAL: "neutral", SIGNATURE: "info", LUXURY: "brass" };
export function PackageChip({ pkg }: { pkg: string }) {
  return <Chip tone={PKG[pkg] ?? "neutral"}>{pkg.charAt(0) + pkg.slice(1).toLowerCase()}</Chip>;
}
