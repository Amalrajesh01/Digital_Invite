"use client";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Minus, Plus, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import type { SectionConfig } from "@/domain/doc/schema";
import { sortEvents } from "@/domain/wedding/view";
import { todayInZone } from "@/lib/time";
import { ApiError, useInvitation } from "../engine/context";
import { Reveal } from "../engine/motion";
import { ChatCta } from "../engine/Chat";
import { fmtDate, whatsappHref } from "../engine/format";
import { Shell, SectionHead, useCopy, InlineNotice } from "./shared";

type Choice = "YES" | "NO" | "MAYBE";

interface Values {
  status: Choice | "";
  name: string;
  phone: string;
  attendingCount: number;
  meal: string;
  companions: { name: string; meal: string }[];
  needsAccommodation: boolean;
  rooms: number;
  arrival: string;
  departure: string;
  needsTransport: boolean;
  pickup: string;
  arrivalRef: string;
  events: Record<string, boolean>;
  note: string;
}

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="inline-flex items-center border border-[var(--c-border)]" role="group" aria-label={label} style={{ borderRadius: "var(--r)" }}>
      <button type="button" className="grid size-12 place-items-center disabled:opacity-40" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="−"><Minus className="size-4" /></button>
      <output className="inv-num w-12 text-center text-2xl" aria-live="polite">{value}</output>
      <button type="button" className="grid size-12 place-items-center disabled:opacity-40" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="+"><Plus className="size-4" /></button>
    </div>
  );
}

export default function RsvpSection({ section }: { section: SectionConfig }) {
  const { view, t, L, post, locale, isPreview } = useInvitation();
  const copy = useCopy(section, { eyebrow: "nav.rsvp", title: "rsvp.title" });
  const cfg = view.doc.rsvp;
  const guest = view.guest;
  const personal = !!guest && !guest.isPreview;
  const seats = guest ? Math.max(1, guest.seats) : 10;
  const existing = guest?.rsvp ?? null;
  const events = useMemo(() => sortEvents(view.doc.events), [view.doc.events]);
  const wantsStay = cfg.askAccommodation && view.entitlements.features.includes("accommodation");
  const wantsRide = cfg.askTransport && view.entitlements.features.includes("transport");
  const askMeal = cfg.askMeal && cfg.mealOptions.length > 0 && view.entitlements.features.includes("meal_preference");
  const closed = !!cfg.deadline && todayInZone(view.wedding.timezone) > cfg.deadline;

  const [reply, setReply] = useState<{ status: Choice; count: number; message: string } | null>(
    existing ? { status: existing.status, count: existing.attendingCount, message: existing.status === "YES" ? t("rsvp.thanks") : existing.status === "NO" ? t("rsvp.thanksNo") : t("rsvp.thanksMaybe") } : null,
  );
  const [editing, setEditing] = useState(!existing);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          status: z.enum(["YES", "NO", "MAYBE"], { message: t("rsvp.title") }),
          name: z.string(),
          phone: z.string(),
          attendingCount: z.number().int(),
          meal: z.string(),
          companions: z.array(z.object({ name: z.string(), meal: z.string() })),
          needsAccommodation: z.boolean(),
          rooms: z.number(),
          arrival: z.string(),
          departure: z.string(),
          needsTransport: z.boolean(),
          pickup: z.string(),
          arrivalRef: z.string(),
          events: z.record(z.string(), z.boolean()),
          note: z.string().max(500),
        })
        .superRefine((v, ctx) => {
          if (!personal && !v.name.trim()) ctx.addIssue({ code: "custom", path: ["name"], message: t("rsvp.needName") });
          if (v.status === "YES" && (v.attendingCount < 1 || v.attendingCount > seats)) ctx.addIssue({ code: "custom", path: ["attendingCount"], message: t("rsvp.reserved", { n: seats }) });
          if (v.status === "YES" && askMeal && !v.meal) ctx.addIssue({ code: "custom", path: ["meal"], message: t("rsvp.meal") });
        }),
    [t, personal, seats, askMeal],
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      status: existing?.status ?? "",
      name: "", phone: "",
      attendingCount: existing?.attendingCount || Math.min(seats, guest?.seats ?? 1),
      meal: existing?.meal ?? "",
      companions: (existing?.companions ?? []).map((c) => ({ name: c.name, meal: c.meal })),
      needsAccommodation: existing?.needsAccommodation ?? false,
      rooms: existing?.accommodation?.rooms ?? 1,
      arrival: existing?.accommodation?.arrival ?? "",
      departure: existing?.accommodation?.departure ?? "",
      needsTransport: existing?.needsTransport ?? false,
      pickup: existing?.transport?.pickupLocation ?? "",
      arrivalRef: existing?.transport?.arrivalAt ?? "",
      events: existing?.eventResponses ?? {},
      note: existing?.note ?? "",
    },
  });
  const { control, register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;
  const status = watch("status");
  const count = watch("attendingCount");
  const { fields, replace } = useFieldArray({ control, name: "companions" });
  const needsStay = watch("needsAccommodation");
  const needsRide = watch("needsTransport");

  const syncCompanions = (n: number) => {
    const want = Math.max(0, n - 1);
    const cur = form.getValues("companions");
    replace(Array.from({ length: want }, (_, i) => cur[i] ?? { name: "", meal: "" }));
  };

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null);
    if (isPreview) {
      toast.message("Preview only — replies are not saved from the editor.");
      return;
    }
    const yes = v.status === "YES";
    try {
      const res = await post<{ status: Choice; attendingCount: number; message: string }>("/rsvp", {
        status: v.status,
        attendingCount: yes ? v.attendingCount : v.status === "MAYBE" ? 0 : 0,
        meal: yes && askMeal ? v.meal || undefined : undefined,
        companions: yes ? v.companions.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), meal: c.meal || undefined })) : [],
        needsAccommodation: yes && wantsStay ? v.needsAccommodation : false,
        accommodation: yes && wantsStay && v.needsAccommodation ? { rooms: v.rooms, arrival: v.arrival, departure: v.departure } : undefined,
        needsTransport: yes && wantsRide ? v.needsTransport : false,
        transport: yes && wantsRide && v.needsTransport ? { pickupLocation: v.pickup, arrivalAt: v.arrivalRef, passengers: v.attendingCount } : undefined,
        eventResponses: cfg.askEventResponses && yes ? v.events : undefined,
        note: v.note || undefined,
        ...(personal ? {} : { name: v.name, phone: v.phone || undefined }),
        locale,
      });
      setReply({ status: res.status, count: res.attendingCount, message: res.message });
      setEditing(false);
      window.setTimeout(() => document.getElementById("s-rsvp")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setServerError(e instanceof ApiError && e.code !== "NETWORK" && e.code !== "INTERNAL" ? e.message : t("error.generic"));
    }
  });

  const waHref = cfg.whatsappNumber
    ? whatsappHref(cfg.whatsappNumber, `${personal ? guest!.name : watch("name") || ""} — ${status ? t(`rsvp.${status.toLowerCase() as "yes"}`) : ""}${status === "YES" ? ` (${count})` : ""} · ${view.wedding.title}`)
    : null;

  const choose = (v: Choice) => { setValue("status", v, { shouldValidate: true }); if (v === "YES") syncCompanions(form.getValues("attendingCount")); };
  const ChoiceBtn = ({ v, label, cls }: { v: Choice; label: string; cls?: string }) => (
    <button type="button" className={cn("rsvp-choice", cls)} aria-pressed={status === v} onClick={() => choose(v)}>
      <span className="rsvp-choice-label">{label}</span>
    </button>
  );

  const mealOptions = (
    <>
      <option value="">—</option>
      {cfg.mealOptions.map((m) => (<option key={m.id} value={m.id}>{L(m.label)}</option>))}
    </>
  );

  if (closed && !reply) {
    return (<Shell section={section} wide={false}><SectionHead eyebrow={copy.eyebrow} title={copy.title} /><InlineNotice>{t("rsvp.closed")}</InlineNotice></Shell>);
  }

  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title} intro={personal ? `${t("invite.dear", { name: guest!.name.split(" ")[0] })} ${t("rsvp.reserved", { n: seats })}.` : copy.intro} />
      {cfg.deadline && <p className="-mt-6 mb-8 text-center text-[0.92rem] opacity-80">{t("rsvp.deadline", { date: fmtDate(cfg.deadline, locale, "long") })}</p>}

      {reply && !editing ? (
        <Reveal className="rsvp-thanks mx-auto max-w-lg">
          <svg viewBox="0 0 24 24" className="rsvp-thanks-heart" aria-hidden><path d="M12 21.2S4.6 16.4 2.7 11.3A5.5 5.5 0 0 1 12 6.4a5.5 5.5 0 0 1 9.3 4.9C19.4 16.4 12 21.2 12 21.2Z" fill="currentColor" /></svg>
          <p className="rsvp-thanks-title">{t("rsvp.thankYou")}</p>
          <p className="inv-serif-lede mt-5 !text-[clamp(1.2rem,4vw,1.6rem)]">{reply.status === "YES" ? t("rsvp.celebrate") : reply.status === "NO" ? t("rsvp.thanksNo") : t("rsvp.thanksMaybe")}</p>
          <p className="inv-muted mt-4 text-[0.92rem]">{t("rsvp.yourReply")}: <strong className="text-[var(--c-text)]">{t(`rsvp.${reply.status.toLowerCase() as "yes"}`)}{reply.status === "YES" ? ` · ${reply.count}` : ""}</strong></p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!closed && <button type="button" className="inv-btn inv-btn-ghost inv-btn-sm" onClick={() => setEditing(true)}>{t("rsvp.change")}</button>}
            {view.entitlements.features.includes("qr_pass") && personal && <a href="#s-qrpass" className="inv-btn inv-btn-sm">{t("rsvp.getPass")}</a>}
          </div>
        </Reveal>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-7" aria-label={copy.title}>
          <div role="group" aria-label={t("rsvp.title")} className="rsvp-choices">
            <ChoiceBtn v="YES" label={t("rsvp.accept")} cls="rsvp-choice-accept" />
            <ChoiceBtn v="NO" label={t("rsvp.decline")} />
          </div>
          <button type="button" className="inv-linkbtn rsvp-maybe" aria-pressed={status === "MAYBE"} onClick={() => choose("MAYBE")}>{t("rsvp.maybe")}</button>
          {errors.status && <p className="inv-error text-center" role="alert">{errors.status.message}</p>}

          {status && (
            <div className="space-y-7 [animation:inv-rise_.45s_var(--ease)]">
              {!personal && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="inv-label" htmlFor="rsvp-name">{t("rsvp.yourName")}</label><input id="rsvp-name" className="inv-input" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />{errors.name && <p className="inv-error" role="alert">{errors.name.message}</p>}</div>
                  <div><label className="inv-label" htmlFor="rsvp-phone">{t("rsvp.phone")} <span className="inv-muted">({t("common.optional")})</span></label><input id="rsvp-phone" className="inv-input" inputMode="tel" autoComplete="tel" {...register("phone")} /></div>
                </div>
              )}

              {status === "YES" && (
                <>
                  <div>
                    <p className="inv-label">{t("rsvp.howMany")}</p>
                    <Controller control={control} name="attendingCount" render={({ field }) => (<Stepper value={field.value} min={1} max={seats} label={t("rsvp.howMany")} onChange={(n) => { field.onChange(n); syncCompanions(n); }} />)} />
                    {errors.attendingCount && <p className="inv-error" role="alert">{errors.attendingCount.message}</p>}
                  </div>

                  {askMeal && (
                    <div>
                      <label className="inv-label" htmlFor="rsvp-meal">{t("rsvp.meal")}</label>
                      <select id="rsvp-meal" className="inv-input" aria-invalid={!!errors.meal} {...register("meal")}>{mealOptions}</select>
                      {errors.meal && <p className="inv-error" role="alert">{errors.meal.message}</p>}
                    </div>
                  )}

                  {fields.length > 0 && cfg.allowCompanions && (
                    <fieldset>
                      <legend className="inv-label">{t("rsvp.companions")}</legend>
                      <div className="space-y-3">
                        {fields.map((f, i) => (
                          <div key={f.id} className={cn("grid gap-3", askMeal ? "sm:grid-cols-[1fr_12rem]" : "")}>
                            <input className="inv-input" placeholder={t("rsvp.companionName", { n: i + 2 })} aria-label={t("rsvp.companionName", { n: i + 2 })} {...register(`companions.${i}.name` as const)} />
                            {askMeal && (<select className="inv-input" aria-label={t("rsvp.meal")} {...register(`companions.${i}.meal` as const)}>{mealOptions}</select>)}
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {cfg.askEventResponses && events.length > 1 && (
                    <fieldset>
                      <legend className="inv-label">{t("rsvp.whichEvents")}</legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {events.map((e) => (
                          <label key={e.id} className="inv-choice cursor-pointer"><input type="checkbox" className="size-5 accent-[var(--c-primary)]" {...register(`events.${e.id}` as const)} /><span>{L(e.name)}<span className="inv-muted block text-[0.82rem]">{fmtDate(e.date, locale, "monthDay")}</span></span></label>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {wantsStay && (
                    <div className="inv-card p-5">
                      <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" className="size-5 accent-[var(--c-primary)]" {...register("needsAccommodation")} /><span className="font-medium">{t("rsvp.stay")}</span></label>
                      {needsStay && (
                        <div className="mt-4 grid gap-4 sm:grid-cols-3 [animation:inv-rise_.4s_var(--ease)]">
                          <div><label className="inv-label" htmlFor="acc-a">{t("rsvp.arrival")}</label><input id="acc-a" type="date" className="inv-input" {...register("arrival")} /></div>
                          <div><label className="inv-label" htmlFor="acc-d">{t("rsvp.departure")}</label><input id="acc-d" type="date" className="inv-input" {...register("departure")} /></div>
                          <div><label className="inv-label" htmlFor="acc-r">{t("rsvp.rooms")}</label><input id="acc-r" type="number" min={1} max={10} className="inv-input" {...register("rooms", { valueAsNumber: true })} /></div>
                        </div>
                      )}
                    </div>
                  )}

                  {wantsRide && (
                    <div className="inv-card p-5">
                      <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" className="size-5 accent-[var(--c-primary)]" {...register("needsTransport")} /><span className="font-medium">{t("rsvp.ride")}</span></label>
                      {needsRide && (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 [animation:inv-rise_.4s_var(--ease)]">
                          <div>
                            <label className="inv-label" htmlFor="tr-p">{t("rsvp.pickup")}</label>
                            {cfg.pickupLocations.length ? (<select id="tr-p" className="inv-input" {...register("pickup")}><option value="">—</option>{cfg.pickupLocations.map((p) => (<option key={p.id} value={L(p.label)}>{L(p.label)}</option>))}</select>) : (<input id="tr-p" className="inv-input" {...register("pickup")} />)}
                          </div>
                          <div><label className="inv-label" htmlFor="tr-a">{t("rsvp.arrivalTime")}</label><input id="tr-a" className="inv-input" {...register("arrivalRef")} /></div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="inv-label" htmlFor="rsvp-note">{t("rsvp.note")}</label>
                <textarea id="rsvp-note" className="inv-input" rows={3} maxLength={500} {...register("note")} />
              </div>

              {serverError && <InlineNotice tone="error">{serverError}</InlineNotice>}

              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className="inv-btn" disabled={isSubmitting}>{isSubmitting ? t("common.loading") : reply ? t("rsvp.update") : t("rsvp.submit")}</button>
                {waHref && <a href={waHref} target="_blank" rel="noopener noreferrer" className="inv-btn inv-btn-ghost"><MessageCircle className="size-4" /> {t("rsvp.whatsapp")}</a>}
                {reply && <button type="button" className="gate-skip" onClick={() => setEditing(false)}>{t("common.cancel")}</button>}
              </div>
            </div>
          )}
        </form>
      )}
      <ChatCta hint className="mt-16" />
    </Shell>
  );
}
