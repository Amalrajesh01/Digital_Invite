"use server";
import { revalidatePath } from "next/cache";
import { act } from "@/lib/act";
import { coverChoices, deletePortfolioItem, movePortfolioItem, savePortfolioItem, setPortfolioStatus, type PortfolioInput } from "@/domain/portfolio/service";

const refresh = () => {
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  revalidatePath("/sitemap.xml");
};

export const savePortfolioAction = async (input: PortfolioInput) => act(async (a) => { const id = await savePortfolioItem(a, input); refresh(); return { id }; }, { area: "portfolio" });
export const setPortfolioStatusAction = async (id: string, status: "DRAFT" | "PUBLISHED") => act(async (a) => { await setPortfolioStatus(a, id, status); refresh(); return true; }, { area: "portfolio" });
export const movePortfolioAction = async (id: string, direction: "up" | "down") => act(async (a) => { await movePortfolioItem(a, id, direction); refresh(); return true; }, { area: "portfolio" });
export const deletePortfolioAction = async (id: string) => act(async (a) => { await deletePortfolioItem(a, id); refresh(); return true; }, { area: "portfolio" });
export const coverChoicesAction = async (weddingId: string) => act(async (a) => coverChoices(a, weddingId), { area: "portfolio" });
