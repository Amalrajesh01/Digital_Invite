import { describe, expect, it } from "vitest";
import { FEATURES, FEATURE_KEYS, defaultFeaturesFor } from "@/domain/packages/features";
import { assertCanUse, canUse, resolveEntitlements, FeatureNotAvailableError } from "@/domain/packages/entitlements";
import { SECTION_META } from "@/domain/doc/sections";

describe("package entitlements", () => {
  it("Essential is an invitation only; Signature adds interaction; Luxury adds the event experience", () => {
    const e = resolveEntitlements("ESSENTIAL", defaultFeaturesFor("ESSENTIAL"));
    const s = resolveEntitlements("SIGNATURE", defaultFeaturesFor("SIGNATURE"));
    const l = resolveEntitlements("LUXURY", defaultFeaturesFor("LUXURY"));
    expect(canUse(e, "rsvp")).toBe(true);
    expect(canUse(e, "client_dashboard")).toBe(false);
    expect(canUse(e, "guest_management")).toBe(false);
    expect(canUse(s, "guest_management")).toBe(true);
    expect(canUse(s, "qr_checkin")).toBe(false);
    expect(canUse(s, "live_photo_wall")).toBe(false);
    expect(canUse(l, "qr_checkin")).toBe(true);
    expect(canUse(l, "time_capsule")).toBe(true);
    expect(canUse(l, "anniversary_mode")).toBe(true);
  });

  it("each higher package is a strict superset of the one below", () => {
    const e = new Set(defaultFeaturesFor("ESSENTIAL"));
    const s = new Set(defaultFeaturesFor("SIGNATURE"));
    const l = new Set(defaultFeaturesFor("LUXURY"));
    for (const f of e) expect(s.has(f)).toBe(true);
    for (const f of s) expect(l.has(f)).toBe(true);
    expect(l.size).toBe(FEATURE_KEYS.length);
    expect(s.size).toBeGreaterThan(e.size);
    expect(l.size).toBeGreaterThan(s.size);
  });

  it("per-wedding overrides can grant or revoke a single feature", () => {
    const base = defaultFeaturesFor("ESSENTIAL");
    const granted = resolveEntitlements("ESSENTIAL", base, [{ featureKey: "guestbook", enabled: true }]);
    expect(canUse(granted, "guestbook")).toBe(true);
    const revoked = resolveEntitlements("LUXURY", defaultFeaturesFor("LUXURY"), [{ featureKey: "qr_checkin", enabled: false }]);
    expect(canUse(revoked, "qr_checkin")).toBe(false);
    expect(canUse(revoked, "qr_pass")).toBe(true);
  });

  it("ignores unknown feature keys instead of granting them", () => {
    const e = resolveEntitlements("ESSENTIAL", ["rsvp", "totally_made_up"], [{ featureKey: "also_fake", enabled: true }]);
    expect(e.features).toEqual(["rsvp"]);
  });

  it("assertCanUse throws a typed error", () => {
    const e = resolveEntitlements("ESSENTIAL", defaultFeaturesFor("ESSENTIAL"));
    expect(() => assertCanUse(e, "qr_checkin")).toThrow(FeatureNotAvailableError);
  });

  it("every section that needs a feature references a real feature", () => {
    for (const m of Object.values(SECTION_META)) if (m.feature) expect(FEATURES[m.feature]).toBeTruthy();
  });
});
