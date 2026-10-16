import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { CATEGORIES, CATEGORY_GROUPS } from "@/domain/catalogue/categories";
import { templatesIn } from "@/domain/catalogue/templates";
import { CategoryCard, FinalCta, Heading, Section, Wrap } from "@/components/site/blocks";

export const metadata = pageMetadata({
  path: "/categories",
  title: "Invitations for every occasion",
  description: "Digital invitations and love gifts for weddings, engagements, birthdays, anniversaries, housewarmings, naming ceremonies, pujas and festivals, corporate events, conferences and memorials.",
  image: "1dzXfvALJxs",
});

export default function CategoriesPage() {
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbf7f0,#ffffff)] pb-6 pt-14 sm:pt-20">
        <Wrap>
          <Heading as="h1" eyebrow="Occasions" title="Find your occasion." lede={`${CATEGORIES.length} occasions. Each has five designs of its own — or, for the smaller ones, the five nearest — and every one opens like a real invitation.`} />
        </Wrap>
      </section>
      {CATEGORY_GROUPS.map((group, gi) => {
        const cats = CATEGORIES.filter((c) => c.group === group);
        return (
          <Section key={group} tone={gi % 2 ? "paper" : "white"} className="!py-14 sm:!py-16">
            <h2 className="font-serif text-[clamp(28px,3.4vw,40px)] font-medium text-ink">{group}</h2>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {cats.map((c) => (<li key={c.slug}><CategoryCard category={c} count={templatesIn(c.slug).filter((t) => !t.edition).length} /></li>))}
            </ul>
          </Section>
        );
      })}
      <FinalCta title="Something we have not listed?" body="Reunions, retirements, a house blessing, a book launch. If it is worth inviting people to, we can design it." message={WA.custom} primary={{ href: "/templates", label: "Choose Your Design" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Occasions", path: "/categories" }]), itemListLd("Invitation occasions", CATEGORIES.map((c) => ({ name: `${c.name} invitations`, path: `/templates/${c.slug}` })))]} />
    </>
  );
}
