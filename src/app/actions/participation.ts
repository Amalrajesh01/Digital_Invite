"use server";
import { revalidatePath } from "next/cache";
import { act } from "@/lib/act";
import { deleteMessage, listGuestUploads, listMediaWishes, listMessages, moderateMediaWish, moderateMessage, pinMessage } from "@/domain/participation/service";
import { moderateMedia, toResolved } from "@/domain/media/service";
import { checkinStats, checkInGuest, deleteLiveUpdate, eventDaySnapshot, listCheckinRoster, lookupPass, postLiveUpdate, setLiveEvent, undoCheckIn } from "@/domain/live/service";
import { hideCapsuleItem, listCapsuleForDashboard, saveAnniversaryEntry, deleteAnniversaryEntry, saveMemoryBook, unlockCapsuleEarly } from "@/domain/memory/service";
import { leaderboard } from "@/domain/games/service";
import type { LocalizedText } from "@/domain/doc/schema";

const bust = (id: string) => {
  revalidatePath(`/admin/weddings/${id}`, "layout");
  revalidatePath(`/client/${id}`, "layout");
};

export const listMessagesAction = async (weddingId: string, filter: { kind?: "WISH" | "PRIVATE" | "SHOUTOUT"; moderation?: "PENDING" | "APPROVED" | "REJECTED" } = {}) =>
  act(async (a) => (await listMessages(a, weddingId, filter)).map((m) => ({ id: m.id, authorName: m.authorName, kind: m.kind, body: m.body, moderation: m.moderation, pinned: m.pinned, sealed: m.sealed, unlockAt: m.unlockAt?.toISOString() ?? null, createdAt: m.createdAt.toISOString() })), { weddingId });
export interface MessageRow { id: string; authorName: string; kind: "WISH" | "PRIVATE" | "SHOUTOUT"; body: string; moderation: "PENDING" | "APPROVED" | "REJECTED"; pinned: boolean; sealed: boolean; unlockAt: string | null; createdAt: string }

export const moderateMessageAction = async (weddingId: string, id: string, d: "APPROVED" | "REJECTED" | "PENDING") => act(async (a) => (await moderateMessage(a, weddingId, id, d), bust(weddingId), true), { weddingId });
export const pinMessageAction = async (weddingId: string, id: string, pinned: boolean) => act(async (a) => (await pinMessage(a, weddingId, id, pinned), bust(weddingId), true), { weddingId });
export const deleteMessageAction = async (weddingId: string, id: string) => act(async (a) => (await deleteMessage(a, weddingId, id), bust(weddingId), true), { weddingId });

export const listUploadsAction = async (weddingId: string, moderation?: "PENDING" | "APPROVED" | "REJECTED") =>
  act(async (a) => (await listGuestUploads(a, weddingId, moderation)).map((r) => ({ id: r.id, kind: r.kind, by: r.title, url: toResolved(r).url, thumb: toResolved(r).url.replace("/lg", "/md"), moderation: r.moderation, createdAt: r.createdAt.toISOString(), caption: r.caption })), { weddingId });
export const moderateUploadAction = async (weddingId: string, id: string, d: "APPROVED" | "REJECTED" | "PENDING") => act(async (a) => (await moderateMedia(a, weddingId, id, d, "guest_uploads"), bust(weddingId), true), { weddingId });

export const listMediaWishesAction = async (weddingId: string, kind: "VIDEO" | "VOICE", moderation?: "PENDING" | "APPROVED" | "REJECTED") =>
  act(async (a) => (await listMediaWishes(a, weddingId, kind, moderation)).map((w) => ({ id: w.id, authorName: w.authorName, message: w.message, moderation: w.moderation, createdAt: w.createdAt.toISOString(), url: w.media.url, mediaKind: w.media.kind })), { weddingId });
export const moderateMediaWishAction = async (weddingId: string, id: string, d: "APPROVED" | "REJECTED") => act(async (a) => (await moderateMediaWish(a, weddingId, id, d), bust(weddingId), true), { weddingId });

// ── live / check-in ─────────────────────────────────────────────────────────
export const postUpdateAction = async (weddingId: string, input: { title: LocalizedText; body?: LocalizedText; kind?: "INFO" | "ALERT" | "SCHEDULE" | "MILESTONE"; pinned?: boolean }) => act(async (a) => (await postLiveUpdate(a, weddingId, input), bust(weddingId), true), { weddingId });
export const deleteUpdateAction = async (weddingId: string, id: string) => act(async (a) => (await deleteLiveUpdate(a, weddingId, id), bust(weddingId), true), { weddingId });
export const setLiveEventAction = async (weddingId: string, eventId: string | null, note?: string) => act(async (a) => (await setLiveEvent(a, weddingId, eventId, note ?? null), bust(weddingId), true), { weddingId });
export const snapshotAction = async (weddingId: string) =>
  act(async (a) => {
    const s = await eventDaySnapshot(a, weddingId);
    return { currentId: s.state.current?.id ?? null, nextId: s.state.next?.id ?? null, mode: s.state.mode, note: s.state.note, focusId: s.focusId, stats: s.stats, pendingPhotos: s.pendingPhotos, pendingWishes: s.pendingWishes, updates: s.updates.map((u) => ({ id: u.id, title: u.title, body: u.body, kind: u.kind, pinned: u.pinned, createdAt: u.createdAt.toISOString() })) };
  }, { weddingId });
export const lookupPassAction = async (weddingId: string, payload: string) => act((a) => lookupPass(a, weddingId, payload), { weddingId });
export const checkInAction = async (weddingId: string, input: { guestId: string; eventId: string; seats?: number; method?: "QR" | "MANUAL" }) => act(async (a) => { const r = await checkInGuest(a, weddingId, input); bust(weddingId); return r; }, { weddingId });
export const undoCheckInAction = async (weddingId: string, guestId: string, eventId: string) => act(async (a) => (await undoCheckIn(a, weddingId, guestId, eventId), bust(weddingId), true), { weddingId });
export const checkinStatsAction = async (weddingId: string, eventId: string) => act((a) => checkinStats(a, weddingId, eventId), { weddingId });
export const rosterAction = async (weddingId: string, eventId: string, q = "") => act((a) => listCheckinRoster(a, weddingId, eventId, q), { weddingId });

// ── games / capsule / memory ────────────────────────────────────────────────
export const leaderboardAction = async (weddingId: string) => act(async () => leaderboard(weddingId, 25), { weddingId });
export const capsuleDashboardAction = async (weddingId: string) => act((a) => listCapsuleForDashboard(a, weddingId), { weddingId });
export const hideCapsuleItemAction = async (weddingId: string, id: string, hidden: boolean) => act(async (a) => (await hideCapsuleItem(a, weddingId, id, hidden), bust(weddingId), true), { weddingId });
export const unlockCapsuleAction = async (weddingId: string) => act(async (a) => (await unlockCapsuleEarly(a, weddingId), bust(weddingId), true), { weddingId });
export const saveMemoryBookAction = async (weddingId: string, input: Parameters<typeof saveMemoryBook>[2]) => act(async (a) => (await saveMemoryBook(a, weddingId, input), bust(weddingId), true), { weddingId });
export const saveAnniversaryAction = async (weddingId: string, input: Parameters<typeof saveAnniversaryEntry>[2]) => act(async (a) => (await saveAnniversaryEntry(a, weddingId, input), bust(weddingId), true), { weddingId });
export const deleteAnniversaryAction = async (weddingId: string, id: string) => act(async (a) => (await deleteAnniversaryEntry(a, weddingId, id), bust(weddingId), true), { weddingId });
