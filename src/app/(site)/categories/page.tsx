import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { CATEGORIES, CATEGORY_GROUPS } from "@/domain/catalogue/categories";
import { demosIn } from "@/domain/catalogue/demos";
import { CategoryCard, FinalCta, Heading, Section, Wrap } from "@/components/site/blocks";

export const metadata = pageMetadata({
  path: "/categories",
  title: "Invitations for every occasion",
  description: "Digital invitations for weddings, engagements, birthdays, anniversaries, naming ceremonies, housewarmings, graduations, religious and cultural events, corporate conclaves and summits, and memorials.",
  image: "1dzXfvALJxs",
});

export default function CategoriesPage() {
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbfaf7,#ffffff)] pb-6 pt-14 sm:pt-20">
        <Wrap>
          <Heading as="h1" eyebrow="Occasions" title="Invitations for every occasion." lede={`${CATEGORIES.length} occasions, one engine. Where there is a sample, you can open it; where there is not yet, we design it on request — the same way, for the same price.`} />
        </Wrap>
      </section>
      {CATEGORY_GROUPS.map((group, gi) => {
        const cats = CATEGORIES.filter((c) => c.group === group);
        return (
          <Section key={group} tone={gi % 2 ? "paper" : "white"} className="!py-14 sm:!py-16">
            <h2 className="font-serif text-[clamp(28px,3.4vw,40px)] font-medium text-ink">{group}</h2>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {cats.map((c) => (<li key={c.slug}><CategoryCard category={c} count={demosIn(c.slug).length} /></li>))}
            </ul>
          </Section>
        );
      })}
      <FinalCta title="Something we have not listed?" body="Reunions, retirements, a house blessing, a book launch. If it is worth inviting people to, we can design it." message={WA.custom} primary={{ href: "/templates", label: "Browse templates" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Occasions", path: "/categories" }]), itemListLd("Invitation occasions", CATEGORIES.map((c) => ({ name: `${c.name} invitations`, path: `/templates/${c.slug}` })))]} />
    </>
  );
}
