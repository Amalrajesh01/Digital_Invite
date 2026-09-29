"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CircleCheck, Copy, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button, LinkButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Switch, TextField, Segmented, Checkbox } from "@/components/ui/Field";
import { useConfirm } from "@/components/ui/Confirm";
import { formatPriceRange } from "@/domain/packages/catalog";
import { FEATURES, FEATURE_KEYS, PACKAGE_RANK, type FeatureGroup, type FeatureKey, type PackageKey } from "@/domain/packages/features";
import { SECTION_META } from "@/domain/doc/sections";
import type { ReadinessIssue } from "@/domain/wedding/doc-tools";
import { newId } from "@/lib/id";
import { assignClientAction, publishAction, readinessAction, regenerateSectionsAction, setFeatureOverrideAction, unpublishAction } from "@/app/actions/wedding";
import { FormCard, Grid, Hint, LText, ListEditor } from "../forms";
import { DevicePreview, type Device } from "../DevicePreview";
import { useDraft } from "../draft";
import { Qr } from "@/invitation/engine/qr";

export interface PackageCard { key: PackageKey; name: string; tagline: string; blurb: string; priceMin: number; priceMax: number; hasClientDashboard: boolean }

export function PackageStep({ packages }: { packages: PackageCard[] }) {
  const { settings, updateSettings, role } = useDraft();
  const ask = useConfirm();
  const choose = async (p: PackageCard) => {
    if (p.key === settings.packageKey || role !== "admin") return;
    if (PACKAGE_RANK[p.key] < PACKAGE_RANK[settings.packageKey] && !(await ask({ title: `Move down to ${p.name}?`, message: "Features that are not part of this package will be hidden from the invitation and dashboard. Nothing is deleted.", confirmLabel: "Change package" }))) return;
    updateSettings({ packageKey: p.key });
    toast.success(`Package set to ${p.name}`);
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {packages.map((p) => {
          const on = p.key === settings.packageKey;
          const own = FEATURE_KEYS.filter((k) => FEATURES[k].tier === p.key);
          return (
            <button key={p.key} type="button" aria-pressed={on} onClick={() => void choose(p)} disabled={role !== "admin"} className={cn("relative flex flex-col rounded-lg border p-6 text-left transition-colors", on ? "border-accent bg-surface ring-1 ring-accent" : "border-rule-strong bg-surface hover:border-ink-2")}>
              {on && <span className="absolute right-4 top-4 grid size-6 place-items-center rounded-full bg-accent text-white"><Check className="size-4" /></span>}
              <span className="eyebrow">{p.tagline}</span>
              <span className="display mt-2 text-[34px]">{p.name}</span>
              <span className="display tnum text-[26px] text-accent">{formatPriceRange(p.priceMin, p.priceMax)}</span>
              <span className="mt-3 text-[14px] leading-relaxed text-muted">{p.blurb}</span>
              <ul className="mt-5 space-y-1.5 border-t border-rule pt-4 text-[13.5px]">
                {p.key !== "ESSENTIAL" && <li className="font-medium text-ink-2">Everything in {p.key === "SIGNATURE" ? "Essential" : "Signature"}, plus:</li>}
                {own.slice(0, 9).map((k) => (<li key={k} className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden />{FEATURES[k].label}</li>))}
                {own.length > 9 && <li className="pl-5 text-muted">…and {own.length - 9} more</li>}
              </ul>
              <span className="mt-4 text-[12.5px] text-muted">{p.hasClientDashboard ? "Includes a client dashboard" : "No client dashboard"}</span>
            </button>
          );
        })}
      </div>
      <FormCard title="Customer type" description="For your own records. Free portfolio weddings get exactly the same quality — they simply are not invoiced.">
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Customer type">
          {[["PAID", "Paying customer"], ["FREE_PORTFOLIO", "Free portfolio customer"]].map(([k, label]) => {
            const on = k === "FREE_PORTFOLIO" ? settings.customerClass === "FREE_PORTFOLIO" : settings.customerClass !== "FREE_PORTFOLIO";
            return (<button key={k} type="button" role="radio" aria-checked={on} disabled={role !== "admin"} onClick={() => updateSettings({ customerClass: k === "FREE_PORTFOLIO" ? "FREE_PORTFOLIO" : `PAID_${settings.packageKey}` })} className={cn("btn", on ? "btn-primary" : "btn-quiet")}>{label}</button>);
          })}
        </div>
      </FormCard>
    </div>
  );
}

export function FeaturesStep({ overrides, groupsOrder }: { overrides: Record<string, boolean>; groupsOrder: FeatureGroup[] }) {
  const { weddingId, features, settings } = useDraft();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [ov, setOv] = useState(overrides);
  const includedByPkg = (k: FeatureKey) => PACKAGE_RANK[FEATURES[k].tier] <= PACKAGE_RANK[settings.packageKey];
  const set = (k: FeatureKey, mode: "default" | "on" | "off") =>
    start(async () => {
      const r = await setFeatureOverrideAction(weddingId, k, mode);
      if (r.ok) {
        setOv((o) => { const n = { ...o }; if (mode === "default") delete n[k]; else n[k] = mode === "on"; return n; });
        router.refresh();
      } else toast.error(r.error.message);
    });
  return (
    <div className="space-y-6">
      <Hint>Features follow the package automatically. You can also grant a single feature to this wedding as a favour, or switch one off — without changing the package or its price. Guests never see anything that isn’t enabled here.</Hint>
      {groupsOrder.map((g) => {
        const keys = FEATURE_KEYS.filter((k) => FEATURES[k].group === g);
        if (!keys.length) return null;
        return (
          <FormCard key={g} title={g}>
            <ul className="divide-y divide-rule">
              {keys.map((k) => {
                const has = features.includes(k);
                const o = ov[k];
                const mode = o === undefined ? "default" : o ? "on" : "off";
                return (
                  <li key={k} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
                    <div className="min-w-0 flex-1"><p className="text-[15px] font-medium">{FEATURES[k].label}</p><p className="text-[13px] text-muted">{FEATURES[k].description}</p></div>
                    <Chip tone={has ? "ok" : "neutral"}>{has ? (mode === "on" ? "Granted" : "Included") : mode === "off" ? "Switched off" : `${FEATURES[k].tier.charAt(0)}${FEATURES[k].tier.slice(1).toLowerCase()}+`}</Chip>
                    <Segmented<"default" | "on" | "off"> label={`${FEATURES[k].label} override`} value={mode} onChange={(m) => set(k, m)} options={[{ value: "default", label: includedByPkg(k) ? "Package" : "Package (off)" }, { value: "on", label: "Grant" }, { value: "off", label: "Off" }]} />
                  </li>
                );
              })}
            </ul>
          </FormCard>
        );
      })}
      {pending && <p className="text-[13px] text-muted">Updating…</p>}
    </div>
  );
}

export function RsvpSetupStep({ guestCount }: { guestCount: number }) {
  const { doc, update, has, weddingId, role } = useDraft();
  const r = doc.rsvp;
  const set = <K extends keyof typeof r>(k: K, v: (typeof r)[K]) => update((d) => void (d.rsvp[k] = v));
  const base = role === "admin" ? `/admin/weddings/${weddingId}` : `/client/${weddingId}`;
  return (
    <div className="space-y-6">
      <FormCard title="How guests reply" description="Guests answer one friendly question first — ‘Will you be joining us?’ — then only the details you switch on below.">
        <Grid>
          <TextField label="Please reply by" type="date" value={r.deadline} onChange={(e) => set("deadline", e.target.value)} hint="After this day the form closes with a kind message." />
          <TextField label="WhatsApp number for replies (optional)" value={r.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value.replace(/[^\d+]/g, ""))} placeholder="919846000000" hint="Adds a ‘Reply on WhatsApp’ button with country code." />
        </Grid>
        <div className="grid gap-4 sm:grid-cols-2">
          <Switch label="Ask for meal preference" hint="Vegetarian, non-vegetarian, special diets…" checked={r.askMeal} onChange={(v) => set("askMeal", v)} disabled={!has("meal_preference")} />
          <Switch label="Let guests bring family" hint="Guests name who is coming with them." checked={r.allowCompanions} onChange={(v) => set("allowCompanions", v)} />
          <Switch label="Ask about accommodation" checked={r.askAccommodation} onChange={(v) => set("askAccommodation", v)} disabled={!has("accommodation")} />
          <Switch label="Ask about travel help / pickup" checked={r.askTransport} onChange={(v) => set("askTransport", v)} disabled={!has("transport")} />
          <Switch label="Ask which events each guest will join" hint="Useful for multi-day weddings." checked={r.askEventResponses} onChange={(v) => set("askEventResponses", v)} />
        </div>
        {r.askMeal && has("meal_preference") && (
          <div>
            <p className="mb-2 text-[13.5px] font-medium text-ink-2">Meal options</p>
            <ListEditor items={r.mealOptions} onChange={(items) => set("mealOptions", items)} keyOf={(m) => m.id} title={(m) => m.label.en || "Option"} make={() => ({ id: newId(), label: {} }) as never} addLabel="Add a meal option" defaultOpen render={(m, _i, up) => <LText label="Option" value={m.label} onChange={(v) => up({ label: v })} />} />
          </div>
        )}
        {r.askTransport && has("transport") && (
          <div>
            <p className="mb-2 text-[13.5px] font-medium text-ink-2">Pickup points</p>
            <ListEditor items={r.pickupLocations} onChange={(items) => set("pickupLocations", items)} keyOf={(m) => m.id} title={(m) => m.label.en || "Pickup point"} make={() => ({ id: newId(), label: {} }) as never} addLabel="Add a pickup point" defaultOpen render={(m, _i, up) => <LText label="Place" value={m.label} onChange={(v) => up({ label: v })} placeholder="Cochin Airport" />} />
          </div>
        )}
        <LText label="‘Thank you’ message after replying" multiline value={r.thankYou} onChange={(v) => set("thankYou", v)} hint="Use {name} for the guest’s name." />
      </FormCard>

      <FormCard title="Your guest list" description={has("guest_management") ? `${guestCount} guest${guestCount === 1 ? "" : "s"} so far. Add guests one by one or import a spreadsheet — each gets a private, personalised link.` : "Personal guest links and the guest list are part of the Signature package. Guests reply on the public invitation instead."}>
        {has("guest_management") ? <LinkButton href={`${base}/guests`} variant="quiet">Open the guest manager</LinkButton> : <Hint>With this package, RSVPs from the public link are collected for you automatically and appear in the Super Admin view.</Hint>}
      </FormCard>
    </div>
  );
}

const STEP_LABEL: Record<string, string> = { "couple.names": "Couple", date: "Events", "events.none": "Events", slug: "Couple", template: "Template", theme: "Theme", sections: "Edit", photos: "Media", gallery: "Media", music: "Music", "rsvp.deadline": "Guests", translations: "Couple", "events.venue": "Venue", "events.main": "Events" };

export function useReadiness() {
  const { weddingId, flush } = useDraft();
  const [issues, setIssues] = useState<ReadinessIssue[] | null>(null);
  const [busy, setBusy] = useState(false);
  const check = useCallback(async () => {
    setBusy(true);
    await flush();
    const r = await readinessAction(weddingId);
    if (r.ok) setIssues(r.data);
    else toast.error(r.error.message);
    setBusy(false);
  }, [weddingId, flush]);
  useEffect(() => void check(), [check]);
  return { issues, busy, check };
}

function IssueList({ issues, base }: { issues: ReadinessIssue[]; base: string }) {
  if (!issues.length) return <p className="flex items-center gap-2 text-[15px] text-ok"><CircleCheck className="size-5" />Everything looks ready.</p>;
  return (
    <ul className="divide-y divide-rule">
      {issues.map((i) => (
        <li key={i.code} className="flex items-start gap-3 py-3">
          {i.level === "error" ? <AlertTriangle className="mt-0.5 size-5 shrink-0 text-bad" aria-label="Must fix" /> : <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" aria-label="Should fix" />}
          <div className="min-w-0 flex-1"><p className="text-[15px]">{i.message}</p><p className="text-[12.5px] text-muted">{i.level === "error" ? "Must be fixed before publishing" : "Recommended"}</p></div>
          {i.step && <Link className="btn btn-quiet btn-sm" href={`${base}/setup/${i.step}`}>Fix in {STEP_LABEL[i.code] ?? i.step}</Link>}
        </li>
      ))}
    </ul>
  );
}

export function GenerateStep() {
  const { weddingId, settings, doc, role, flush } = useDraft();
  const base = role === "admin" ? `/admin/weddings/${weddingId}` : `/client/${weddingId}`;
  const { issues, busy, check } = useReadiness();
  const ask = useConfirm();
  const router = useRouter();
  const [pending, start] = useTransition();
  const enabled = doc.sections.filter((s) => s.enabled).length;
  const regenerate = async () => {
    if (!settings.templateId) return toast.error("Choose a template first.");
    if (!(await ask({ title: "Rebuild the layout from the template?", message: "Your names, events, photos and text stay exactly as they are. Only the section order, layouts and opening style go back to the template’s defaults.", confirmLabel: "Rebuild layout" }))) return;
    start(async () => {
      await flush();
      const r = await regenerateSectionsAction(weddingId, settings.templateId!);
      if (r.ok) { toast.success(`Layout rebuilt — ${r.data.sections} sections`); router.refresh(); void check(); } else toast.error(r.error.message);
    });
  };
  return (
    <div className="space-y-6">
      <FormCard title="Generate the invitation" description="The invitation is assembled from your template, theme, content and package. Before it goes live, here is what still needs attention." actions={<Button variant="quiet" size="sm" loading={busy} onClick={() => void check()}>Check again</Button>}>
        {issues ? <IssueList issues={issues} base={base} /> : <p className="text-muted">Checking…</p>}
      </FormCard>
      <FormCard title="Layout" description={`${enabled} section${enabled === 1 ? "" : "s"} are switched on. Sections appear in a fixed order you can change in the visual editor.`}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="quiet" icon={<Sparkles className="size-4" />} loading={pending} onClick={() => void regenerate()}>Rebuild layout from template</Button>
          <LinkButton href={`${base}/edit`} variant="primary">Open the visual editor</LinkButton>
        </div>
      </FormCard>
    </div>
  );
}

export function EditStep() {
  const { weddingId, doc, update, features, role } = useDraft();
  const base = role === "admin" ? `/admin/weddings/${weddingId}` : `/client/${weddingId}`;
  return (
    <div className="space-y-6">
      <FormCard title="Fine-tune in the visual editor" description="See your invitation on the left, edit on the right. Reorder sections, switch layouts, replace photographs, adjust colours — and check phone, tablet and desktop instantly.">
        <LinkButton href={`${base}/edit`} size="lg" variant="accent">Open the visual editor</LinkButton>
      </FormCard>
      <FormCard title="Sections at a glance" description="Switch sections on or off here. Sections not in this package are locked.">
        <ul className="grid gap-x-8 sm:grid-cols-2">
          {[...doc.sections].sort((a, b) => a.order - b.order).map((s) => {
            const meta = SECTION_META[s.type];
            const locked = !!meta.feature && !features.includes(meta.feature);
            return (
              <li key={s.id} className="border-b border-rule py-2.5">
                <Switch label={meta.label} hint={locked ? "Not in this package" : meta.description} checked={s.enabled && !locked} disabled={locked} onChange={(v) => update((d) => { const x = d.sections.find((y) => y.id === s.id); if (x) x.enabled = v; })} />
              </li>
            );
          })}
        </ul>
      </FormCard>
    </div>
  );
}

export function PreviewStep() {
  const { weddingId, flush, settings } = useDraft();
  const [device, setDevice] = useState<Device>("mobile");
  const [state, setState] = useState("PUBLISHED");
  const [guest, setGuest] = useState(false);
  const [lang, setLang] = useState(settings.defaultLocale);
  const [ready, setReady] = useState(false);
  useEffect(() => { void flush().then(() => setReady(true)); }, [flush]);
  const src = `/preview/${weddingId}?as=${state}${guest ? "&guest=1" : ""}&lang=${lang}`;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<Device> label="Device" value={device} onChange={setDevice} options={[{ value: "mobile", label: "Phone" }, { value: "tablet", label: "Tablet" }, { value: "desktop", label: "Desktop" }]} />
        <select aria-label="Lifecycle state" value={state} onChange={(e) => setState(e.target.value)} className="field-input !w-auto"><option value="PUBLISHED">Before the wedding</option><option value="LIVE_EVENT">On the wedding day</option><option value="POST_EVENT">Just after — thank you</option><option value="MEMORY">Memories</option><option value="ANNIVERSARY">Anniversary</option></select>
        <Checkbox label="See it as a personal guest" checked={guest} onChange={setGuest} />
        {settings.secondaryLocale && <Segmented label="Language" value={lang} onChange={setLang} options={[{ value: settings.defaultLocale, label: settings.defaultLocale.toUpperCase() }, { value: settings.secondaryLocale, label: settings.secondaryLocale.toUpperCase() }]} />}
        <a className="btn btn-quiet btn-sm ml-auto" href={src} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />Open in a new tab</a>
      </div>
      <div className="h-[calc(100dvh-16rem)] min-h-[34rem] rounded-lg bg-paper-2/70 p-3">{ready ? <DevicePreview src={src} device={device} /> : <p className="p-8 text-muted">Saving your latest changes…</p>}</div>
      <p className="text-[12.5px] text-muted">This is your draft, exactly as guests would see it. Tap the envelope to try the opening. Replies made here are not saved.</p>
    </div>
  );
}

export function PublishStep({ slug, appUrl, published, publishedVersion, status, clients }: { slug: string; appUrl: string; published: boolean; publishedVersion: number | null; status: string; clients: { id: string; name: string; email: string }[] }) {
  const { weddingId, role, has } = useDraft();
  const base = role === "admin" ? `/admin/weddings/${weddingId}` : `/client/${weddingId}`;
  const { issues, busy, check } = useReadiness();
  const ask = useConfirm();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [label, setLabel] = useState("");
  const [cname, setCname] = useState("");
  const [cemail, setCemail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const url = `${appUrl}/invite/${slug}`;
  const blockers = issues?.filter((i) => i.level === "error") ?? [];
  const isLive = published && !["DRAFT", "PREVIEW"].includes(status);

  const publish = async () => {
    if (!(await ask({ title: isLive ? "Publish your latest changes?" : "Publish this invitation?", message: `Guests will see this exact version at ${url}. Your draft stays editable and you can roll back any time.`, confirmLabel: "Publish" }))) return;
    start(async () => {
      const r = await publishAction(weddingId, label || undefined);
      if (r.ok) { toast.success(`Published — version ${r.data.version}`); router.refresh(); void check(); } else toast.error(r.error.message);
    });
  };

  return (
    <div className="space-y-6">
      <FormCard title={isLive ? "Live — publish updates" : "Publish"} description={isLive ? `Version ${publishedVersion} is live. Publish again to send your latest edits to guests.` : "One last look, then it is live."} actions={<Button variant="quiet" size="sm" loading={busy} onClick={() => void check()}>Check again</Button>}>
        {issues ? <IssueList issues={issues} base={base} /> : <p className="text-muted">Checking…</p>}
        <div className="flex flex-wrap items-end gap-3 border-t border-rule pt-5">
          <TextField label="Note for the version history (optional)" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Added the Malayalam text" className="min-w-64 flex-1" />
          <Button variant="accent" size="lg" loading={pending} disabled={blockers.length > 0 || role !== "admin"} onClick={() => void publish()}>{isLive ? "Publish updates" : "Publish invitation"}</Button>
        </div>
        {role !== "admin" && <p className="text-[13px] text-muted">Publishing is done by your invitation designer.</p>}
        {blockers.length > 0 && <p className="text-[13px] text-bad">Fix the items marked “Must be fixed” to publish.</p>}
      </FormCard>

      {isLive && (
        <FormCard title="Share it" description="Everyone can open the public link. Personal links for each guest are in the guest manager.">
          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md border border-rule-strong bg-paper px-4 py-3"><code className="flex-1 truncate text-[14px]">{url}</code><Button size="sm" variant="quiet" icon={<Copy className="size-4" />} onClick={() => { void navigator.clipboard.writeText(url); toast.success("Link copied"); }}>Copy</Button></div>
              <div className="flex flex-wrap gap-2"><a className="btn btn-quiet btn-sm" href={`https://wa.me/?text=${encodeURIComponent(`You are invited! ${url}`)}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a><a className="btn btn-quiet btn-sm" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />Open live invitation</a>{has("guest_management") && <LinkButton size="sm" variant="quiet" href={`${base}/guests`}>Personal guest links</LinkButton>}</div>
            </div>
            <Qr text={url} size={132} className="rounded bg-white p-2 ring-1 ring-rule" label="QR code for the invitation" />
          </div>
          {role === "admin" && (
            <Button variant="ghost" size="sm" className="text-bad" onClick={async () => { if (await ask({ title: "Take the invitation offline?", message: "Guests will see a ‘not live yet’ page. Nothing is deleted.", confirmLabel: "Unpublish", tone: "danger" })) start(async () => { const r = await unpublishAction(weddingId); if (r.ok) { toast.success("Unpublished"); router.refresh(); } else toast.error(r.error.message); }); }}>Unpublish</Button>
          )}
        </FormCard>
      )}

      {role === "admin" && has("client_dashboard") && (
        <FormCard title="Client dashboard" description="Give the couple their own dashboard to manage guests, replies, wishes and photos.">
          {clients.length > 0 && <ul className="divide-y divide-rule">{clients.map((c) => (<li key={c.id} className="flex items-center justify-between py-2.5 text-[14.5px]"><span>{c.name || c.email}<span className="ml-2 text-muted">{c.email}</span></span><Chip tone="ok">Has access</Chip></li>))}</ul>}
          <Grid><TextField label="Client name" value={cname} onChange={(e) => setCname(e.target.value)} /><TextField label="Client email" type="email" value={cemail} onChange={(e) => setCemail(e.target.value)} /></Grid>
          <div className="flex flex-wrap items-center gap-3"><Button variant="quiet" loading={pending} disabled={!cname || !cemail} onClick={() => start(async () => { const r = await assignClientAction(weddingId, { name: cname, email: cemail }); if (r.ok) { setLink(r.data.link); toast.success("Client added — sign-in link ready"); router.refresh(); } else toast.error(r.error.message); })}>Give access & create sign-in link</Button></div>
          {link && <p className="break-all rounded-md bg-paper-2 p-3 text-[13px]"><span className="eyebrow mb-1 block">One-time sign-in link (30 minutes) — send it to the client</span><a className="underline" href={link}>{link}</a></p>}
        </FormCard>
      )}
    </div>
  );
}
