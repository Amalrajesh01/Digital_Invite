import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Check } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { categoryBySlug } from "@/domain/catalogue/categories";
import { SITE_TEMPLATES, sameOccasion, siteTemplateBySlug } from "@/domain/catalogue/templates";
import { loadPublicPackages } from "@/domain/catalogue/pricing";
import { TEMPLATE_SEEDS } from "@/domain/design/templates";
import { SECTION_META } from "@/domain/doc/sections";
import { DevicePreview } from "@/components/site/DevicePreview";
import { FallbackImg } from "@/components/site/FallbackImg";
import { SiteButton, WaButton } from "@/components/site/WaButton";
import { Track } from "@/components/site/SiteTracker";
import { FinalCta, Heading, PackageCards, Section, Swatches, TemplateCard, Wrap } from "@/components/site/blocks";

type Props = { params: Promise<{ category: string; slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const t = siteTemplateBySlug(slug);
  if (!t) return {};
  return pageMetadata({ path: t.path, title: `${t.name} — ${categoryBySlug(t.category)?.name ?? ""} invitation design`, description: `${t.tagline} ${t.concept}`.slice(0, 158).replace(/\s+\S*$/, "…") });
}

/** The pages of the sections a guest meets before the day, as plain labels, in order. */
function insideLabels(slug: string): string[] {
  const seed = TEMPLATE_SEEDS.find((s) => s.slug === slug);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of seed?.config.sections ?? []) {
    const meta = SECTION_META[s.type];
    if (!s.enabled || !meta.phases.includes("PUBLISHED") || seen.has(meta.label)) continue;
    seen.add(meta.label);
    out.push(meta.label);
  }
  return out;
}

export default async function TemplatePage({ params }: Props) {
  const { category, slug } = await params;
  const t = siteTemplateBySlug(slug);
  if (!t) {
    // an older address (a sample invitation’s name) goes to the design that sample now belongs to
    const moved = SITE_TEMPLATES.find((x) => x.demo === slug && !x.edition);
    if (moved) permanentRedirect(moved.path);
    notFound();
  }
  if (t.category !== category) permanentRedirect(t.path);
  const cat = categoryBySlug(t.category)!;
  const packages = await loadPublicPackages();
  const others = sameOccasion(t);
  const inside = t.love ? [] : insideLabels(t.slug);
  const start = t.love ? `/for-my-love/make?style=${t.slug}` : `/start?template=${t.slug}&occasion=${t.category}`;
  return (
    <>
      <Track type="design_view" refSlug={t.slug} />
      <section className="bg-[linear-gradient(180deg,#fbf7f0,#ffffff)] pb-6 pt-10 sm:pt-14">
        <Wrap>
          <nav aria-label="Breadcrumb" className="text-[13.5px] text-muted">
            <Link href="/templates" className="hover:text-accent">Designs</Link> <span aria-hidden>›</span> <Link href={`/templates/${cat.slug}`} className="hover:text-accent">{cat.name}</Link> <span aria-hidden>›</span> <span className="text-ink-2">{t.name}</span>
          </nav>
          <div className="mt-5 max-w-4xl">
            <p className="eyebrow">{cat.name} · {t.styleLabel}</p>
            <h1 className="mt-3 font-serif text-[clamp(40px,5.8vw,72px)] font-medium leading-[1.02] tracking-[-0.015em] text-ink">{t.name}</h1>
            <p className="mt-5 max-w-2xl text-[19px] leading-relaxed text-ink-2/85">{t.tagline}</p>
          </div>
        </Wrap>
      </section>

      <Section tone="white" className="!pt-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
          <DevicePreview src={`/preview/t/${t.slug}`} title={`${t.name} — a sample`} trackRef={t.slug} cover={<FallbackImg src={t.thumb} alt="" className="size-full object-cover object-top" />} />
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-rule-strong bg-white p-6 sm:p-7">
              <p className="eyebrow">About this design</p>
              <p className="mt-3 text-[17px] leading-relaxed text-ink-2/90">{t.concept}</p>
              <dl className="mt-6 grid gap-4 border-t border-rule pt-5 text-[15px]">
                <div className="flex items-start justify-between gap-4"><dt className="text-muted">Style</dt><dd className="text-right font-medium">{t.styleLabel}</dd></div>
                <div className="flex items-start justify-between gap-4"><dt className="text-muted">Opens with</dt><dd className="text-right font-medium">{t.openingLabel}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-muted">Colours</dt><dd className="flex items-center gap-2.5 font-medium">{t.theme.name} <Swatches colors={t.theme.colors} /></dd></div>
                <div className="flex items-start justify-between gap-4"><dt className="text-muted">Languages</dt><dd className="text-right font-medium">English and Malayalam, and your own words in any language</dd></div>
              </dl>
              <p className="mt-6 text-[14.5px] font-semibold text-ink">Best for</p>
              <ul className="mt-2 space-y-1.5 text-[15px] text-ink-2/85">{t.target.map((b) => (<li key={b} className="flex gap-2.5"><Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden />{b}</li>))}</ul>
              <div className="mt-7 grid gap-3">
                <SiteButton href={start} data-track="cta_click" data-ref={`use-design-${t.slug}`}>{t.love ? "Make a gift like this" : "Use This Design"}</SiteButton>
                <WaButton message={WA.template(`${t.name} (${cat.name})`)} variant="outline" trackRef={`design-${t.slug}`}>Ask about this design</WaButton>
              </div>
              <p className="mt-4 text-[13.5px] leading-snug text-muted">{t.love ? "You see your gift first, and it stays private." : "Shown here with every feature switched on. What you get depends on the package — see below."}</p>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="paper">
        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <Heading eyebrow="How it feels" title="What your guests see and do." />
            <ul className="mt-8 space-y-4 text-[17px]">
              {t.interactions.map((h) => (<li key={h} className="flex gap-3"><Check className="mt-1.5 size-4 shrink-0 text-accent" aria-hidden /><span>{h}</span></li>))}
            </ul>
            <p className="mt-7 text-[15.5px] leading-relaxed text-ink-2/80"><b className="text-ink">Photographs:</b> {t.images}</p>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2/80"><b className="text-ink">Movement:</b> {t.motion}</p>
          </div>
          {inside.length > 0 && (
            <div>
              <Heading eyebrow="What is inside" title="The pages, in the order guests meet them." />
              <ul className="mt-8 flex flex-wrap gap-2.5">{inside.map((s) => (<li key={s} className="rounded-full border border-rule-strong bg-white px-4 py-2 text-[14.5px] font-medium text-ink-2">{s}</li>))}</ul>
              <p className="mt-5 text-[14px] text-muted">On the day, and after it, more pages appear — live updates, a photo wall and a memory book — depending on the package.</p>
            </div>
          )}
        </div>
      </Section>

      {others.length > 0 && (
        <Section tone="white">
          <Heading eyebrow={`Same ${cat.name.toLowerCase()}, other styles`} title="Compare it with the others." lede="Each of these is a different way to begin and to tell your story." />
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4">
            {others.slice(0, 4).map((o) => (<li key={o.slug}><TemplateCard t={o} /></li>))}
          </ul>
        </Section>
      )}

      {!t.love && (
        <Section tone="paper" id="pricing">
          <Heading eyebrow="Pricing" title="Every design comes in every package." lede={`${t.name} works with Essential, Signature and Luxury. The package decides how much happens around the invitation — not how it looks.`} />
          <PackageCards packages={packages} compact />
        </Section>
      )}

      <FinalCta title={t.love ? "Make it yours." : "Create an invitation like this."} body={t.love ? "Add your words and your photographs. See it before anyone else, and keep it private." : "Share the date, the place and a photograph or two. We will send a private preview with your details on it."} message={WA.template(`${t.name} (${cat.name})`)} primary={{ href: start, label: t.love ? "Make a gift" : "Use This Design" }} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Designs", path: "/templates" }, { name: cat.name, path: `/templates/${cat.slug}` }, { name: t.name, path: t.path }])} />
    </>
  );
}
