"use client";
import { useMemo } from "react";
import { resolveSlot, type ImageSlot } from "@/domain/imagery/slots";
import { useInvitation } from "./context";

/**
 * Sections ask for a named slot ("couple", "ceremony", "family" …) instead of reaching into the document.
 * Which uploaded photograph fills the slot — and what it falls back to — is decided in
 * `src/domain/imagery/slots.ts`, the single place a customer's photo choices are configured.
 */
export function useSlot(slot: ImageSlot): string | undefined {
  const { view } = useInvitation();
  return useMemo(() => resolveSlot({ doc: view.doc, gallery: view.gallery }, slot), [view.doc, view.gallery, slot]);
}
