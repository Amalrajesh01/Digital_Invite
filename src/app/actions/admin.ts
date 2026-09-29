"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { act } from "@/lib/act";
import { requireAdmin } from "@/domain/auth/access";
import { createMagicLink, setUserDisabled } from "@/domain/auth/service";
import { duplicateTemplate, duplicateTheme, saveTemplate, saveTheme, setTemplateStatus, setThemeStatus, getTemplate, getTheme } from "@/domain/design/service";
import { processDue } from "@/domain/notify/service";
import { env } from "@/lib/env";

const refresh = () => revalidatePath("/admin", "layout");
const Status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const setUserDisabledAction = async (userId: string, disabled: boolean) => act(async (a) => (await setUserDisabled(a, userId, disabled), refresh(), true), { area: "auth" });

export const userLoginLinkAction = async (userId: string) =>
  act(async (a) => {
    requireAdmin(a);
    return { link: `${env.appUrl}/login/magic/${await createMagicLink(a, userId)}` };
  }, { area: "auth" });

export const setTemplateStatusAction = async (id: string, status: string) => act(async (a) => (await setTemplateStatus(a, id, Status.parse(status)), refresh(), true), { area: "design" });
export const setThemeStatusAction = async (id: string, status: string) => act(async (a) => (await setThemeStatus(a, id, Status.parse(status)), refresh(), true), { area: "design" });
export const duplicateTemplateAction = async (id: string) => act(async (a) => { const r = await duplicateTemplate(a, id); refresh(); return r.id; }, { area: "design" });
export const duplicateThemeAction = async (id: string) => act(async (a) => { const r = await duplicateTheme(a, id); refresh(); return r.id; }, { area: "design" });

export const renameTemplateAction = async (id: string, name: string, description: string) =>
  act(async (a) => {
    const t = await getTemplate(id);
    await saveTemplate(a, { id, name: name.trim() || t.name, description, config: t.config });
    refresh();
    return true;
  }, { area: "design" });

export const renameThemeAction = async (id: string, name: string, description: string) =>
  act(async (a) => {
    const t = await getTheme(id);
    await saveTheme(a, { id, name: name.trim() || t.name, description, tokens: t.tokens });
    refresh();
    return true;
  }, { area: "design" });

export const saveThemeTokensAction = async (id: string, input: { name: string; description: string; tokens: unknown }) =>
  act(async (a) => {
    await saveTheme(a, { id, name: input.name, description: input.description, tokens: input.tokens });
    refresh();
    return true;
  }, { area: "design" });

/** Retry everything that is queued and due — the same job the cron endpoint runs. */
export const processQueueAction = async () =>
  act(async (a) => {
    requireAdmin(a);
    const n = await processDue(100);
    refresh();
    return n;
  }, { area: "email" });
