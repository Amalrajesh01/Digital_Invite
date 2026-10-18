"use server";
import { revalidatePath } from "next/cache";
import { act } from "@/lib/act";
import { saveSheetConfig, syncSheetNow } from "@/domain/sheets/service";

export const saveSheetAction = async (weddingId: string, input: { link: string; enabled: boolean }) =>
  act(async (a) => { await saveSheetConfig(a, weddingId, input); revalidatePath(`/admin/weddings/${weddingId}/sheet`); return true; }, { area: "sheets", weddingId });

export const sendSheetNowAction = async (weddingId: string) =>
  act(async (a) => { const r = await syncSheetNow(a, weddingId); revalidatePath(`/admin/weddings/${weddingId}/sheet`); return r; }, { area: "sheets", weddingId });
