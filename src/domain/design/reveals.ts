/**
 * How the child’s portrait arrives on a baptism hero (the glow, the frame, the settle — see `invitation/sections/hero-grace.css`).
 * Each hero scene has a default; an invitation may choose another in the editor (Hero → Section → “How the portrait arrives”), which
 * is stored as the hero section’s `settings.reveal`. Kept apart from the scenes so the editor need not load their drawings.
 */
export const REVEALS = [
  { key: "heavenly", label: "Heavenly glow" },
  { key: "royal", label: "Royal frame and sheen" },
  { key: "floral", label: "Floral" },
  { key: "minimal", label: "Minimal wipe" },
  { key: "none", label: "Still (no reveal)" },
] as const;
export type PortraitReveal = (typeof REVEALS)[number]["key"];
export const isReveal = (v: unknown): v is PortraitReveal => REVEALS.some((r) => r.key === v);
