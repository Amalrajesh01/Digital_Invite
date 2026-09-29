"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Check, CircleAlert, MessageCircle, Radio, ScanLine, Search, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { SelectField, TextField } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { Ledger, EmptyState, Skeleton, Meter } from "@/components/ui/Bits";
import { LText, LocaleProvider } from "@/components/admin/forms";
import { Qr } from "@/invitation/engine/qr";
import { CopyButton } from "./CopyButton";
import type { LocalizedText } from "@/domain/doc/schema";
import { remindersAction, shareListAction, updateAccommodationAction, updateTransportAction } from "@/app/actions/guests";
import { checkInAction, checkinStatsAction, deleteUpdateAction, lookupPassAction, postUpdateAction, rosterAction, setLiveEventAction, snapshotAction } from "@/app/actions/participation";

// ── reminders ───────────────────────────────────────────────────────────────
export function RemindersPanel({ weddingId, pending, secondary }: { weddingId: string; pending: number; secondary: string | null }) {
  const [busy, start] = useTransition();
  const [items, setItems] = useState<{ guestId: string; name: string; email: string | null; whatsapp: string | null; link: string }[] | null>(null);
  const [lang, setLang] = useState("en");
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button icon={<Send className="size-4" />} loading={busy} disabled={pending === 0} onClick={() => start(async () => { const r = await remindersAction(weddingId, undefined, lang); if (r.ok) { setItems(r.data.items); toast.success(`${r.data.count} reminder${r.data.count === 1 ? "" : "s"} prepared — emails queued, WhatsApp links ready`); } else toast.error(r.error.message); })}>Remind the {pending} who haven’t replied</Button>
        {secondary && <select aria-label="Reminder language" value={lang} onChange={(e) => setLang(e.target.value)} className="field-input !w-auto"><option value="en">English message</option>{secondary === "ml" && <option value="ml">മലയാളം message</option>}</select>}
      </div>
      <Sheet open={!!items} onClose={() => setItems(null)} wide title="Send the reminders" description="Emails are queued automatically. For WhatsApp, tap each button — your message is ready to send.">
        <ul className="divide-y divide-rule">
          {items?.map((i) => (
            <li key={i.guestId} className="flex flex-wrap items-center gap-3 py-3"><span className="min-w-0 flex-1"><span className="block font-medium">{i.name}</span><span className="text-[12.5px] text-muted">{i.email ? "Email queued" : "No email"}</span></span>{i.whatsapp ? <a href={i.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-quiet btn-sm"><MessageCircle className="size-4" />WhatsApp</a> : <span className="text-[12.5px] text-muted">no phone</span>}<CopyButton text={i.link} label="Copy link" variant="ghost" /></li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}

// ── stay / transport requests ───────────────────────────────────────────────
type Req = { id: string; status: "REQUESTED" | "CONFIRMED" | "DECLINED"; guest: { name: string; phone: string | null }; a: string; b: string; c: string; assignment: string };

export function RequestsTable({ weddingId, kind, rows: initial }: { weddingId: string; kind: "stay" | "ride"; rows: Req[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();
  const patch = (id: string, p: { status?: Req["status"]; assign?: string }) =>
    start(async () => {
      const r = kind === "stay" ? await updateAccommodationAction(weddingId, id, { status: p.status, assignment: p.assign }) : await updateTransportAction(weddingId, id, { status: p.status, vehicle: p.assign });
      if (r.ok) { setRows((s) => s.map((x) => (x.id === id ? { ...x, status: p.status ?? x.status, assignment: p.assign ?? x.assignment } : x))); router.refresh(); }
      else toast.error(r.error.message);
    });
  if (!rows.length) return <EmptyState mark={kind === "stay" ? "⌂" : "➜"} title={kind === "stay" ? "No stay requests yet" : "No travel requests yet"} body="Requests appear here when guests tick the box on their RSVP." />;
  return (
    <div className="overflow-x-auto rounded-lg border border-rule bg-surface">
      <table className="ledger">
        <thead><tr><th>Guest</th><th>{kind === "stay" ? "Rooms & dates" : "Pickup"}</th><th>{kind === "stay" ? "Notes" : "Arriving"}</th><th>{kind === "stay" ? "Room / hotel" : "Vehicle"}</th><th>Status</th></tr></thead>
        <tbody className={cn(pending && "opacity-70")}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><span className="font-medium">{r.guest.name}</span>{r.guest.phone && <span className="block text-[12.5px] text-muted">+{r.guest.phone}</span>}</td>
              <td className="text-[14px]">{r.a}</td><td className="text-[14px]">{r.b}</td>
              <td><input aria-label="Assignment" defaultValue={r.assignment} onBlur={(e) => e.target.value !== r.assignment && patch(r.id, { assign: e.target.value })} className="field-input !py-1.5" placeholder={kind === "stay" ? "e.g. Lakeside · Room 12" : "e.g. Innova KL-05 · driver Biju"} /></td>
              <td><select aria-label="Status" value={r.status} onChange={(e) => patch(r.id, { status: e.target.value as Req["status"] })} className="field-input !w-auto !py-1.5"><option value="REQUESTED">Requested</option><option value="CONFIRMED">Confirmed</option><option value="DECLINED">Can’t arrange</option></select></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── share centre ────────────────────────────────────────────────────────────
export function SharePanel({ weddingId, url, title, canPersonal }: { weddingId: string; url: string; title: string; canPersonal: boolean }) {
  const [busy, start] = useTransition();
  const [list, setList] = useState<{ guestId: string; name: string; link: string; whatsapp: string | null }[] | null>(null);
  const msg = `You are invited to ${title}! Open the invitation: ${url}`;
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_auto]">
      <div className="space-y-6">
        <div>
          <p className="eyebrow mb-2">Public invitation link</p>
          <div className="flex items-center gap-2 rounded-md border border-rule-strong bg-surface px-4 py-3"><code className="min-w-0 flex-1 truncate text-[14.5px]">{url}</code><CopyButton text={url} label="Copy" /></div>
          <p className="mt-2 text-[13px] text-muted">Anyone with this link can open the invitation. It is the right one to post in a group chat.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a className="btn btn-primary" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" />Share on WhatsApp</a>
          <a className="btn btn-quiet" href={url} target="_blank" rel="noopener noreferrer">Open the invitation</a>
        </div>
        {canPersonal && (
          <div className="rounded-lg border border-rule bg-surface p-5">
            <p className="display text-[22px]">Personal links for each guest</p>
            <p className="mt-1 text-[14px] text-muted">Every guest gets a private link that greets them by name and remembers their reply. Send them one by one on WhatsApp.</p>
            <Button className="mt-4" variant="quiet" loading={busy} onClick={() => start(async () => { const r = await shareListAction(weddingId); if (r.ok) setList(r.data); else toast.error(r.error.message); })}>Prepare all personal invitations</Button>
          </div>
        )}
      </div>
      <figure className="mx-auto text-center"><Qr text={url} size={200} className="rounded-md bg-white p-3 ring-1 ring-rule" label="QR code of the invitation link" /><figcaption className="mt-3 text-[13px] text-muted">Print it on cards or the wedding stage.</figcaption></figure>
      <Sheet open={!!list} onClose={() => setList(null)} wide title="Personal invitations" description="Tap WhatsApp to send each guest their own link."><ul className="divide-y divide-rule">{list?.map((s) => (<li key={s.guestId} className="flex flex-wrap items-center gap-3 py-3"><span className="min-w-0 flex-1 font-medium">{s.name}</span>{s.whatsapp ? <a className="btn btn-quiet btn-sm" href={s.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" />WhatsApp</a> : <span className="text-[12.5px] text-muted">no phone</span>}<CopyButton text={s.link} label="Copy" variant="ghost" /></li>))}</ul></Sheet>
    </div>
  );
}

// ── QR check-in ─────────────────────────────────────────────────────────────
interface EventOpt { id: string; name: string }
type Found = { guestId: string; name: string; group: string | null; seats: number; relationship: string; rsvpStatus: string | null; attending: number | null; meal: string; notes: string; checkins: { eventId: string; seats: number; at: string }[] };

export function CheckinConsole({ weddingId, events, defaultEvent }: { weddingId: string; events: EventOpt[]; defaultEvent: string }) {
  const [eventId, setEventId] = useState(defaultEvent);
  const [mode, setMode] = useState<"scan" | "search">("scan");
  const [stats, setStats] = useState<Awaited<ReturnType<typeof checkinStatsAction>> | null>(null);
  const [found, setFound] = useState<Found | null>(null);
  const [seats, setSeats] = useState(1);
  const [flash, setFlash] = useState<{ tone: "ok" | "dup" | "bad"; text: string } | null>(null);
  const [q, setQ] = useState("");
  const [roster, setRoster] = useState<{ id: string; name: string; seats: number; group: string | null; rsvp: string | null; attending: number | null; at: string | null }[]>([]);
  const [busy, start] = useTransition();
  const [manual, setManual] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const last = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const [camErr, setCamErr] = useState("");

  const loadStats = useCallback(async () => {
    const r = await checkinStatsAction(weddingId, eventId);
    if (r.ok) setStats(r);
  }, [weddingId, eventId]);
  useEffect(() => {
    void loadStats();
    const id = setInterval(loadStats, 8000);
    return () => clearInterval(id);
  }, [loadStats]);

  const loadRoster = useCallback(async () => {
    const r = await rosterAction(weddingId, eventId, q);
    if (r.ok) setRoster(r.data);
  }, [weddingId, eventId, q]);
  useEffect(() => { if (mode === "search") { const t = setTimeout(() => void loadRoster(), 200); return () => clearTimeout(t); } }, [mode, loadRoster]);

  const lookup = useCallback(async (payload: string) => {
    const r = await lookupPassAction(weddingId, payload);
    if (r.ok) {
      setFound(r.data as Found);
      setSeats(Math.min(r.data.seats, r.data.attending ?? r.data.seats) || 1);
      const already = r.data.checkins.find((c) => c.eventId === eventId);
      if (already) setFlash({ tone: "dup", text: `${r.data.name} was already checked in at ${new Date(already.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` });
      else setFlash(null);
      navigator.vibrate?.(60);
    } else {
      setFound(null);
      setFlash({ tone: "bad", text: r.error.message });
      navigator.vibrate?.([80, 60, 80]);
    }
  }, [weddingId, eventId]);

  // camera scanning loop
  useEffect(() => {
    if (mode !== "scan") return;
    let raf = 0;
    let stopped = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 960 } } });
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        streamRef.current = s;
        if (video.current) { video.current.srcObject = s; await video.current.play(); }
        const tick = () => {
          const v = video.current, c = canvas.current;
          if (v && c && v.readyState === v.HAVE_ENOUGH_DATA) {
            c.width = v.videoWidth; c.height = v.videoHeight;
            const ctx = c.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, c.width, c.height);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            if (code?.data && (code.data !== last.current.code || Date.now() - last.current.at > 4000)) {
              last.current = { code: code.data, at: Date.now() };
              void lookup(code.data);
            }
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setCamErr("Camera unavailable. Allow camera access, or use ‘Find a guest’ / type the pass code.");
      }
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [mode, lookup]);

  const admit = () =>
    start(async () => {
      if (!found) return;
      const r = await checkInAction(weddingId, { guestId: found.guestId, eventId, seats, method: mode === "scan" ? "QR" : "MANUAL" });
      if (r.ok) {
        setFlash(r.data.alreadyCheckedIn ? { tone: "dup", text: `${r.data.name} was already checked in` } : { tone: "ok", text: `Welcome, ${r.data.name} — ${r.data.seats} seat${r.data.seats === 1 ? "" : "s"}` });
        setFound(null);
        void loadStats();
        if (mode === "search") void loadRoster();
      } else toast.error(r.error.message);
    });

  const pct = stats?.ok && stats.data.expectedSeats ? Math.round((stats.data.checkedInSeats / stats.data.expectedSeats) * 100) : 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <SelectField label="Checking guests into" value={eventId} onChange={(e) => { setEventId(e.target.value); setFound(null); setFlash(null); }} className="min-w-64">{events.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}</SelectField>
        <div role="tablist" className="inline-flex rounded-md border border-rule-strong bg-surface p-0.5 text-[14px]">{([["scan", "Scan pass"], ["search", "Find a guest"]] as const).map(([k, l]) => (<button key={k} role="tab" type="button" aria-selected={mode === k} onClick={() => setMode(k)} className={cn("min-h-10 rounded-[4px] px-4 font-medium", mode === k ? "bg-ink text-paper" : "text-ink-2")}>{l}</button>))}</div>
      </div>

      {stats?.ok && (
        <Ledger items={[{ label: "Arrived", value: stats.data.checkedInGuests, note: `${stats.data.checkedInSeats} seats` }, { label: "Expected", value: stats.data.expectedSeats, note: "from “Yes” replies" }, { label: "Invited", value: stats.data.invited }]} />
      )}
      {stats?.ok && stats.data.expectedSeats > 0 && <div><Meter value={stats.data.checkedInSeats} max={stats.data.expectedSeats} tone="ok" label="Arrived vs expected" /><p className="mt-1 text-[12.5px] text-muted">{pct}% of expected guests have arrived</p></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          {mode === "scan" ? (
            <div className="overflow-hidden rounded-lg bg-ink">
              <div className="relative aspect-[4/3]">
                <video ref={video} playsInline muted className="size-full object-cover" />
                <canvas ref={canvas} className="hidden" />
                <div aria-hidden className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-white/70"><ScanLine className="absolute inset-x-0 top-1/2 mx-auto size-8 -translate-y-1/2 text-white/60" /></div>
                {camErr && <p className="absolute inset-0 grid place-items-center bg-ink/85 p-6 text-center text-paper">{camErr}</p>}
              </div>
              <div className="flex gap-2 bg-paper-2 p-3"><input value={manual} onChange={(e) => setManual(e.target.value.toUpperCase())} placeholder="…or type the pass code" aria-label="Pass code" className="field-input" onKeyDown={(e) => e.key === "Enter" && manual && void lookup(manual)} /><Button variant="quiet" onClick={() => manual && void lookup(manual)}>Look up</Button></div>
            </div>
          ) : (
            <div>
              <label className="relative block"><span className="sr-only">Search guests</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" className="field-input !pl-9" autoFocus /></label>
              <ul className="mt-3 max-h-[26rem] divide-y divide-rule overflow-y-auto rounded-lg border border-rule bg-surface">
                {roster.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1"><span className="block font-medium">{g.name}</span><span className="text-[12.5px] text-muted">{g.group ?? "No group"} · {g.seats} seats{g.rsvp ? ` · replied ${g.rsvp.toLowerCase()}` : ""}</span></span>{g.at ? <Chip tone="ok">Arrived</Chip> : <Button size="sm" onClick={() => { setFound({ guestId: g.id, name: g.name, group: g.group, seats: g.seats, relationship: "", rsvpStatus: g.rsvp, attending: g.attending, meal: "", notes: "", checkins: [] }); setSeats(g.attending || g.seats); setFlash(null); }}>Check in</Button>}</li>
                ))}
                {roster.length === 0 && <li className="p-6 text-center text-muted">No guests match.</li>}
              </ul>
            </div>
          )}
        </div>

        <div aria-live="polite" className="space-y-4">
          {flash && <div role="status" className={cn("flex items-start gap-3 rounded-lg p-4 text-[15px]", flash.tone === "ok" ? "bg-ok-soft text-ok" : flash.tone === "dup" ? "bg-warn-soft text-warn" : "bg-bad-soft text-bad")}>{flash.tone === "ok" ? <Check className="mt-0.5 size-5" /> : <CircleAlert className="mt-0.5 size-5" />}<span className="font-medium">{flash.text}</span></div>}
          {found ? (
            <div className="rounded-lg border-2 border-ink bg-surface p-6">
              <p className="eyebrow">Guest</p>
              <p className="display mt-1 text-[38px] leading-none">{found.name}</p>
              <p className="mt-2 text-[14.5px] text-muted">{[found.group, found.relationship].filter(Boolean).join(" · ")}</p>
              <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-rule pt-4 text-center"><div><dt className="eyebrow">Reserved</dt><dd className="display tnum text-[30px]">{found.seats}</dd></div><div><dt className="eyebrow">Replied</dt><dd className="display text-[22px] leading-[2.2rem]">{found.rsvpStatus ? found.rsvpStatus.toLowerCase() : "—"}</dd></div><div><dt className="eyebrow">Attending</dt><dd className="display tnum text-[30px]">{found.attending ?? "—"}</dd></div></dl>
              {found.notes && <p className="mt-4 rounded bg-warn-soft px-3 py-2 text-[13.5px] text-warn">Note: {found.notes}</p>}
              <div className="mt-5 flex flex-wrap items-end gap-4"><TextField label="Seats to admit" type="number" min={1} max={found.seats} value={seats} onChange={(e) => setSeats(Math.max(1, Math.min(found.seats, Number(e.target.value) || 1)))} className="w-32" /><Button size="lg" variant="accent" loading={busy} onClick={admit} icon={<Check className="size-5" />}>Admit</Button><Button variant="ghost" onClick={() => { setFound(null); setFlash(null); }}>Cancel</Button></div>
            </div>
          ) : !flash && <EmptyState mark="◎" title="Ready to scan" body="Hold the guest’s phone or printed pass up to the camera." />}
          {stats?.ok && stats.data.recent.length > 0 && (
            <div><p className="eyebrow mb-2">Latest arrivals</p><ul className="divide-y divide-rule text-[14.5px]">{stats.data.recent.map((r, i) => (<li key={i} className="flex justify-between py-2"><span>{r.name} <span className="text-muted">· {r.seats} seat{r.seats === 1 ? "" : "s"}</span></span><time className="text-muted tnum">{new Date(r.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</time></li>))}</ul></div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── live event console ──────────────────────────────────────────────────────
export function LiveConsole({ weddingId, events, secondary, canCheckin, base }: { weddingId: string; events: EventOpt[]; secondary: string | null; canCheckin: boolean; base: string }) {
  const [snap, setSnap] = useState<Awaited<ReturnType<typeof snapshotAction>> | null>(null);
  const [title, setTitle] = useState<LocalizedText>({});
  const [body, setBody] = useState<LocalizedText>({});
  const [kind, setKind] = useState<"INFO" | "ALERT" | "SCHEDULE" | "MILESTONE">("INFO");
  const [pinned, setPinned] = useState(false);
  const [note, setNote] = useState("");
  const [busy, start] = useTransition();
  const load = useCallback(async () => setSnap(await snapshotAction(weddingId)), [weddingId]);
  useEffect(() => {
    void load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);
  const s = snap?.ok ? snap.data : null;
  const run = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, msg?: string) => start(async () => { const r = await fn(); if (r.ok) { if (msg) toast.success(msg); await load(); } else toast.error(r.error?.message ?? "That did not work."); });
  const name = (id: string | null) => events.find((e) => e.id === id)?.name ?? "—";
  if (!s) return <Skeleton className="h-72" />;
  return (
    <LocaleProvider value={{ secondary }}>
      <div className="space-y-8">
        <div className="rounded-lg border border-rule bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div><p className="eyebrow flex items-center gap-2"><Radio className="size-3.5 text-accent" />Happening now {s.mode === "MANUAL" && <Chip tone="brass">set by you</Chip>}</p><p className="display mt-1 text-[40px] leading-tight">{s.currentId ? name(s.currentId) : "Nothing right now"}</p>{s.nextId && <p className="mt-1 text-[15px] text-muted">Next: {name(s.nextId)}</p>}{s.note && <p className="mt-2 italic text-muted">“{s.note}”</p>}</div>
            <div className="min-w-64 space-y-2"><SelectField label="Mark an event as happening now" value={s.mode === "MANUAL" ? s.currentId ?? "" : ""} onChange={(e) => run(() => setLiveEventAction(weddingId, e.target.value || null, note), e.target.value ? "Guests now see it as happening" : "Following the clock again")}><option value="">Follow the clock automatically</option>{events.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}</SelectField><TextField label="A short note for guests (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Muhurtham starting in 10 minutes" /></div>
          </div>
        </div>

        <Ledger items={[
          { label: "Arrived", value: s.stats?.checkedInGuests ?? "—", note: s.stats ? `${s.stats.checkedInSeats} of ${s.stats.expectedSeats} seats` : undefined, href: canCheckin ? `${base}/checkin` : undefined },
          { label: "Photos waiting", value: s.pendingPhotos, href: `${base}/photos` },
          { label: "Wishes waiting", value: s.pendingWishes, href: `${base}/wishes` },
        ]} />

        <div className="grid gap-8 lg:grid-cols-2">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await postUpdateAction(weddingId, { title, body, kind, pinned }); if (r.ok) { setTitle({}); setBody({}); setPinned(false); } return r; }, "Posted to every guest’s invitation"); }}>
            <h2 className="display text-[26px]">Tell every guest</h2>
            <LText label="Headline" required value={title} onChange={setTitle} placeholder="Sadhya seating opens at 12:30" />
            <LText label="Details (optional)" multiline value={body} onChange={setBody} />
            <div className="flex flex-wrap items-end gap-4"><SelectField label="Type" value={kind} onChange={(e) => setKind(e.target.value as never)} className="w-44"><option value="INFO">Information</option><option value="ALERT">Important</option><option value="SCHEDULE">Schedule change</option><option value="MILESTONE">Milestone</option></SelectField><label className="flex cursor-pointer items-center gap-2 pb-3 text-[14.5px]"><input type="checkbox" className="size-[18px] accent-[var(--accent)]" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />Pin to the top</label></div>
            <Button type="submit" loading={busy} disabled={!title.en?.trim()} icon={<Send className="size-4" />}>Post update</Button>
          </form>
          <div>
            <h2 className="display text-[26px]">Recent updates</h2>
            {s.updates.length === 0 ? <p className="py-6 text-muted">No updates yet. Guests see them appear live on their phones.</p> : (
              <ul className="mt-3 divide-y divide-rule">{s.updates.map((u) => (<li key={u.id} className="flex items-start gap-3 py-3"><div className="min-w-0 flex-1"><p className="font-medium">{u.title.en ?? Object.values(u.title)[0]}</p>{u.body.en && <p className="text-[14px] text-muted">{u.body.en}</p>}<p className="text-[12px] text-muted">{new Date(u.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}{u.pinned ? " · pinned" : ""}</p></div><button className="btn btn-ghost btn-sm !px-2 text-bad" aria-label="Delete update" onClick={() => run(() => deleteUpdateAction(weddingId, u.id))}><Trash2 className="size-4" /></button></li>))}</ul>
            )}
          </div>
        </div>
      </div>
    </LocaleProvider>
  );
}

