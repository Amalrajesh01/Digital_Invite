"use client";
import { useMemo } from "react";
import { firstNameOf, type PersonalVars } from "@/domain/guests/personalize";
import { useInvitation } from "./context";

/**
 * Who is reading, as the values for {name} {first} {relationship} {seats}. In a second language the guest's name in that
 * script is used when the couple has written it. `null` for a visitor without a personal link (tokens then fall back).
 */
export function useGuestVars(): PersonalVars | null {
  const { view, locale } = useInvitation();
  const g = view.guest;
  return useMemo(() => {
    if (!g) return null;
    const shown = locale.toLowerCase() !== "en" && g.nameLocal.trim() ? g.nameLocal.trim() : g.name;
    return { name: shown, first: firstNameOf(shown), relationship: g.relationship, seats: g.seats };
  }, [g, locale]);
}
