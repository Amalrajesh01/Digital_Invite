import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd, faqLd, itemListLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { CATEGORIES, categoryBySlug } from "@/domain/catalogue/categories";
import { templatesIn } from "@/domain/catalogue/templates";
import { CategoryCard, FaqList, FinalCta, Heading, Section, TemplateCard, Wrap } from "@/components/site/blocks";
import { SiteButton, WaButton } from "@/components/site/WaButton";
import { Track } from "@/components/site/SiteTracker";

type Props = { params: Promise<{ category: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) return {};
  return pageMetadata({ path: `/templates/${cat.slug}`, title: cat.title, description: cat.seoDescription, image: cat.cover });
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) notFound();
  const all = templatesIn(cat.slug);
  const designs = all.filter((t) => !t.edition);
  const editions = all.filter((t) => t.edition);
  const family = cat.family ? categoryBySlug(cat.family) : null;
  const others = CATEGORIES.filter((c) => c.slug !== cat.slug && !c.family).slice(0, 4);
  const love = cat.slug === "for-my-love";
  return (
    <>
      <Track type="design_view" refSlug={`category:${cat.slug}`} />
      <section className="bg-[linear-gradient(180deg,#fbf7f0,#ffffff)] pb-10 pt-10 sm:pt-14">
        <Wrap>
          <nav aria-label="Breadcrumb" className="text-[13.5px] text-muted">
            <Link href="/templates" className="hover:text-accent">Designs</Link> <span aria-hidden>›</span> <span className="text-ink-2">{cat.name}</span>
          </nav>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h1 className="font-serif text-[clamp(40px,6vw,76px)] font-medium leading-[1] tracking-[-0.015em] text-ink">{cat.title}</h1>
              <div className="mt-6 max-w-2xl space-y-4 text-[18px] leading-relaxed text-ink-2/85">
                {cat.intro.map((p, i) => (<p key={i}>{p}</p>))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {love ? <SiteButton href="/for-my-love/make" data-track="cta_click" data-ref="category-love-make">Make a gift <ArrowRight className="size-4" aria-hidden /></SiteButton> : <SiteButton href={`/start?occasion=${cat.slug}`} data-track="cta_click" data-ref={`category-start-${cat.slug}`}>Create Your {cat.name} Invitation <ArrowRight className="size-4" aria-hidden /></SiteButton>}
                <WaButton message={WA.category(cat.name)} variant="outline" trackRef={`category-${cat.slug}`}>Chat on WhatsApp</WaButton>
              </div>
            </div>
            <aside className="rounded-2xl border border-rule-strong bg-white p-6 sm:p-7">
              <p className="eyebrow">What you get</p>
              <ul className="mt-4 space-y-3 text-[15.5px]">
                {cat.includes.map((i) => (<li key={i} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /><span>{i}</span></li>))}
              </ul>
            </aside>
          </div>
        </Wrap>
      </section>

      <Section tone="white" className="!pt-10">
        <Heading as="h2" eyebrow={`${designs.length} designs`} title={love ? "Five ways to unfold a gift." : designs.filter((d) => !d.edition).length > 5 ? `${designs.filter((d) => !d.edition).length} designs for your ${cat.name.toLowerCase()}.` : `Five different designs for your ${cat.name.toLowerCase()}.`} lede={family ? `We do not have a separate set for a ${cat.name.toLowerCase()}, so here are the five designs nearest to it. We change the wording and the details to suit — and you see it before anyone else.` : "Open any of them the way your guests will. They open differently, are laid out differently and move differently."} />
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-5">
          {designs.map((t, i) => (<li key={t.slug}><TemplateCard t={t} priority={i < 3} /></li>))}
        </ul>
        {editions.length > 0 && (
          <div className="mt-16">
            <Heading as="h3" eyebrow="Made for your tradition" title="Editions for particular weddings." lede="The same quality, set for the customs of a church or a nikah — with the ceremonies explained for guests who are new to them." className="[&_h3]:!text-[clamp(28px,3.4vw,40px)]" />
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-5">
              {editions.map((t) => (<li key={t.slug}><TemplateCard t={t} /></li>))}
            </ul>
          </div>
        )}
        {family && <p className="mt-10 text-[15px] text-muted">Looking for something specific? <Link href={`/templates/${family.slug}`} className="text-accent underline underline-offset-4">See all {family.name.toLowerCase()} designs</Link>, or <Link href="/start" className="text-accent underline underline-offset-4">tell us what you have in mind</Link>.</p>}
      </Section>

      <Section tone="paper">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Heading eyebrow="Questions" title={`About ${cat.name.toLowerCase()}`} />
          <FaqList items={cat.faq} />
        </div>
      </Section>

      <Section tone="white">
        <Heading eyebrow="Other occasions" title="Looking for something else?" />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {others.map((c) => (<li key={c.slug}><CategoryCard category={c} count={templatesIn(c.slug).filter((t) => !t.edition).length} /></li>))}
        </ul>
      </Section>

      <FinalCta title={love ? "Make something only they will understand." : `Let’s make your ${cat.name.toLowerCase()} invitation.`} body={love ? "You see it first. It stays private. You can delete it any time." : "Tell us about the day and we will send a private preview, with your details on it."} message={WA.category(cat.name)} primary={love ? { href: "/for-my-love/make", label: "Make a gift" } : { href: `/start?occasion=${cat.slug}`, label: "Create Your Invitation" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Designs", path: "/templates" }, { name: cat.name, path: `/templates/${cat.slug}` }]), faqLd(cat.faq), itemListLd(`${cat.name} designs`, all.map((t) => ({ name: t.name, path: t.path })))]} />
    </>
  );
}
