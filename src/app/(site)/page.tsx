import Link from "next/link";
import { ArrowRight, CalendarCheck, Globe2, Heart, Images, MailOpen, MapPin, QrCode } from "lucide-react";
import { brand } from "@/lib/brand";
import { companyLink } from "@/lib/site";
import { WA } from "@/lib/whatsapp";
import { pageMetadata } from "@/lib/seo";
import { categoryBySlug } from "@/domain/catalogue/categories";
import { SITE_TEMPLATES, TAG_LABELS, siteTemplateBySlug, templatesIn } from "@/domain/catalogue/templates";
import { inr, loadPublicPackages } from "@/domain/catalogue/pricing";
import { giftPriceText } from "@/domain/gifts/pricing";
import { FallbackImg } from "@/components/site/FallbackImg";
import { SiteButton, WaButton } from "@/components/site/WaButton";
import { FiveWays, type WayGroup } from "@/components/site/FiveWays";
import { PortfolioWall } from "@/components/site/PortfolioWall";
import { listPublicPortfolio } from "@/domain/portfolio/service";
import { TemplateDiscovery, type DiscoveryItem } from "@/components/site/TemplateDiscovery";
import { CategoryCard, FaqList, FinalCta, HOW_IT_WORKS, Heading, LovePriceCard, PackageCards, Section, Steps, Wrap } from "@/components/site/blocks";
import { FAQ_HOME } from "@/domain/catalogue/faq";
import { JsonLd, faqLd } from "@/lib/jsonld";

export const metadata = pageMetadata({
  path: "/",
  title: `${brand.name} — digital invitations and love gifts for every celebration`,
  absoluteTitle: true,
  description: "Beautiful digital invitations for weddings, birthdays, housewarmings, naming ceremonies and more — and private love gifts. Opens like an envelope, shared on WhatsApp, in English and your family’s language.",
});
export const dynamic = "force-dynamic";

/** The three phones of the hero: three occasions, three different feelings. */
const HERO_PHONES = ["royal-heritage", "garden-party", "sangeet-night"] as const;
const SHOWN_CATEGORIES = ["wedding", "engagement", "birthday", "housewarming", "naming-ceremony", "anniversary"] as const;
const WAYS = ["wedding", "engagement", "birthday", "anniversary", "housewarming", "naming-ceremony", "religious", "corporate", "conference", "funeral"] as const;
const WAYS_LINE: Record<string, string> = {
  wedding: "Royal, minimal, cinematic, floral or full of fun — the same wedding, five ways to begin it.",
  engagement: "From a lamp-lit ring ceremony to pop-the-balloons — choose the mood of your yes.",
  birthday: "A black-tie night, a children’s party, a garden lunch — each opens and feels different.",
  anniversary: "Twenty-five years as a film, a rose garden, or a night out. Pick how you want to remember.",
  housewarming: "Open the doors to your new home — as a blessing, a story or a party.",
  "naming-ceremony": "Gentle ways to welcome a little one, each with the rituals explained.",
  religious: "Pujas, festivals and community celebrations, with every rite made easy to follow.",
  corporate: "From a formal gala to a team party — registration and the programme up front.",
  conference: "Summits, forums and meetups: speakers, sessions and partners, clearly laid out.",
  funeral: "Dignified and quiet. The service, the place, the family’s words — and no effects at all.",
};

const WHAT_GUESTS_GET = [
  { icon: MailOpen, title: "Opens like an envelope", body: "A little scene opens first — a lamp, a door, a flower — then the invitation. No app, no download." },
  { icon: Globe2, title: "In your family’s language", body: "Write it in English, Malayalam or any language you speak." },
  { icon: CalendarCheck, title: "Replies in seconds", body: "Yes, no or maybe — with food choices and a ride from the station — counted for you." },
  { icon: MapPin, title: "Everything about the day", body: "Each event with its time and place, a map, parking and directions. No one has to message you to ask." },
  { icon: Images, title: "Wishes and photographs", body: "Guests leave wishes and share photographs, which appear once you approve them." },
  { icon: QrCode, title: "On the day itself", body: "A QR pass for every guest, live updates and a photo wall for the venue screen." },
];

export default async function Home() {
  const [packages, work] = await Promise.all([loadPublicPackages(), listPublicPortfolio(6).catch(() => [])]);
  const phones = HERO_PHONES.map((s) => siteTemplateBySlug(s)).filter((t): t is NonNullable<typeof t> => !!t);
  const cats = SHOWN_CATEGORIES.map((s) => categoryBySlug(s)).filter((c): c is NonNullable<typeof c> => !!c);
  const groups: WayGroup[] = WAYS.map((slug) => {
    const c = categoryBySlug(slug)!;
    return { slug, name: c.name, line: WAYS_LINE[slug] ?? c.blurb, designs: templatesIn(slug).filter((t) => !t.edition).map((t) => ({ slug: t.slug, name: t.name, styleLabel: t.styleLabel, thumb: t.thumb, path: t.path, colors: t.theme.colors })) };
  });
  const love = SITE_TEMPLATES.filter((t) => t.love);
  // the whole library, straight from the registry: nothing here is a list of names
  const library = SITE_TEMPLATES.filter((t) => !t.love);
  const discover: DiscoveryItem[] = library.map((t) => ({ slug: t.slug, name: t.name, tagline: t.tagline, styleLabel: t.styleLabel, category: t.category, categoryName: categoryBySlug(t.category)?.name ?? t.category, thumb: t.thumb, path: t.path, colors: t.theme.colors, tags: t.tags, featured: t.featured }));
  const occasions = [...new Set(library.map((t) => t.category))].map((slug) => ({ slug, name: categoryBySlug(slug)?.name ?? slug }));
  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[radial-gradient(90%_70%_at_88%_0%,#fde7c4,transparent_60%),radial-gradient(70%_60%_at_0%_100%,#f8e1e6,transparent_60%),linear-gradient(180deg,#fbf7f0,#ffffff)]">
        <Wrap className="grid items-center gap-10 pb-16 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-6 lg:pb-24 lg:pt-16">
          <div>
            <p className="eyebrow">Digital invitations for every celebration</p>
            <h1 className="mt-5 font-serif text-[clamp(48px,7.6vw,96px)] font-medium leading-[0.96] tracking-[-0.018em] text-ink">
              Your celebration, <em className="font-medium italic text-accent">beautifully</em> shared.
            </h1>
            <p className="mt-6 max-w-lg text-balance text-[clamp(18px,2vw,21px)] leading-relaxed text-ink-2/85">
              An invitation that opens like an envelope, speaks your family’s language and reaches everyone on WhatsApp. For weddings, birthdays, housewarmings and every moment that matters.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <SiteButton href="/templates" data-track="cta_click" data-ref="hero-choose">Choose Your Design <ArrowRight className="size-4" aria-hidden /></SiteButton>
              <WaButton message={WA.general} variant="outline" trackRef="hero">Chat on WhatsApp</WaButton>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14.5px] text-ink-2/80">
              {["Nothing to install", "English, Malayalam and more", "You see it before anyone else"].map((t) => (<li key={t} className="flex items-center gap-2"><span aria-hidden className="size-1.5 rounded-full bg-marigold" /> {t}</li>))}
            </ul>
          </div>
          <div className="relative mx-auto h-[26rem] w-full max-w-[34rem] sm:h-[34rem]">
            <div aria-hidden className="absolute inset-x-6 bottom-4 top-10 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_50%_30%,#fde1b0,transparent_70%)]" />
            {phones.map((t, i) => (
              <Link
                key={t.slug}
                href={t.path}
                aria-label={`${t.name} — ${t.styleLabel}`}
                data-track="cta_click"
                data-ref={`hero-phone-${t.slug}`}
                className="absolute w-[38%] overflow-hidden rounded-[1.9rem] border-[6px] border-ink bg-paper-2 shadow-[0_40px_70px_-30px_rgba(23,20,31,.6)] transition-transform duration-500 hover:z-30 hover:-translate-y-2 sm:rounded-[2.2rem] sm:border-[7px]"
                style={[{ left: "0%", top: "14%", transform: "rotate(-5deg)", zIndex: 10 }, { left: "30.5%", top: "0%", width: "41%", zIndex: 20 }, { right: "0%", top: "17%", transform: "rotate(5deg)", zIndex: 10 }][i]}
              >
                <div className="relative aspect-[9/19]"><FallbackImg src={t.thumb} alt={`The ${t.name} invitation`} width={540} height={1140} loading={i === 1 ? "eager" : "lazy"} fetchPriority={i === 1 ? "high" : undefined} className="absolute inset-0 size-full object-cover object-top" /></div>
              </Link>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ── the whole library ────────────────────────────────────────── */}
      <section id="designs" className="bg-white py-16 sm:py-20 lg:py-24">
        <Wrap><Heading eyebrow="Our templates" title="Find the Beginning of Your Forever" lede="Explore cinematic invitations designed to tell your story beautifully." align="center" /></Wrap>
        <Wrap className="mt-12"><TemplateDiscovery items={discover} occasions={occasions} tagLabels={TAG_LABELS} initialOccasion={occasions.some((o) => o.slug === "wedding") ? "wedding" : ""} /></Wrap>
      </section>

      {/* ── our work: only ever the studio's published, approved items ── */}
      {work.length > 0 && (
        <Section tone="paper">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Heading eyebrow="Our work" title="Stories We’ve Brought to Life" lede="A few of the invitations we have made, and the people they were made for." />
            <Link href="/portfolio" className="btn btn-quiet" data-track="cta_click" data-ref="home-all-work">All our work <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          <div className="mt-10"><PortfolioWall items={work} /></div>
        </Section>
      )}

      {/* ── occasions ────────────────────────────────────────────────── */}
      <Section tone="white">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading eyebrow="What are you celebrating?" title="Every occasion has its own look." lede="A housewarming and a wedding should not feel the same. Each one has its own designs, its own opening and its own words." />
          <Link href="/categories" className="btn btn-quiet" data-track="cta_click" data-ref="home-all-occasions">All occasions <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {cats.map((c) => (<li key={c.slug}><CategoryCard category={c} count={templatesIn(c.slug).filter((t) => !t.edition).length} /></li>))}
        </ul>
      </Section>

      {/* ── five ways ────────────────────────────────────────────────── */}
      <Section tone="paper">
        <Heading eyebrow="Five designs for every occasion" title="Same celebration. Five different feelings." lede="Look at them side by side. They open differently, are laid out differently and move differently — they are not the same page in new colours." />
        <div className="mt-10"><FiveWays groups={groups} /></div>
      </Section>

      {/* ── how it works ─────────────────────────────────────────────── */}
      <Section tone="white">
        <Heading eyebrow="How it works" title="From a design you like to a link you share." lede="You do not design anything. Choose, tell us the details, and we do the rest." />
        <div className="mt-14"><Steps items={HOW_IT_WORKS} /></div>
        <div className="mt-12 flex flex-wrap gap-3">
          <SiteButton href="/templates" data-track="cta_click" data-ref="how-choose">Choose Your Design <ArrowRight className="size-4" aria-hidden /></SiteButton>
          <SiteButton href="/how-it-works" variant="quiet">See the whole process</SiteButton>
        </div>
      </Section>

      {/* ── for my love ──────────────────────────────────────────────── */}
      <Section tone="night">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="eyebrow !text-[#f3a5b6]"><Heart className="mr-1.5 inline size-3.5 fill-current" aria-hidden />For My Love</p>
            <h2 className="mt-3 font-serif text-[clamp(38px,5.2vw,64px)] font-medium leading-[1.02] text-white">Some things are too personal for a card.</h2>
            <p className="mt-5 max-w-lg text-[18px] leading-relaxed text-white/75">Make a private gift for the person you love: a birthday surprise, a love letter, an anniversary story — or a sincere apology. Your photographs, your words, your song, on a link only they can open.</p>
            <ul className="mt-6 grid gap-2.5 text-[15.5px] text-white/80">
              {["Five ways to unfold it, each different", "Private by design — pause or delete it any time", "Nothing is ever asked of them. No pressure, no tricks."].map((t) => (<li key={t} className="flex gap-3"><Heart className="mt-1 size-4 shrink-0 fill-[#f3a5b6] text-[#f3a5b6]" aria-hidden />{t}</li>))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <SiteButton href="/for-my-love/make" variant="light" data-track="cta_click" data-ref="love-make">Make a gift <ArrowRight className="size-4" aria-hidden /></SiteButton>
              <SiteButton href="/for-my-love" variant="quiet" className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10">See the five ways</SiteButton>
            </div>
          </div>
          <ul className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-3 sm:overflow-visible sm:px-0">
            {love.map((t, i) => (
              <li key={t.slug} className={`w-[44%] shrink-0 snap-center sm:w-auto ${i % 2 ? "sm:mt-8" : ""}`}>
                <Link href={t.path} data-track="cta_click" data-ref={`love-${t.slug}`} className="group block">
                  <div className="relative aspect-[9/19] overflow-hidden rounded-[1.4rem] border-[3px] border-white/20 bg-white/5 transition duration-500 group-hover:-translate-y-1.5">
                    <FallbackImg src={t.thumb} alt={`${t.name}, a love gift`} width={540} height={1140} loading="lazy" className="absolute inset-0 size-full object-cover object-top" />
                  </div>
                  <p className="mt-2.5 font-serif text-[18px] leading-tight text-white">{t.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── what guests get ──────────────────────────────────────────── */}
      <Section tone="white">
        <Heading eyebrow="What your guests experience" title="Beautiful to open. Easy to answer." lede="Elders, cousins and colleagues open the same link on whatever phone they have." align="center" />
        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {WHAT_GUESTS_GET.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-marigold-soft text-[#a8691a]"><Icon className="size-5" aria-hidden /></span>
              <div>
                <h3 className="text-[19px] font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-[16px] leading-relaxed text-ink-2/80">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── pricing ──────────────────────────────────────────────────── */}
      <Section tone="paper" id="pricing">
        <Heading eyebrow="Pricing" title="One-time, per invitation. No surprises." lede={`A personal gift is ${giftPriceText()}. Wedding and event invitations start at ${inr(Math.min(...packages.map((p) => p.priceMin)))}. Every package is the same beautiful design — you choose how much happens around it.`} />
        <div className="mt-10"><LovePriceCard price={giftPriceText()} /></div>
        <PackageCards packages={packages} compact />
        <p className="mt-8 text-[15px] text-muted">Prices are in Indian rupees. <Link href="/pricing" className="text-accent underline underline-offset-4">See exactly what each package includes</Link>, or tell us about a larger event and we will quote it.</p>
      </Section>

      {/* ── who is behind it ─────────────────────────────────────────── */}
      <Section tone="white">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <Heading eyebrow={`A product of ${brand.company}`} title="One team, from first message to the last wish." lede={`${brand.company} designs and builds websites, apps and WhatsApp tools. Invites is the part you can hold in your hand — we build it, run it and look after every invitation ourselves.`} />
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a href={companyLink()} className="btn btn-quiet btn-lg">Visit {brand.company} <ArrowRight className="size-4" aria-hidden /></a>
          </div>
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <Section tone="paper">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Heading eyebrow="Questions" title="Made for families, not for developers." />
            <Link href="/faq" className="btn btn-quiet mt-8">All questions</Link>
          </div>
          <FaqList items={FAQ_HOME} />
        </div>
        <JsonLd data={faqLd(FAQ_HOME)} />
      </Section>

      <FinalCta title="Let’s make yours." body="Tell us about the occasion and we will send a private preview, with your names on it." message={WA.general} primary={{ href: "/templates", label: "Choose Your Design" }} />
    </>
  );
}
