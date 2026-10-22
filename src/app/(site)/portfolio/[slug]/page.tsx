import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { listPublicPortfolio, publicPortfolioItem } from "@/domain/portfolio/service";
import { siteTemplateBySlug } from "@/domain/catalogue/templates";
import { FinalCta, Section, Wrap } from "@/components/site/blocks";
import { FallbackImg } from "@/components/site/FallbackImg";
import { PortfolioWall } from "@/components/site/PortfolioWall";
import { SiteButton, WaButton } from "@/components/site/WaButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await publicPortfolioItem(slug);
  if (!p) return { title: "Not found", robots: { index: false } };
  return pageMetadata({ path: `/portfolio/${p.slug}`, title: p.title, description: p.description || `${p.title} — ${p.categoryName} invitation by Invites by Stack Bridge Labs.` });
}

export default async function PortfolioItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await publicPortfolioItem(slug);
  if (!p) notFound();
  const tpl = siteTemplateBySlug(p.templateSlug);
  const more = (await listPublicPortfolio(7)).filter((x) => x.slug !== p.slug).slice(0, 3);
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbf7f0,#ffffff)] pb-10 pt-12 sm:pt-16">
        <Wrap className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="eyebrow">{[p.categoryName, p.city].filter(Boolean).join(" · ")}</p>
            <h1 className="mt-3 font-serif text-[clamp(36px,5vw,64px)] font-medium leading-[1.02] tracking-[-0.012em] text-ink">{p.title}</h1>
            {p.description && <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-ink-2/85">{p.description}</p>}
            {tpl && <p className="mt-5 text-[15.5px] text-ink-2/80">Made from the <strong className="font-medium text-ink">{tpl.name}</strong> design — {tpl.tagline}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              {p.liveHref && <a href={p.liveHref} target="_blank" rel="noopener noreferrer" className="btn btn-lg" data-track="preview_open" data-ref={`portfolio-live-${p.slug}`}>See it live <ArrowUpRight className="size-4" aria-hidden /></a>}
              {tpl && <SiteButton href={`/start?template=${tpl.slug}`} variant="quiet" data-track="cta_click" data-ref={`portfolio-like-${p.slug}`}>Create one like this <ArrowRight className="size-4" aria-hidden /></SiteButton>}
              <WaButton message={WA.general} variant="outline" trackRef={`portfolio-${p.slug}`}>Chat on WhatsApp</WaButton>
            </div>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-lg overflow-hidden rounded-2xl bg-paper-2 shadow-[0_40px_70px_-40px_rgba(23,20,31,.6)]">
            <FallbackImg src={p.cover.src} srcSet={p.cover.srcSet} sizes="(max-width: 1024px) 100vw, 520px" alt={p.cover.alt} width={p.cover.width ?? 540} height={p.cover.height ?? 675} loading="eager" fetchPriority="high" className="absolute inset-0 size-full object-cover object-top" />
          </div>
        </Wrap>
      </section>
      {more.length > 0 && (
        <Section tone="white">
          <h2 className="mb-8 font-serif text-[clamp(28px,3.2vw,38px)] font-medium text-ink">More stories</h2>
          <PortfolioWall items={more} className="lg:grid-cols-3 [&>li]:!col-span-1 [&>li]:!row-span-1" />
          <Link href="/portfolio" className="btn btn-quiet mt-8">All our work <ArrowRight className="size-4" aria-hidden /></Link>
        </Section>
      )}
      <FinalCta title="Ready for yours?" body="Tell us the date and share a few photographs. You see it before anyone else does." message={WA.general} primary={{ href: "/templates", label: "Choose Your Design" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Our work", path: "/portfolio" }, { name: p.title, path: `/portfolio/${p.slug}` }])]} />
    </>
  );
}
