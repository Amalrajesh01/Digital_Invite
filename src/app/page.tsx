import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { brand } from "@/lib/brand";
import { env } from "@/lib/env";
import { listPackages } from "@/domain/packages/service";
import { PACKAGE_DEFAULTS } from "@/domain/packages/catalog";

export const metadata: Metadata = {
  title: `${brand.name} — digital wedding invitations that become keepsakes`,
  description: "A wedding invitation your guests open like an envelope, RSVP to in seconds, and keep for a lifetime — in English and your family’s language.",
  metadataBase: new URL(env.appUrl),
};
export const dynamic = "force-dynamic";

const DEMO = "/invite/meenakshi-and-aravind";

const HIGHLIGHTS: Record<string, string[]> = {
  ESSENTIAL: ["Opening animation, story, events and venue", "Photo gallery and background music", "One shareable link, RSVP and WhatsApp sharing", "English + one local language"],
  SIGNATURE: ["Everything in Essential", "Personal link for every guest, with their name", "Guest dashboard for you: RSVPs, meals, wishes", "Guests share photos, video and voice wishes", "Guestbook, accommodation and transport help"],
  LUXURY: ["Everything in Signature", "QR pass for each guest and fast check-in", "Live event mode and a projector photo wall", "Games, quiz and a time capsule for the couple", "Anniversary memories, kept for life"],
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const price = (a: number, b: number) => (a === b ? inr(a) : `${inr(a)} – ${inr(b)}`);

async function loadPackages() {
  try {
    const rows = (await listPackages()).filter((p) => p.active);
    if (rows.length) return rows.map((p) => ({ key: p.key as string, name: p.name, tagline: p.tagline, min: p.priceMin, max: p.priceMax }));
  } catch {
    /* fall through to the seed values so the page never breaks */
  }
  return PACKAGE_DEFAULTS.map((p) => ({ key: p.key as string, name: p.name, tagline: p.tagline, min: p.priceMin, max: p.priceMax }));
}

export default async function Home() {
  const packages = await loadPackages();
  return (
    <div className="bg-paper text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">Skip to content</a>
      <header className="mx-auto flex max-w-[76rem] items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="display text-[30px] leading-none">{brand.short}<span className="ml-1.5 text-[15px] not-italic text-muted" style={{ fontFamily: "var(--font-ui)" }}>Invites</span></Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-[14.5px]">
          <a href="#packages" className="btn btn-ghost btn-sm hidden sm:inline-flex">Packages</a>
          <a href="#how" className="btn btn-ghost btn-sm hidden sm:inline-flex">How it works</a>
          <Link href="/login" className="btn btn-quiet btn-sm">Sign in</Link>
        </nav>
      </header>

      <main id="main">
        <section className="mx-auto grid max-w-[76rem] items-center gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-28 lg:pt-14">
          <div>
            <p className="eyebrow">{brand.tagline}</p>
            <h1 className="display mt-5 text-[clamp(44px,7vw,84px)] leading-[0.98]">The invitation your guests <em className="not-italic text-accent">keep</em>.</h1>
            <p className="lede mt-6 max-w-xl">A wedding invitation that opens like an envelope, greets every guest by name, gathers RSVPs and photographs on the day — and quietly becomes the family’s memory book. In English and in Malayalam, or the language your family speaks.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={DEMO} className="btn btn-accent btn-lg">See a real invitation <ArrowRight className="size-4" aria-hidden /></Link>
              <a href="#packages" className="btn btn-quiet btn-lg">Packages & prices</a>
            </div>
            <p className="mt-6 text-[13.5px] text-muted">Tap the demo to open it — the couple is fictional, the experience is exactly what your guests would see.</p>
          </div>

          <div className="relative mx-auto w-full max-w-[22rem]">
            <div aria-hidden className="absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_50%_30%,var(--brass-soft),transparent_70%)]" />
            <div className="rounded-[2.6rem] border-[9px] border-ink bg-ink shadow-[0_40px_80px_-30px_rgba(28,26,23,.55)]">
              <iframe title="Live demo of a Aoire invitation" src={DEMO} loading="lazy" className="block aspect-[9/19] w-full rounded-[1.9rem] bg-paper" />
            </div>
          </div>
        </section>

        <section id="how" className="border-y border-rule-strong bg-paper-2/60">
          <div className="mx-auto grid max-w-[76rem] gap-10 px-5 py-16 sm:px-8 md:grid-cols-3 md:gap-12 lg:py-20">
            {[
              ["Invite", "A cinematic opening, your story, every ceremony with its own time and venue, directions in one tap, and RSVPs that reach you the moment guests reply."],
              ["Experience", "On the day guests scan a QR pass, see live updates and share photographs to a screen at the venue. Quizzes and games keep the family laughing."],
              ["Remember", "Afterwards the same link turns into a gallery, a guestbook and a time capsule that opens on a date you choose — and returns every anniversary."],
            ].map(([t, b], i) => (
              <article key={t}>
                <p className="display tnum text-[52px] leading-none text-brass" aria-hidden>{String(i + 1).padStart(2, "0")}</p>
                <h2 className="display mt-3 text-[34px]">{t}</h2>
                <p className="mt-2 text-[15.5px] text-ink-2">{b}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-[76rem] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="eyebrow">In your family’s language</p>
            <h2 className="display mt-4 text-[clamp(34px,4.6vw,56px)]">One tap, and it speaks Malayalam.</h2>
            <p className="lede mt-5">Every button, heading and message switches — not just the names. We write the Malayalam with you, set it in a typeface made for the script, and your guests choose the language they are comfortable in. Another language — Tamil, Telugu, Kannada, Hindi, Marathi — can be added for your wedding with its own wording.</p>
          </div>
          <div className="rounded-lg border border-rule-strong bg-surface p-8 sm:p-10" lang="ml">
            <p className="text-[13px] uppercase tracking-[0.2em] text-muted" lang="en">Sample</p>
            <p className="mt-5 text-[34px] leading-[1.5]" style={{ fontFamily: "'Noto Serif Malayalam', var(--font-display), serif" }}>മീനാക്ഷി &amp; അരവിന്ദ്</p>
            <p className="mt-3 text-[20px] leading-[1.9] text-ink-2" style={{ fontFamily: "'Noto Serif Malayalam', serif" }}>ഞങ്ങളുടെ വിവാഹത്തിൽ പങ്കെടുത്ത് അനുഗ്രഹിക്കാൻ സ്നേഹപൂർവ്വം ക്ഷണിക്കുന്നു.</p>
          </div>
        </section>

        <section id="packages" className="border-t border-rule-strong bg-paper-2/60">
          <div className="mx-auto max-w-[76rem] px-5 py-20 sm:px-8 lg:py-28">
            <p className="eyebrow">Packages</p>
            <h2 className="display mt-4 max-w-2xl text-[clamp(34px,4.6vw,56px)]">One engine. Three ways to celebrate.</h2>
            <p className="lede mt-4 max-w-2xl">Every package is the same premium invitation. You choose how much of the experience you want around it.</p>
            <ul className="mt-12 grid gap-6 lg:grid-cols-3">
              {packages.map((p) => (
                <li key={p.key} className={`flex flex-col rounded-lg border bg-surface p-8 ${p.key === "SIGNATURE" ? "border-accent shadow-[0_24px_60px_-30px_rgba(122,36,50,.45)]" : "border-rule-strong"}`}>
                  {p.key === "SIGNATURE" && <p className="eyebrow !text-accent">Most chosen</p>}
                  <h3 className="display text-[36px]">{p.name}</h3>
                  <p className="mt-1 text-[14px] text-muted">{p.tagline}</p>
                  <p className="display tnum mt-6 text-[40px] leading-none">{price(p.min, p.max)}</p>
                  <p className="mt-1 text-[13px] text-muted">per wedding · one-time</p>
                  <ul className="mb-8 mt-6 space-y-3 text-[15px]">
                    {(HIGHLIGHTS[p.key] ?? []).map((h) => (<li key={h} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden /><span>{h}</span></li>))}
                  </ul>
                  <a href={`mailto:${brand.supportEmail}?subject=${encodeURIComponent(`${p.name} wedding invitation`)}`} className={`btn btn-lg mt-auto ${p.key === "SIGNATURE" ? "btn-accent" : "btn-quiet"}`}>Ask about {p.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-[76rem] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="display text-[clamp(30px,4vw,46px)]">Made for families, not for developers.</h2>
          <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {[
              ["Do my guests need an app or an account?", "No. They open a link on their phone. Personal links carry their name; nothing to install, nothing to remember."],
              ["Will it work for elders and slow phones?", "Yes. Large readable text, high contrast, a light page weight and no dependence on fast internet."],
              ["Who controls what guests see?", "You do. Photos and wishes are reviewed before they appear, and each ceremony can be shown only to the guests you choose."],
              ["Is our guests’ information safe?", "Phone numbers and notes never reach a guest’s browser, links cannot be guessed, and analytics never record who someone is."],
              ["What happens after the wedding?", "The invitation becomes your gallery and memory book. Photographs and messages are kept permanently — they are never auto-deleted."],
              ["Can I change things after publishing?", "Anytime. Every publish is saved as a version, so you can go back to any earlier one in a click."],
            ].map(([q, a]) => (
              <div key={q}><dt className="display text-[24px]">{q}</dt><dd className="mt-1.5 text-[15.5px] text-ink-2">{a}</dd></div>
            ))}
          </dl>
        </section>

        <section className="bg-ink text-paper">
          <div className="mx-auto max-w-[76rem] px-5 py-20 text-center sm:px-8">
            <h2 className="display text-[clamp(34px,5vw,60px)]">Let’s make yours.</h2>
            <p className="mx-auto mt-4 max-w-xl text-paper/75">Tell us about the wedding and we will send a private preview with your names on it.</p>
            <a href={`mailto:${brand.supportEmail}?subject=${encodeURIComponent("I’d like a wedding invitation")}`} className="btn btn-accent btn-lg mt-8">Write to us</a>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-4 px-5 py-8 text-[13.5px] text-muted sm:px-8">
        <p>© {new Date().getFullYear()} {brand.name}</p>
        <p><a className="underline underline-offset-4" href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> · <Link className="underline underline-offset-4" href="/login">Sign in</Link></p>
      </footer>
    </div>
  );
}
