"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2, Lock, Pause, Pencil, Play, RefreshCw, Share2, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { WaIcon } from "@/components/site/WaButton";
import { GiftError, clearCreds, credsFromHash, giftFetch, saveCreds, type OwnerGift } from "./api";
import { PrivacyNote } from "./GiftBuilder";

const STATE: Record<OwnerGift["state"], { label: string; tone: string; text: string }> = {
  DRAFT: { label: "Not sent yet", tone: "bg-warn-soft text-warn", text: "You are still making this gift. Send it to us when you are happy with it." },
  SUBMITTED: { label: "With us — waiting to be published", tone: "bg-info-soft text-info", text: "We will message you on WhatsApp to confirm, and publish it once that is done." },
  LIVE: { label: "Live — private link is on", tone: "bg-ok-soft text-ok", text: "Anyone who has the link can open it. Nobody else can find it." },
  PAUSED: { label: "Paused — the link is switched off", tone: "bg-paper-2 text-ink-2", text: "Nobody can open it right now. Switch it back on whenever you like." },
};

const CHOICE_TONE: Record<string, string> = { yes: "bg-ok-soft text-ok", alt: "bg-info-soft text-info", talk: "bg-info-soft text-info", later: "bg-warn-soft text-warn", no: "bg-paper-2 text-ink-2", open: "bg-info-soft text-info" };

/** What the person it was made for has answered — read only by the maker, through their own secret link. Nothing here is ever sent to anyone. */
function Replies({ gift }: { gift: OwnerGift }) {
  const mode = gift.love.forever.replies;
  return (
    <section className="rounded-xl border border-rule-strong bg-white p-5">
      <h2 className="text-[19px] font-semibold text-ink">Their answer</h2>
      {mode !== "collect" ? (
        <p className="mt-1 text-[15px] text-ink-2/85">{mode === "whatsapp" ? "Answers arrive in your WhatsApp, if they choose to send one." : "You chose not to collect an answer. They can answer you in their own way."}</p>
      ) : gift.replies.length === 0 ? (
        <p className="mt-1 text-[15px] text-ink-2/85">Nothing yet — and that is fine. Answers appear here only if they choose to send one. We never remind or message them.</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {gift.replies.map((r) => (
            <li key={r.id} className="rounded-lg border border-rule bg-paper p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn("rounded-full px-3 py-1 text-[13.5px] font-semibold", CHOICE_TONE[r.choice] ?? "bg-paper-2 text-ink-2")}>{r.label || r.choice}</span>
                <time className="text-[13px] text-muted" dateTime={new Date(r.at).toISOString()}>{new Date(r.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</time>
              </div>
              {r.when && <p className="mt-2 text-[15px] text-ink"><b>Suggested:</b> {r.when}</p>}
              {r.note && <p className="mt-2 whitespace-pre-wrap text-[15px] text-ink">{r.note}</p>}
              {r.answers.length > 0 && <details className="mt-2 text-[14px]"><summary className="cursor-pointer text-ink-2">Their answers along the way</summary><ul className="mt-2 grid gap-1">{r.answers.map((a, i) => <li key={i}><span className="text-muted">{a.q}</span> — <b>{a.a}</b></li>)}</ul></details>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The maker's page for one gift: where it stands, its private link, and the controls that keep it theirs. */
export function GiftManage({ id }: { id: string }) {
  const [gift, setGift] = useState<OwnerGift | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  const load = useCallback(async (t: string) => {
    try {
      const g = await giftFetch<OwnerGift>({ token: t }, `/api/gift/${id}`);
      setGift(g);
      setState("ok");
      saveCreds({ id, token: t, viewToken: g.viewToken });
    } catch {
      setState("missing");
    }
  }, [id]);

  useEffect(() => {
    const c = credsFromHash(window.location.hash);
    if (!c || c.id !== id) { setState("missing"); return; }
    setToken(c.token);
    void load(c.token);
  }, [id, load]);

  const act = async (label: string, fn: () => Promise<unknown>, done: string) => {
    if (!token) return;
    setBusy(label); setMsg(null);
    try { await fn(); await load(token); setMsg({ tone: "ok", text: done }); }
    catch (e) { setMsg({ tone: "bad", text: e instanceof GiftError ? e.message : "Something went wrong." }); }
    finally { setBusy(null); }
  };
  const post = (action: "pause" | "resume" | "update") => giftFetch({ token: token! }, `/api/gift/${id}/state`, { method: "POST", body: JSON.stringify({ action }) });

  if (state === "loading") return <div className="grid min-h-[50vh] place-items-center text-muted"><Loader2 className="size-6 animate-spin" aria-label="Loading" /></div>;
  if (state === "missing" || !gift || !token) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-[40px] font-medium text-ink">We can’t open this gift page</h1>
        <p className="mt-4 text-[17px] text-ink-2/85">The link may be incomplete, or the gift may have been deleted. Please use the full link you saved when you made the gift — it ends with a long code.</p>
        <Link href="/for-my-love" className="btn btn-accent btn-lg mt-8">Make a new gift</Link>
      </div>
    );
  }

  const s = STATE[gift.state];
  const share = gift.publicUrl;
  const shareText = share ? `I made something for you. ${share}` : "";
  return (
    <div className="mx-auto max-w-[76rem] px-5 py-10 sm:px-8">
      <p className="eyebrow !text-accent">Your gift · ref {gift.ref}</p>
      <h1 className="mt-2 font-serif text-[clamp(34px,4.6vw,54px)] font-medium leading-[1.05] text-ink">{gift.love.to ? `A gift for ${gift.love.to}` : "Your gift"}</h1>
      <p className={cn("mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[14.5px] font-semibold", s.tone)}>{s.label}</p>
      <p className="mt-3 max-w-2xl text-[16.5px] text-ink-2/85">{s.text}</p>
      {gift.state === "DRAFT" && gift.expiresAt && <p className="mt-2 text-[14px] text-muted">If you do not send it, it is deleted on {new Date(gift.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.</p>}
      {msg && <p role="status" className={cn("mt-5 rounded-lg border px-4 py-3 text-[15px]", msg.tone === "ok" ? "border-ok/40 bg-ok-soft text-ok" : "border-bad/40 bg-bad-soft text-bad")}>{msg.text}</p>}

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="grid content-start gap-6">
          {share && gift.state === "LIVE" && (
            <section className="rounded-xl border border-rule-strong bg-white p-5">
              <h2 className="text-[19px] font-semibold text-ink">Send it</h2>
              <p className="mt-1 text-[15px] text-ink-2/85">This is the private link. Send it only to the person it is for.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input readOnly className="field-input min-w-0 flex-1 !text-[13.5px]" value={share} aria-label="Private link to your gift" onFocus={(e) => e.currentTarget.select()} />
                <button type="button" className="btn btn-quiet" onClick={async () => { try { await navigator.clipboard.writeText(share); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }}>{copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? "Copied" : "Copy"}</button>
                <a className="btn bg-[#1fa855] text-white hover:bg-[#188f47]" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"><WaIcon className="size-4" /> Send on WhatsApp</a>
                {canShare && <button type="button" className="btn btn-quiet" onClick={() => { void navigator.share({ text: "I made something for you.", url: share }).catch(() => {}); }}><Share2 className="size-4" aria-hidden /> Share…</button>}
              </div>
            </section>
          )}

          {gift.letter && <Replies gift={gift} />}

          <section className="rounded-xl border border-rule-strong bg-white p-5">
            <h2 className="text-[19px] font-semibold text-ink">What would you like to do?</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/for-my-love/make`} onClick={() => saveCreds({ id, token, viewToken: gift.viewToken })} className="btn btn-quiet"><Pencil className="size-4" aria-hidden /> Change my gift</Link>
              {(gift.state === "LIVE" || gift.state === "PAUSED") && (
                <button type="button" disabled={!!busy} onClick={() => act("update", () => post("update"), "Your latest changes are published.")} className="btn btn-quiet"><RefreshCw className={cn("size-4", busy === "update" && "animate-spin")} aria-hidden /> Publish my latest changes</button>
              )}
              {gift.state === "LIVE" && <button type="button" disabled={!!busy} onClick={() => act("pause", () => post("pause"), "The link is switched off. Nobody can open the gift now.")} className="btn btn-quiet"><Pause className="size-4" aria-hidden /> Pause the link</button>}
              {gift.state === "PAUSED" && <button type="button" disabled={!!busy} onClick={() => act("resume", () => post("resume"), "The link is switched back on.")} className="btn btn-accent"><Play className="size-4" aria-hidden /> Switch the link back on</button>}
              {(gift.state === "DRAFT" || gift.state === "SUBMITTED") && <Link href="/for-my-love/make" onClick={() => saveCreds({ id, token, viewToken: gift.viewToken })} className="btn btn-accent">{gift.state === "DRAFT" ? "Finish and send it to us" : "See what we received"}</Link>}
            </div>
          </section>

          <section className="rounded-xl border border-bad/30 bg-white p-5">
            <h2 className="text-[19px] font-semibold text-ink">Delete this gift</h2>
            <p className="mt-1 text-[15px] text-ink-2/85">This removes the gift, every photograph and the song — immediately and for good. We cannot get them back, and neither can anyone else.</p>
            {!confirmDelete ? (
              <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-quiet mt-4 !border-bad/40 text-bad"><Trash2 className="size-4" aria-hidden /> Delete my gift</button>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" disabled={!!busy} className="btn btn-danger" onClick={async () => { setBusy("delete"); try { await giftFetch({ token }, `/api/gift/${id}`, { method: "DELETE" }); clearCreds(); setGift(null); setState("missing"); } catch (e) { setMsg({ tone: "bad", text: e instanceof GiftError ? e.message : "Something went wrong." }); } finally { setBusy(null); } }}>{busy === "delete" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />} Yes, delete everything</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-quiet">Keep it</button>
              </div>
            )}
          </section>
          <PrivacyNote />
        </div>

        <aside>
          <div className="sticky top-24">
            <div className="mx-auto w-full max-w-[22rem] overflow-hidden rounded-[2.4rem] border-[9px] border-ink bg-ink shadow-[0_40px_70px_-34px_rgba(11,27,53,.6)]">
              <iframe src={`/for-my-love/preview/${id}?t=${gift.viewToken}`} title="Your gift, as they will see it" referrerPolicy="no-referrer" className="block h-[40rem] w-full rounded-[1.7rem] border-0 bg-white" />
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-muted"><Lock className="size-3.5" aria-hidden /> Only you can see this preview</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
