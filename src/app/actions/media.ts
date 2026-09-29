"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { act } from "@/lib/act";
import {
  addToAlbum, deleteAlbum, deleteMedia, listAlbums, listMedia, listTracks, markPermanent, moderateMedia, removeFromAlbum, reorderAlbumItems, reorderMedia, rotateMedia, saveAlbum,
  saveTrack, deleteTrack, setItemCaption, toResolved, updateMedia, type MediaFilter,
} from "@/domain/media/service";
import type { LocalizedText } from "@/domain/doc/schema";

const bust = (id: string) => {
  revalidatePath(`/admin/weddings/${id}`, "layout");
  revalidatePath(`/client/${id}`, "layout");
};

export interface MediaRow {
  id: string; kind: "IMAGE" | "VIDEO" | "AUDIO"; category: string; filename: string; title: string; url: string; srcSet?: string; width?: number; height?: number; blur?: string;
  moderation: string; visibility: string; retention: string; source: string; albumId: string | null; sortOrder: number; createdAt: string; sizeBytes: number; alt: LocalizedText; caption: LocalizedText;
  focal?: { x: number; y: number };
}

export const listMediaAction = async (weddingId: string, filter: MediaFilter = {}) =>
  act(async (a) => {
    const rows = await listMedia(a, weddingId, { ...filter, limit: 400 });
    return rows.map<MediaRow>((r) => {
      const m = toResolved(r);
      return { id: r.id, kind: r.kind, category: r.category, filename: r.filename, title: r.title, url: m.url, srcSet: m.srcSet, width: r.width ?? undefined, height: r.height ?? undefined, blur: m.blur, moderation: r.moderation, visibility: r.visibility, retention: r.retention, source: r.source, albumId: r.albumId, sortOrder: r.sortOrder, createdAt: r.createdAt.toISOString(), sizeBytes: r.sizeBytes, alt: r.alt, caption: r.caption, focal: m.focal };
    });
  }, { weddingId });

export const updateMediaAction = async (weddingId: string, id: string, patch: { title?: string; alt?: LocalizedText; caption?: LocalizedText; category?: string; focalX?: number | null; focalY?: number | null }) =>
  act(async (a) => {
    await updateMedia(a, weddingId, id, patch as never);
    bust(weddingId);
    return true;
  }, { weddingId });

export const deleteMediaAction = async (weddingId: string, id: string) => act(async (a) => (await deleteMedia(a, weddingId, id), bust(weddingId), true), { weddingId });
export const rotateMediaAction = async (weddingId: string, id: string, deg: number) => act(async (a) => (await rotateMedia(a, weddingId, id, z.union([z.literal(90), z.literal(180), z.literal(270)]).parse(deg)), bust(weddingId), true), { weddingId });
export const reorderMediaAction = async (weddingId: string, ids: string[]) => act(async (a) => (await reorderMedia(a, weddingId, ids), true), { weddingId });
export const moderateMediaAction = async (weddingId: string, id: string, decision: "APPROVED" | "REJECTED" | "PENDING") => act(async (a) => (await moderateMedia(a, weddingId, id, decision), bust(weddingId), true), { weddingId });
export const keepForeverAction = async (weddingId: string, id: string) => act(async (a) => (await markPermanent(a, weddingId, id), true), { weddingId });

export const listAlbumsAction = async (weddingId: string) => act((a) => listAlbums(a, weddingId), { weddingId });
export const saveAlbumAction = async (weddingId: string, input: { id?: string; title: LocalizedText; kind?: "OFFICIAL" | "GUEST" | "LIVE" | "MEMORY" | "EVENT"; isPublic?: boolean; coverAssetId?: string | null }) =>
  act(async (a) => {
    const r = await saveAlbum(a, weddingId, input);
    bust(weddingId);
    return r.id;
  }, { weddingId });
export const deleteAlbumAction = async (weddingId: string, id: string) => act(async (a) => (await deleteAlbum(a, weddingId, id), bust(weddingId), true), { weddingId });
export const addToAlbumAction = async (weddingId: string, albumId: string, ids: string[]) => act(async (a) => (await addToAlbum(a, weddingId, albumId, ids), bust(weddingId), true), { weddingId });
export const removeFromAlbumAction = async (weddingId: string, albumId: string, id: string) => act(async (a) => (await removeFromAlbum(a, weddingId, albumId, id), bust(weddingId), true), { weddingId });
export const reorderAlbumAction = async (weddingId: string, albumId: string, ids: string[]) => act(async (a) => (await reorderAlbumItems(a, weddingId, albumId, ids), bust(weddingId), true), { weddingId });
export const captionItemAction = async (weddingId: string, albumId: string, id: string, caption: LocalizedText) => act(async (a) => (await setItemCaption(a, weddingId, albumId, id, caption), bust(weddingId), true), { weddingId });

export const listTracksAction = async (weddingId: string) =>
  act(async (a) => {
    const tracks = await listTracks(a, weddingId);
    return tracks.map((t) => ({ id: t.id, assetId: t.assetId, title: t.title, artist: t.artist, isPrimary: t.isPrimary, inPlaylist: t.inPlaylist, coverAssetId: t.coverAssetId }));
  }, { weddingId });
export const saveTrackAction = async (weddingId: string, input: { id?: string; assetId?: string; title: string; artist?: string; isPrimary?: boolean; inPlaylist?: boolean; coverAssetId?: string | null }) =>
  act(async (a) => (await saveTrack(a, weddingId, input), bust(weddingId), true), { weddingId });
export const deleteTrackAction = async (weddingId: string, id: string) => act(async (a) => (await deleteTrack(a, weddingId, id), bust(weddingId), true), { weddingId });
