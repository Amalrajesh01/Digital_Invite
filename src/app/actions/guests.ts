"use server";
import { revalidatePath } from "next/cache";
import { act } from "@/lib/act";
import {
  archiveGuests, bulkSetGroup, buildShareList, createGroup, createGuest, deleteGroup, importGuestsCsv, listGroups, listGuests, markInvitationSent, regenerateInvite, sendInvitationEmails,
  updateGuest, type GuestFilter, type GuestInput,
} from "@/domain/guests/service";
import { rsvpSummary, sendRsvpReminders, updateAccommodation, updateTransport } from "@/domain/guests/rsvp";

const bust = (id: string) => {
  revalidatePath(`/admin/weddings/${id}`, "layout");
  revalidatePath(`/client/${id}`, "layout");
};

export const listGuestsAction = async (weddingId: string, filter: GuestFilter = {}) =>
  act(async (a) => {
    const rows = await listGuests(a, weddingId, filter);
    return rows.map((g) => ({
      id: g.id, name: g.name, phone: g.phone, email: g.email, seats: g.seats, relationship: g.relationship, notes: g.notes, invitationStatus: g.invitationStatus, preferredLocale: g.preferredLocale,
      customGreeting: g.customGreeting, groupId: g.group?.id ?? null, groupName: g.group?.name ?? null, token: g.token, checkedIn: g.checkedIn, accommodation: g.accommodation, transport: g.transport,
      rsvp: g.rsvp ? { status: g.rsvp.status, attendingCount: g.rsvp.attendingCount, meal: g.rsvp.meal, note: g.rsvp.note, respondedAt: g.rsvp.respondedAt.toISOString() } : null,
      lastOpenedAt: g.lastOpenedAt?.toISOString() ?? null, openCount: g.openCount, reminderCount: g.reminderCount,
    }));
  }, { weddingId });

export interface GuestRow {
  id: string; name: string; phone: string | null; email: string | null; seats: number; relationship: string; notes: string; invitationStatus: "NOT_SENT" | "SENT" | "OPENED" | "RESPONDED"; preferredLocale: string | null;
  customGreeting: Record<string, string>; groupId: string | null; groupName: string | null; token: string | null; checkedIn: boolean; accommodation: string | null; transport: string | null;
  rsvp: { status: "YES" | "NO" | "MAYBE"; attendingCount: number; meal: string; note: string; respondedAt: string } | null;
  lastOpenedAt: string | null; openCount: number; reminderCount: number;
}

export const createGuestAction = async (weddingId: string, input: GuestInput) => act(async (a) => { const g = await createGuest(a, weddingId, input); bust(weddingId); return g.id; }, { weddingId });
export const updateGuestAction = async (weddingId: string, id: string, patch: Partial<GuestInput>) => act(async (a) => { await updateGuest(a, weddingId, id, patch); bust(weddingId); return true; }, { weddingId });
export const archiveGuestsAction = async (weddingId: string, ids: string[]) => act(async (a) => (await archiveGuests(a, weddingId, ids), bust(weddingId), true), { weddingId });
export const bulkGroupAction = async (weddingId: string, ids: string[], groupId: string | null) => act(async (a) => (await bulkSetGroup(a, weddingId, ids, groupId), bust(weddingId), true), { weddingId });
export const importCsvAction = async (weddingId: string, csv: string) => act(async (a) => { const r = await importGuestsCsv(a, weddingId, csv); bust(weddingId); return r; }, { weddingId });
export const listGroupsAction = async (weddingId: string) => act((a) => listGroups(a, weddingId), { weddingId });
export const createGroupAction = async (weddingId: string, name: string) => act(async (a) => (await createGroup(a, weddingId, name), bust(weddingId), true), { weddingId });
export const deleteGroupAction = async (weddingId: string, id: string) => act(async (a) => (await deleteGroup(a, weddingId, id), bust(weddingId), true), { weddingId });
export const regenerateInviteAction = async (weddingId: string, id: string) => act(async (a) => (await regenerateInvite(a, weddingId, id), bust(weddingId), true), { weddingId });
export const shareListAction = async (weddingId: string, ids?: string[], locale = "en") => act((a) => buildShareList(a, weddingId, ids, locale), { weddingId });
export const sendEmailsAction = async (weddingId: string, ids?: string[]) => act(async (a) => { const r = await sendInvitationEmails(a, weddingId, ids); bust(weddingId); return r; }, { weddingId });
export const markSentAction = async (weddingId: string, ids: string[]) => act(async (a) => (await markInvitationSent(a, weddingId, ids), bust(weddingId), true), { weddingId });
export const remindersAction = async (weddingId: string, ids?: string[], locale = "en") => act(async (a) => { const r = await sendRsvpReminders(a, weddingId, { guestIds: ids, locale }); bust(weddingId); return r; }, { weddingId });
export const rsvpSummaryAction = async (weddingId: string) => act((a) => rsvpSummary(a, weddingId), { weddingId });
export const updateAccommodationAction = async (weddingId: string, id: string, patch: { status?: "REQUESTED" | "CONFIRMED" | "DECLINED"; assignment?: string }) => act(async (a) => (await updateAccommodation(a, weddingId, id, patch), bust(weddingId), true), { weddingId });
export const updateTransportAction = async (weddingId: string, id: string, patch: { status?: "REQUESTED" | "CONFIRMED" | "DECLINED"; vehicle?: string }) => act(async (a) => (await updateTransport(a, weddingId, id, patch), bust(weddingId), true), { weddingId });
