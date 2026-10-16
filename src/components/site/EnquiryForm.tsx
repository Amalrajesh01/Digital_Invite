"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { getSource, getVisitorId, track } from "./SiteTracker";

export interface EnquiryChoice { slug: string; name: string }

/**
 * The short form that turns a visitor into an enquiry: a name and a WhatsApp number are all that is required.
 * Nothing is asked that we do not need to start, and the person is told plainly what happens next.
 */
export function EnquiryForm({ occasions, templates, initialOccasion, initialTemplate }: { occasions: EnquiryChoice[]; templates: (EnquiryChoice & { occasion: string })[]; initialOccasion: string; initialTemplate: string }) {
  const router = useRouter();
  const [occasion, setOccasion] = useState(initialOccasion);
  const [template, setTemplate] = useState(initialTemplate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const started = useRef(false);
  const choices = templates.filter((t) => !occasion || t.occasion === occasion);
  useEffect(() => { if (template && !choices.some((c) => c.slug === template)) setTemplate(""); }, [occasion]); // eslint-disable-line react-hooks/exhaustive-deps

  const begin = () => {
    if (started.current) return;
    started.current = true;
    track("enquiry_start", template || occasion);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/site/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.get("name"), phone: f.get("phone"), occasion, templateSlug: template, eventDate: f.get("date") || undefined, message: f.get("message") || undefined, website: f.get("website") || undefined, visitorId: getVisitorId(), source: getSource() }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; data?: { ref: string }; error?: { message?: string; fields?: Record<string, string> } };
      if (!res.ok || !json.ok) {
        const fields = json.error?.fields ?? {};
        setError({ message: json.error?.message ?? "Something went wrong. Please try again, or message us on WhatsApp.", field: Object.keys(fields)[0] });
        return;
      }
      const q = new URLSearchParams({ ref: json.data?.ref ?? "", name: String(f.get("name") ?? "").split(" ")[0], t: template, o: occasion });
      router.push(`/start/thanks?${q}`);
    } catch {
      setError({ message: "We could not reach the server. Please check your connection, or message us on WhatsApp." });
    } finally {
      setBusy(false);
    }
  };

  const field = "field-input w-full !min-h-[3.25rem] !text-[16.5px]";
  return (
    <form onSubmit={submit} onFocusCapture={begin} className="grid gap-6" noValidate>
      <div>
        <label htmlFor="occasion" className="text-[15px] font-semibold text-ink">What are you celebrating?</label>
        <select id="occasion" className={`${field} mt-2`} value={occasion} onChange={(e) => setOccasion(e.target.value)}>
          <option value="">Choose an occasion</option>
          {occasions.map((o) => (<option key={o.slug} value={o.slug}>{o.name}</option>))}
        </select>
      </div>
      {choices.length > 0 && (
        <div>
          <label htmlFor="design" className="text-[15px] font-semibold text-ink">Which design do you like? <span className="font-normal text-muted">(optional)</span></label>
          <select id="design" className={`${field} mt-2`} value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option value="">Not sure yet — help me choose</option>
            {choices.map((t) => (<option key={t.slug} value={t.slug}>{t.name}</option>))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="name" className="text-[15px] font-semibold text-ink">Your name</label>
        <input id="name" name="name" className={`${field} mt-2`} autoComplete="name" maxLength={80} required aria-invalid={error?.field === "name"} />
      </div>
      <div>
        <label htmlFor="phone" className="text-[15px] font-semibold text-ink">Your WhatsApp number</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98460 00000" className={`${field} mt-2`} maxLength={24} required aria-invalid={error?.field === "phone"} />
        <p className="mt-1.5 text-[13.5px] text-muted">We will message you here. We never share your number.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="text-[15px] font-semibold text-ink">Date of the occasion <span className="font-normal text-muted">(optional)</span></label>
          <input id="date" name="date" type="date" className={`${field} mt-2`} />
        </div>
      </div>
      <div>
        <label htmlFor="message" className="text-[15px] font-semibold text-ink">Anything we should know? <span className="font-normal text-muted">(optional)</span></label>
        <textarea id="message" name="message" rows={3} maxLength={600} className="field-input mt-2 w-full !text-[16.5px]" placeholder="The place, the language, how many guests…" />
      </div>
      {/* a field only scripts fill in */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad-soft px-4 py-3 text-[15px] text-bad">{error.message}</p>}
      <button type="submit" disabled={busy} data-track="cta_click" data-ref="enquiry-submit" className="btn btn-accent btn-lg w-full sm:w-fit">{busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Send — and we will message you</button>
      <p className="flex items-center gap-2 text-[13.5px] text-muted"><Lock className="size-3.5" aria-hidden /> Only our team sees this. Nothing is posted anywhere.</p>
    </form>
  );
}
