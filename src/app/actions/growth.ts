"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { act } from "@/lib/act";
import { requireAdmin } from "@/domain/auth/access";
import { updateLead } from "@/domain/growth/service";
import { adminDeleteGift, adminPauseGift, adminPublishGift } from "@/domain/gifts/service";

const refresh = () => revalidatePath("/admin", "layout");
const Status = z.enum(["NEW", "CONTACTED", "QUOTED", "WON", "LOST"]);

export const setLeadAction = async (id: string, patch: { status?: string; notes?: string; orderId?: string | null }) =>
  act(async (a) => {
    requireAdmin(a);
    await updateLead(a, id, { status: patch.status ? Status.parse(patch.status) : undefined, notes: patch.notes, orderId: patch.orderId });
    refresh();
    return true;
  }, { area: "growth" });

export const publishGiftAction = async (giftId: string) => act(async (a) => { const url = await adminPublishGift(a, giftId); refresh(); return { url }; }, { area: "gift" });
export const pauseGiftAction = async (giftId: string) => act(async (a) => { await adminPauseGift(a, giftId); refresh(); return true; }, { area: "gift" });
export const deleteGiftAction = async (giftId: string) => act(async (a) => { await adminDeleteGift(a, giftId); refresh(); return true; }, { area: "gift" });
