import { z } from "zod";
import { notFound, invalid, forbidden } from "@/lib/errors";
import { ok, fail, clientIp, assertUploadSize } from "@/lib/http";
import { getWeddingBySlug, loadPublishedSnapshot } from "@/domain/wedding/snapshot";
import { resolveGuestContext, touchGuestOpen, type GuestContext } from "@/domain/guests/context";
import { submitGuestRsvp, submitOpenRsvp } from "@/domain/guests/rsvp";
import { participantAnonymous, participantFromGuest, submitMessage, listPublicMessages, submitGuestUpload, submitMediaWish, listPublicMediaWishes, listPhotoWall, type Participant } from "@/domain/participation/service";
import { livePayload, getGuestPass } from "@/domain/live/service";
import { playGame, leaderboard, myPlays } from "@/domain/games/service";
import { capsuleStatus, listCapsuleItems, submitCapsuleItem } from "@/domain/memory/service";
import { track, deviceFromUserAgent } from "@/domain/analytics/service";
import { getEntitlements } from "@/domain/packages/service";
import { canUse } from "@/domain/packages/entitlements";
import { rateLimit } from "@/domain/platform/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = { params: Promise<{ slug: string; action: string }> };

/** Resolves the wedding (must be live) and the optional guest identity from the invitation token. */
async function context(req: Request, slug: string) {
  const wedding = await getWeddingBySlug(slug);
  if (!wedding) throw notFound();
  const snap = await loadPublishedSnapshot(wedding);
  if (!snap) throw notFound();
  const token = req.headers.get("x-invite-token");
  const guest = token ? await resolveGuestContext(slug, token) : null;
  if (token && !guest) throw new (await import("@/lib/errors")).AppError("EXPIRED", "This invitation link is no longer valid.");
  const ent = await getEntitlements(wedding.id);
  // Personal links only apply when the package includes them.
  const g = guest && canUse(ent, "personalized_urls") ? guest : null;
  if (!g && wedding.accessMode === "PERSONALIZED_ONLY") throw forbidden("This invitation is private.");
  return { wedding, guest: g, ent, ip: clientIp(req) };
}

function participant(c: { wedding: { id: string }; guest: GuestContext | null; ip: string }, name: unknown): Participant {
  return c.guest ? participantFromGuest(c.guest) : participantAnonymous(c.wedding.id, typeof name === "string" ? name : "", c.ip);
}

async function fileFrom(form: FormData, field = "file") {
  const f = form.get(field);
  if (!(f instanceof File) || f.size === 0) throw invalid("Please choose a file.");
  const durationRaw = Number(form.get("durationSec") ?? 0);
  return { buffer: Buffer.from(await f.arrayBuffer()), filename: f.name, durationSec: Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : null };
}

const langOf = (b: unknown) => (typeof (b as { locale?: unknown })?.locale === "string" ? ((b as { locale: string }).locale.slice(0, 8)) : "en");

export async function GET(req: Request, { params }: Params) {
  const { slug, action } = await params;
  try {
    const c = await context(req, slug);
    const url = new URL(req.url);
    switch (action) {
      case "wishes": return ok(await listPublicMessages(c.wedding.id));
      case "media-wishes": {
        return ok({ video: canUse(c.ent, "video_wishes") ? await listPublicMediaWishes(c.wedding.id, "VIDEO") : [], voice: canUse(c.ent, "voice_wishes") ? await listPublicMediaWishes(c.wedding.id, "VOICE") : [] });
      }
      case "wall": {
        if (!canUse(c.ent, "live_photo_wall") && !canUse(c.ent, "advanced_gallery") && !canUse(c.ent, "post_event_gallery")) return ok({ items: [] });
        const sinceRaw = url.searchParams.get("since");
        const since = sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? new Date(sinceRaw) : undefined;
        return ok({ items: await listPhotoWall(c.wedding.id, { since, limit: Math.min(Number(url.searchParams.get("limit") ?? 60) || 60, 120) }) });
      }
      case "live": return ok(await livePayload(c.wedding.id, c.guest));
      case "pass": {
        if (!c.guest) throw notFound();
        return ok(await getGuestPass(c.guest));
      }
      case "games": {
        return ok({ plays: c.guest ? await myPlays(c.wedding.id, c.guest.guestId) : [], leaderboard: await leaderboard(c.wedding.id, 10) });
      }
      case "leaderboard": return ok(await leaderboard(c.wedding.id, 20));
      case "capsule": {
        const status = await capsuleStatus(c.wedding.id);
        const items = status?.unlocked ? await listCapsuleItems(c.wedding.id) : [];
        return ok({ status, items });
      }
      default: throw notFound();
    }
  } catch (e) {
    return fail(e, { area: `public:${action}` });
  }
}

export async function POST(req: Request, { params }: Params) {
  const { slug, action } = await params;
  try {
    const c = await context(req, slug);
    const ctype = req.headers.get("content-type") ?? "";
    const isForm = ctype.includes("multipart/form-data");
    if (isForm) assertUploadSize(req);
    switch (action) {
      case "rsvp": {
        const body = await req.json();
        const res = c.guest ? await submitGuestRsvp(c.guest, body, langOf(body)) : await submitOpenRsvp(c.wedding.id, body, { ip: c.ip }, langOf(body));
        return ok(res);
      }
      case "messages": {
        const body = await req.json();
        return ok(await submitMessage(participant(c, body.name), body).then(() => ({ received: true })));
      }
      case "upload": {
        const form = await req.formData();
        const p = participant(c, form.get("name"));
        const cap = form.get("caption");
        const res = await submitGuestUpload(p, await fileFrom(form), { caption: typeof cap === "string" ? cap : undefined });
        return ok(res);
      }
      case "media-wish": {
        const form = await req.formData();
        const kind = form.get("kind") === "VOICE" ? "VOICE" : "VIDEO";
        const p = participant(c, form.get("name"));
        const msg = form.get("message");
        return ok(await submitMediaWish(p, kind, await fileFrom(form), typeof msg === "string" ? msg : ""));
      }
      case "play": {
        const body = await req.json();
        return ok(await playGame(participant(c, body.name), body, langOf(body)));
      }
      case "capsule": {
        const form = await req.formData();
        const kind = String(form.get("kind") ?? "TEXT");
        const body = String(form.get("body") ?? "");
        const p = participant(c, form.get("name"));
        const file = kind === "TEXT" ? undefined : await fileFrom(form);
        return ok(await submitCapsuleItem(p, { kind, body }, file).then(() => ({ sealed: true })));
      }
      case "track": {
        const body = z.object({ visitorId: z.string(), type: z.string(), section: z.string().optional(), device: z.string().optional() }).parse(await req.json());
        await rateLimit(`track-ip:${c.ip}`, 300, 3600);
        const device = body.device === "mobile" || body.device === "tablet" || body.device === "desktop" ? body.device : deviceFromUserAgent(req.headers.get("user-agent"));
        if (body.type === "view" && c.guest) await touchGuestOpen(c.guest.guestId);
        await track(c.wedding.id, c.guest?.guestId ?? null, { ...body, device });
        return ok({ tracked: true });
      }
      default: throw notFound();
    }
  } catch (e) {
    return fail(e, { area: `public:${action}` });
  }
}
