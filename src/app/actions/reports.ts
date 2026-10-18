"use server";
import { revalidatePath } from "next/cache";
import { act } from "@/lib/act";
import { saveReportConfig, sendReportNow } from "@/domain/reports/service";

export const saveReportAction = async (weddingId: string, input: { recipients: string; enabled: boolean }) =>
  act(async (a) => { await saveReportConfig(a, weddingId, input); revalidatePath(`/admin/weddings/${weddingId}/report`); return true; }, { area: "reports", weddingId });

export const sendReportNowAction = async (weddingId: string, input: { recipients: string; enabled: boolean }) =>
  act(async (a) => { const r = await sendReportNow(a, weddingId, input); revalidatePath(`/admin/weddings/${weddingId}/report`); return r; }, { area: "reports", weddingId });
