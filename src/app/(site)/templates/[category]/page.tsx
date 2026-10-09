import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd, faqLd, itemListLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { CATEGORIES, categoryBySlug } from "@/domain/catalogue/categories";
import { demosIn } from "@/domain/catalogue/demos";
import { CategoryCard, FaqList, FinalCta, Heading, Section, TemplateCard, templatePath, Wrap } from "@/components/site/blocks";
import { SiteButton, WaButton } from "@/components/site/WaButton";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) return {};
  const demos = demosIn(cat.slug);
  return pageMetadata({
    path: `/templates/${cat.slug}`,
    title: cat.title,
    description: cat.seoDescription,
    image: demos[0]?.cover ?? cat.cover,
    // an occasion with no sample yet is shown (so people can ask for it) but kept out of search results
    index: demos.length > 0,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) notFound();
  const demos = demosIn(cat.slug);
  const others = CATEGORIES.filter((c) => c.slug !== cat.slug).sort((a, b) => demosIn(b.slug).length - demosIn(a.slug).length).slice(0, 4);
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbfaf7,#ffffff)] pb-10 pt-10 sm:pt-14">
        <Wrap>
          <nav aria-label="Breadcrumb" className="text-[13.5px] text-muted">
            <Link href="/templates" className="hover:text-accent">Templates</Link> <span aria-hidden>›</span> <span className="text-ink-2">{cat.name}</span>
          </nav>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h1 className="font-serif text-[clamp(40px,6vw,76px)] font-medium leading-[1] tracking-[-0.015em] text-ink">{cat.title}</h1>
              <div className="mt-6 max-w-2xl space-y-4 text-[17.5px] leading-relaxed text-ink-2/85">
                {cat.intro.map((p, i) => (<p key={i}>{p}</p>))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <WaButton message={WA.category(cat.name)}>Talk to us on WhatsApp</WaButton>
                <SiteButton href="/templates" variant="quiet">All templates <ArrowRight className="size-4" aria-hidden /></SiteButton>
              </div>
            </div>
            <aside className="rounded-xl border border-rule-strong bg-white p-6 sm:p-7">
              <p className="eyebrow">Typically included</p>
              <ul className="mt-4 space-y-3 text-[15px]">
                {cat.includes.map((i) => (
                  <li key={i} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /><span>{i}</span></li>
                ))}
              </ul>
            </aside>
          </div>
        </Wrap>
      </section>

      <Section tone="white" className="!pt-10">
        {demos.length > 0 ? (
          <>
            <Heading as="h2" eyebrow={`${demos.length} sample${demos.length === 1 ? "" : "s"}`} title={`${cat.name} templates`} lede="Open any of them the way your guests will. Each is a real, published invitation with fictional names." />
            <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {demos.map((d, i) => (<li key={d.slug}><TemplateCard demo={d} priority={i < 3} /></li>))}
            </ul>
          </>
        ) : (
          <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-rule-strong bg-paper p-10 text-center">
            <p className="eyebrow">Designed on request</p>
            <h2 className="mt-3 font-serif text-[clamp(30px,4vw,44px)] font-medium leading-tight">We make {cat.name.toLowerCase()} invitations to order.</h2>
            <p className="mt-4 text-[16.5px] leading-relaxed text-ink-2/80">There is no sample on the gallery yet, but the engine is the same one behind every design here. Tell us the date, the place and the mood you have in mind, and we will send a private preview with your details on it.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <WaButton message={WA.category(cat.name)}>Tell us about your {cat.name.toLowerCase()}</WaButton>
              <SiteButton href="/templates" variant="quiet">See the samples we have</SiteButton>
            </div>
          </div>
        )}
      </Section>

      <Section tone="paper">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Heading eyebrow="Questions" title={`About ${cat.name.toLowerCase()} invitations`} />
          <FaqList items={cat.faq} />
        </div>
      </Section>

      <Section tone="white">
        <Heading eyebrow="Other occasions" title="Looking for something else?" />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {others.map((c) => (<li key={c.slug}><CategoryCard category={c} count={demosIn(c.slug).length} /></li>))}
        </ul>
      </Section>

      <FinalCta title={`Let’s make your ${cat.name.toLowerCase()} invitation.`} body="Tell us about the day and we will send a private preview, with your names on it." message={WA.category(cat.name)} primary={{ href: "/pricing", label: "See pricing" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Templates", path: "/templates" }, { name: cat.name, path: `/templates/${cat.slug}` }]), faqLd(cat.faq), ...(demos.length ? [itemListLd(`${cat.name} templates`, demos.map((d) => ({ name: `${d.title} — ${d.name}`, path: templatePath(d) })))] : [])]} />
    </>
  );
}
