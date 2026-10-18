"use server";
import { revalidatePath } from "next/cache";
import { act } from "@/lib/act";
import { saveEmailSettings, sendTestEmail, type EmailSettingsInput } from "@/domain/mail/settings";

export const saveEmailSettingsAction = async (input: EmailSettingsInput) =>
  act(async (a) => { await saveEmailSettings(a, input); revalidatePath("/admin/settings"); return true; }, { area: "mail" });

export const sendTestEmailAction = async (to: string) =>
  act(async (a) => { const r = await sendTestEmail(a, to); revalidatePath("/admin/settings"); return r; }, { area: "mail" });
