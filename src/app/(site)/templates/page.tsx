import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { CATEGORIES } from "@/domain/catalogue/categories";
import { DEMOS, STYLE_TAGS, demosIn, type DemoDef } from "@/domain/catalogue/demos";
import { THEME_SEEDS } from "@/domain/design/themes";
import { FinalCta, Heading, Section, TemplateCard, templatePath, Wrap } from "@/components/site/blocks";
import { TemplateFilter, type FilterItem, type FilterOption } from "@/components/site/TemplateFilter";

export const metadata = pageMetadata({
  path: "/templates",
  title: "Digital invitation templates for every occasion",
  description: "Browse digital invitation templates for weddings, engagements, birthdays, anniversaries, naming ceremonies, corporate events and memorials. Open any sample the way your guests will.",
  image: "ch4Fc1cGTq4",
});
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;

  const items: FilterItem[] = DEMOS.map((d) => ({
    slug: d.slug,
    // a sample is filed under its own occasion and under every wider category that covers it (a conclave is also "Corporate")
    categories: CATEGORIES.filter((c) => c.eventTypes.includes(d.eventType)).map((c) => c.slug),
    styles: d.styles,
    theme: d.theme,
  }));
  const categories: FilterOption[] = CATEGORIES.filter((c) => demosIn(c.slug).length > 0).map((c) => ({ value: c.slug, label: c.name }));
  const styles: FilterOption[] = STYLE_TAGS.filter((s) => DEMOS.some((d) => d.styles.includes(s))).map((s) => ({ value: s, label: s }));
  const usedThemes = [...new Set(DEMOS.map((d) => d.theme))];
  const themes: FilterOption[] = usedThemes.map((slug) => {
    const t = THEME_SEEDS.find((x) => x.slug === slug);
    return { value: slug, label: t?.name ?? slug, swatches: t ? [t.tokens.colors.background, t.tokens.colors.primary, t.tokens.colors.accent] : undefined };
  });

  const initial = {
    category: categories.some((c) => c.value === first(q.category)) ? first(q.category) : "",
    style: styles.some((s) => s.value === first(q.style)) ? first(q.style) : "",
    theme: themes.some((t) => t.value === first(q.theme)) ? first(q.theme) : "",
  };

  const cards = DEMOS.map((d, i) => <TemplateCard key={d.slug} demo={d} priority={i < 3} />);
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbfaf7,#ffffff)] pb-4 pt-14 sm:pt-20">
        <Wrap>
          <Heading as="h1" eyebrow="Templates" title="Digital invitation templates, for every occasion." lede={`${DEMOS.length} sample invitations — weddings, a milestone birthday, a children’s party, an engagement, an anniversary, a naming ceremony, a conclave, a summit and a memorial. Each is a real, published invitation with fictional names. Open one the way your guests will.`} />
        </Wrap>
      </section>
      <Section tone="white" className="!pt-10">
        <TemplateFilter items={items} cards={cards} categories={categories} styles={styles} themes={themes} initial={initial} />
      </Section>
      <FinalCta title="Don’t see your occasion?" body="Every design is the same engine arranged differently. Tell us what you are celebrating and we will design it." message={WA.custom} primary={{ href: "/categories", label: "Browse all occasions" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Templates", path: "/templates" }]), itemListLd("Invitation templates", DEMOS.map((d: DemoDef) => ({ name: `${d.title} — ${d.name}`, path: templatePath(d) })))]} />
    </>
  );
}
