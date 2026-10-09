import Link from "next/link";
import { ArrowRight, CalendarCheck, Globe2, Images, MailOpen, MapPin, QrCode, Users } from "lucide-react";
import { brand } from "@/lib/brand";
import { companyLink } from "@/lib/site";
import { WA } from "@/lib/whatsapp";
import { pageMetadata } from "@/lib/seo";
import { CATEGORIES } from "@/domain/catalogue/categories";
import { DEMOS, demoBySlug, demosIn } from "@/domain/catalogue/demos";
import { loadPublicPackages } from "@/domain/catalogue/pricing";
import { SiteImage } from "@/components/site/SiteImage";
import { SiteButton, WaButton } from "@/components/site/WaButton";
import { CategoryCard, FaqList, FinalCta, HOW_IT_WORKS, Heading, PackageCards, Section, Steps, TemplateCard, Wrap, templatePath } from "@/components/site/blocks";
import { FAQ_HOME } from "@/domain/catalogue/faq";
import { JsonLd, faqLd } from "@/lib/jsonld";

export const metadata = pageMetadata({
  path: "/",
  title: `${brand.name} — digital invitations for every occasion`,
  absoluteTitle: true,
  description: "Beautiful digital invitations, crafted for moments that matter: weddings, birthdays, engagements, anniversaries, corporate events and remembrance. Choose a template and we make it yours.",
});
export const dynamic = "force-dynamic";

/** The three phones of the hero: a wedding, a milestone birthday and a conclave — each a real, published sample. */
const HERO_PHONES = ["tara-and-nikhil", "isha-and-daniel", "leadership-conclave-2026"] as const;
const FEATURED = ["ananya-and-arjun", "isha-and-daniel", "meera-turns-thirty", "tara-and-nikhil", "leadership-conclave-2026", "thomas-mathew-memorial"] as const;
const SHOWN_CATEGORIES = ["wedding", "engagement", "birthday", "anniversary", "corporate", "naming-ceremony", "funeral", "private-party"] as const;

const WHAT_GUESTS_GET = [
  { icon: MailOpen, title: "It opens like an envelope", body: "A wax-sealed envelope with your names and date, then the invitation itself — no app, no download, just a link." },
  { icon: Globe2, title: "In your family’s language", body: "Guests switch between English and a local language, such as Malayalam, in one tap — and we set it in a typeface made for the script." },
  { icon: CalendarCheck, title: "Replies in seconds", body: "Yes, no or maybe — with meals, a place to stay and a ride from the station — all counted for you in one place." },
  { icon: MapPin, title: "Everything about the day", body: "Every event with its time and place, a map, parking, hotels and directions, so nobody has to message you to ask." },
  { icon: Images, title: "Wishes and photographs", body: "Guests leave wishes and share photographs, which appear once you have approved them — and stay as a keepsake." },
  { icon: QrCode, title: "On the day itself", body: "A QR pass for each guest, live updates, a projector photo wall and games — for the occasions that want them." },
];

export default async function Home() {
  const packages = await loadPublicPackages();
  const phones = HERO_PHONES.map((s) => demoBySlug(s)).filter((d): d is NonNullable<typeof d> => !!d);
  const featured = FEATURED.map((s) => demoBySlug(s)).filter((d): d is NonNullable<typeof d> => !!d);
  const cats = SHOWN_CATEGORIES.map((s) => CATEGORIES.find((c) => c.slug === s)).filter((c): c is NonNullable<typeof c> => !!c);
  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[radial-gradient(90%_70%_at_85%_0%,#e8eefc,transparent_60%),linear-gradient(180deg,#fbfaf7,#ffffff)]">
        <Wrap className="grid items-center gap-14 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-20">
          <div>
            <p className="eyebrow !text-accent">{brand.name}</p>
            <h1 className="mt-5 font-serif text-[clamp(46px,7.4vw,92px)] font-medium leading-[0.98] tracking-[-0.015em] text-ink">
              Your story deserves more than a <em className="font-medium italic text-accent">card.</em>
            </h1>
            <p className="mt-6 max-w-md text-balance text-[clamp(18px,2vw,21px)] leading-relaxed text-ink-2/85">Beautiful digital invitations, crafted for moments that matter.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <SiteButton href="/templates">Explore Templates <ArrowRight className="size-4" aria-hidden /></SiteButton>
              <WaButton message={WA.general} variant="outline">Talk to us on WhatsApp</WaButton>
            </div>
            <p className="mt-7 max-w-lg text-[14.5px] leading-relaxed text-muted">Weddings · Engagements · Birthdays · Anniversaries · Naming ceremonies · Corporate events · Remembrance — each designed for its occasion, none of them a template with the names swapped.</p>
          </div>
          <div className="relative mx-auto h-[26rem] w-full max-w-[34rem] sm:h-[33rem]">
            <div aria-hidden className="absolute inset-x-6 bottom-6 top-10 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_50%_30%,#dfe7fb,transparent_70%)]" />
            {phones.map((d, i) => (
              <Link
                key={d.slug}
                href={templatePath(d)}
                aria-label={`${d.title} — ${d.name}`}
                className="absolute w-[37%] rounded-[1.9rem] border-[6px] border-ink bg-ink shadow-[0_40px_70px_-30px_rgba(11,27,53,.6)] transition-transform duration-500 hover:z-30 hover:-translate-y-2 sm:rounded-[2.2rem] sm:border-[7px]"
                style={[
                  { left: "1%", top: "14%", transform: "rotate(-5deg)", zIndex: 10 },
                  { left: "31.5%", top: "0%", width: "40%", zIndex: 20 },
                  { right: "1%", top: "17%", transform: "rotate(5deg)", zIndex: 10 },
                ][i]}
              >
                <SiteImage id={d.cover} ratio="9:19" priority={i === 1} sizes="(max-width: 640px) 40vw, 230px" rounded={false} className="rounded-[1.4rem] sm:rounded-[1.7rem]" />
                <span className="absolute inset-x-0 bottom-0 rounded-b-[1.4rem] bg-gradient-to-t from-black/75 via-black/30 to-transparent px-2 pb-3 pt-12 text-center text-white sm:rounded-b-[1.7rem]">
                  <span className="block font-serif text-[16px] leading-tight sm:text-[19px]">{d.name}</span>
                  <span className="mt-0.5 block text-[9px] uppercase tracking-[0.12em] text-white/80 sm:text-[10.5px]">{d.title}</span>
                </span>
              </Link>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ── occasions ────────────────────────────────────────────────── */}
      <Section tone="white">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading eyebrow="Every occasion" title="An invitation designed for the day it is for." lede="A conclave and a children’s birthday should not feel the same. Each occasion has its own opening, its own sections and its own tone — and a memorial has no confetti at all." />
          <Link href="/categories" className="btn btn-quiet">All occasions <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {cats.map((c) => (
            <li key={c.slug}><CategoryCard category={c} count={demosIn(c.slug).length} /></li>
          ))}
        </ul>
      </Section>

      {/* ── featured templates ───────────────────────────────────────── */}
      <Section tone="paper">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading eyebrow="Templates" title="Open one, the way your guests will." lede="Every sample is a real, published invitation with fictional names. Tap one to see it open." />
          <Link href="/templates" className="btn btn-quiet">Browse all {DEMOS.length} templates <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((d, i) => (
            <li key={d.slug}><TemplateCard demo={d} priority={i < 3} /></li>
          ))}
        </ul>
      </Section>

      {/* ── what guests get ──────────────────────────────────────────── */}
      <Section tone="white">
        <Heading eyebrow="What your guests experience" title="Beautiful to open. Easy to answer." lede="Nothing to install, nothing to remember. Elders, cousins and colleagues open the same link on whatever phone they have." align="center" />
        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {WHAT_GUESTS_GET.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Icon className="size-5" aria-hidden /></span>
              <div>
                <h3 className="text-[18px] font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink-2/80">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── how it works ─────────────────────────────────────────────── */}
      <Section tone="ink">
        <Heading dark eyebrow="How it works" title="From a link you like to a link you share." lede="You do not need to design anything. Choose, tell us the details, and we do the rest." />
        <div className="mt-14"><Steps items={HOW_IT_WORKS} dark /></div>
        <div className="mt-12"><SiteButton href="/how-it-works" variant="light">See the process <ArrowRight className="size-4" aria-hidden /></SiteButton></div>
      </Section>

      {/* ── pricing ──────────────────────────────────────────────────── */}
      <Section tone="paper" id="pricing">
        <Heading eyebrow="Pricing" title="One engine. Three ways to celebrate." lede="Every package is the same premium invitation. You choose how much of the experience you want around it." />
        <PackageCards packages={packages} compact />
        <p className="mt-8 text-[14.5px] text-muted">Prices are in Indian rupees, one-time per invitation. Planning a conference, a conclave or a large gathering? <Link href="/pricing" className="text-accent underline underline-offset-4">See what each package includes</Link> or tell us what you need and we will quote it.</p>
      </Section>

      {/* ── by Stack Bridge Labs ─────────────────────────────────────── */}
      <Section tone="white">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <Heading eyebrow={`A product of ${brand.company}`} title="Built by a software company, made with care." lede={`${brand.company} designs and builds websites, apps, WhatsApp automation and AI solutions. Invites is the part of that work you can hold in your hand — a product we build, run and look after ourselves, so there is one team behind every invitation.`} />
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a href={companyLink()} className="btn btn-quiet btn-lg">Visit {brand.company} <ArrowRight className="size-4" aria-hidden /></a>
            <a href={companyLink("/services/all-solutions")} className="btn btn-ghost btn-lg">Our services</a>
          </div>
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <Section tone="paper">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Heading eyebrow="Questions" title="Made for families, not for developers." />
            <Link href="/faq" className="btn btn-quiet mt-8"><Users className="size-4" aria-hidden /> All questions</Link>
          </div>
          <FaqList items={FAQ_HOME} />
        </div>
        <JsonLd data={faqLd(FAQ_HOME)} />
      </Section>

      <FinalCta title="Let’s make yours." body="Tell us about the occasion and we will send a private preview, with your names on it." message={WA.general} primary={{ href: "/templates", label: "Explore templates" }} />
    </>
  );
}
