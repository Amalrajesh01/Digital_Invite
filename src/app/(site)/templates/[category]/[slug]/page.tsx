import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Check } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { categoryBySlug } from "@/domain/catalogue/categories";
import { demoBySlug, primaryCategory, relatedDemos, sectionLabels, templateOf, themeOf } from "@/domain/catalogue/demos";
import { loadPublicPackages } from "@/domain/catalogue/pricing";
import { EVENT_TYPE_INFO } from "@/domain/doc/event-types";
import { DevicePreview } from "@/components/site/DevicePreview";
import { SiteImage } from "@/components/site/SiteImage";
import { SiteButton, WaButton } from "@/components/site/WaButton";
import { FinalCta, Heading, PackageCards, Section, Swatches, TemplateCard, Wrap, templatePath } from "@/components/site/blocks";

type Props = { params: Promise<{ category: string; slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const d = demoBySlug(slug);
  if (!d) return {};
  return pageMetadata({
    path: templatePath(d),
    title: `${d.title} invitation template`,
    description: `${d.tagline} ${d.description}`.slice(0, 158).replace(/\s+\S*$/, "…"),
    image: d.cover,
  });
}

export default async function TemplatePage({ params }: Props) {
  const { category, slug } = await params;
  const d = demoBySlug(slug);
  const cat = categoryBySlug(category);
  if (!d || !cat) notFound();
  // one address per template: a sample listed under a wider category (a conclave under "Corporate") lives at its own
  if (primaryCategory(d) !== category) permanentRedirect(templatePath(d));

  const [packages] = await Promise.all([loadPublicPackages()]);
  const own = categoryBySlug(primaryCategory(d))!;
  const sections = sectionLabels(d);
  const theme = themeOf(d);
  const tpl = templateOf(d);
  const info = EVENT_TYPE_INFO[d.eventType];
  const related = relatedDemos(d, 3);
  const src = `/preview/demo/${d.slug}`;

  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbfaf7,#ffffff)] pb-6 pt-10 sm:pt-14">
        <Wrap>
          <nav aria-label="Breadcrumb" className="text-[13.5px] text-muted">
            <Link href="/templates" className="hover:text-accent">Templates</Link> <span aria-hidden>›</span> <Link href={`/templates/${own.slug}`} className="hover:text-accent">{own.name}</Link> <span aria-hidden>›</span> <span className="text-ink-2">{d.title}</span>
          </nav>
          <div className="mt-5 max-w-4xl">
            <p className="eyebrow !text-accent">{own.name} · sample “{d.name}”</p>
            <h1 className="mt-3 font-serif text-[clamp(38px,5.6vw,70px)] font-medium leading-[1.02] tracking-[-0.015em] text-ink">{d.title} invitation template</h1>
            <p className="mt-5 max-w-2xl text-[18.5px] leading-relaxed text-ink-2/85">{d.tagline}</p>
          </div>
        </Wrap>
      </section>

      <Section tone="white" className="!pt-8">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14">
          <DevicePreview src={src} title={`${d.title} — a sample invitation`} cover={<SiteImage id={d.cover} ratio="2:3" priority rounded={false} className="size-full !aspect-auto" sizes="(max-width: 1024px) 90vw, 700px" />} />

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-rule-strong bg-white p-6 sm:p-7">
              <p className="eyebrow">The sample</p>
              <p className="mt-2 font-serif text-[30px] font-medium leading-tight text-ink">{d.name}</p>
              <p className="mt-1 text-[15px] text-muted">{d.when} · {d.where}</p>
              <p className="mt-5 text-[16px] leading-relaxed text-ink-2/85">{d.description}</p>
              <dl className="mt-6 grid gap-4 border-t border-rule pt-5 text-[14.5px]">
                <div className="flex items-center justify-between gap-4"><dt className="text-muted">Occasion</dt><dd className="font-medium">{info.label}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-muted">Style</dt><dd className="text-right font-medium">{d.styles.join(" · ")}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-muted">Colours</dt><dd className="flex items-center gap-2.5 font-medium">{theme?.name} <Swatches demo={d} /></dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-muted">Opens with</dt><dd className="font-medium">{info.celebration === "none" ? "No effects" : info.celebration === "petals" ? "Falling petals" : "Confetti"}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-muted">Languages</dt><dd className="font-medium">{d.languages.join(" + ")}</dd></div>
              </dl>
              <div className="mt-7 grid gap-3">
                <WaButton message={WA.template(`${d.title} — ${d.name}`)} variant="solid">Create an Invitation Like This</WaButton>
                <WaButton message={WA.general} variant="outline">Talk to Us on WhatsApp</WaButton>
              </div>
              <p className="mt-4 text-[13px] leading-snug text-muted">This sample is shown with the Luxury package, so you can see everything. See what each package includes below.</p>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="paper">
        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <Heading eyebrow="What this template includes" title="The sections, in the order guests meet them." />
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {sections.map((s) => (<li key={s} className="rounded-full border border-rule-strong bg-white px-4 py-2 text-[14.5px] font-medium text-ink-2">{s}</li>))}
            </ul>
            <p className="mt-5 text-[14px] text-muted">Plus the live-day and keepsake sections of the Luxury package — live updates, a photo wall, a memory book — which appear on the day and after it.</p>
          </div>
          <div>
            <Heading eyebrow="What makes it different" title="Details that matter." />
            <ul className="mt-8 space-y-4 text-[16px]">
              {d.highlights.map((h) => (
                <li key={h} className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden /><span>{h}</span></li>
              ))}
            </ul>
            <p className="mt-7 text-[14.5px] font-semibold text-ink">Best for</p>
            <ul className="mt-2 space-y-1.5 text-[15px] text-ink-2/85">
              {d.bestFor.map((b) => (<li key={b}>{b}</li>))}
            </ul>
          </div>
        </div>
      </Section>

      <Section tone="white">
        <Heading eyebrow="From the sample" title="A closer look." />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {d.strip.map((id, i) => (<li key={id}><SiteImage id={id} ratio="4:5" sizes="(max-width: 1024px) 50vw, 25vw" priority={i === 0} /></li>))}
        </ul>
        <p className="mt-4 text-[13px] text-muted">Photographs show real people as stand-ins for the fictional names. Your invitation uses your own photographs.</p>
      </Section>

      <Section tone="paper" id="pricing">
        <Heading eyebrow="Pricing" title={`Every template comes in every package.`} lede={`${tpl?.name ?? d.title} works with Essential, Signature and Luxury. The package decides how much happens around the invitation — not how it looks.`} />
        <PackageCards packages={packages} compact />
      </Section>

      <Section tone="white">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading eyebrow="More like this" title="Other templates you may like." />
          <SiteButton href="/templates" variant="quiet">Browse all templates</SiteButton>
        </div>
        <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((r) => (<li key={r.slug}><TemplateCard demo={r} /></li>))}
        </ul>
      </Section>

      <FinalCta title="Create an invitation like this." body="Message us the date, the place and a photograph or two. We will send a private preview with your details on it." message={WA.template(`${d.title} — ${d.name}`)} primary={{ href: "/pricing", label: "See pricing" }} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Templates", path: "/templates" }, { name: own.name, path: `/templates/${own.slug}` }, { name: d.title, path: templatePath(d) }])} />
    </>
  );
}
