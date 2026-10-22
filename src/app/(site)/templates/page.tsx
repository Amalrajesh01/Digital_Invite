import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { categoryBySlug } from "@/domain/catalogue/categories";
import { SITE_TEMPLATES, STYLE_FILTERS, templatesIn } from "@/domain/catalogue/templates";
import { FinalCta, Heading, Section, TemplateCard, Wrap } from "@/components/site/blocks";
import { TemplateFilter, type FilterGroup } from "@/components/site/TemplateFilter";

export const metadata = pageMetadata({
  path: "/templates",
  title: "Choose your invitation design",
  description: "Digital invitation designs for weddings, engagements, birthdays, anniversaries, housewarmings, naming ceremonies, corporate events, memorials — and love gifts. At least five different designs for every occasion. Open any one the way your guests will.",
  image: "ch4Fc1cGTq4",
});
export const dynamic = "force-dynamic";

const ORDER = ["wedding", "engagement", "birthday", "anniversary", "housewarming", "naming-ceremony", "religious", "corporate", "conference", "funeral", "for-my-love"] as const;
const LINE: Record<string, string> = {
  wedding: "Royal, minimal, cinematic, floral or full of fun — plus editions for Christian and Muslim weddings.",
  engagement: "Ring ceremonies, from a lamp-lit tradition to a party.",
  birthday: "A black-tie night, a big number, a garden lunch, a children’s party.",
  anniversary: "Years told as a number, a film, a garden or a night out.",
  housewarming: "Griha Pravesh, open houses and house parties.",
  "naming-ceremony": "Welcoming a little one — with the rituals explained.",
  religious: "Pujas, prayers and community festivals.",
  corporate: "Galas, keynotes, retreats and team parties.",
  conference: "Summits, forums and meetups.",
  funeral: "Dignified, quiet, and clear about the service.",
  "for-my-love": "Private gifts for someone you love — a story, a letter, a surprise, an apology, a special day.",
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const groups: FilterGroup[] = ORDER.map((slug) => {
    const list = templatesIn(slug);
    return { slug, name: categoryBySlug(slug)?.name ?? slug, line: LINE[slug] ?? "", styles: list.map((t) => (t.love ? "love" : t.style)), cards: list.map((t, i) => <TemplateCard key={t.slug} t={t} priority={slug === "wedding" && i < 2} />) };
  }).filter((g) => g.cards.length);
  const occasions = groups.map((g) => ({ value: g.slug, label: g.name }));
  const initial = { occasion: occasions.some((o) => o.value === first(q.occasion)) ? first(q.occasion) : "", style: STYLE_FILTERS.some((s) => s.value === first(q.style)) ? first(q.style) : "" };
  const total = SITE_TEMPLATES.length;
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbf7f0,#ffffff)] pb-4 pt-12 sm:pt-20">
        <Wrap>
          <Heading as="h1" eyebrow="Choose your design" title="Find the one that feels like your celebration." lede={`${total} designs, with at least five different ones for every occasion. Tap any design to open it the way your guests will — then tell us your details and we make it yours.`} />
        </Wrap>
      </section>
      <Section tone="white" className="!pt-8">
        <TemplateFilter groups={groups} occasions={occasions} styles={STYLE_FILTERS.map((s) => ({ value: s.value, label: s.label }))} initial={initial} />
      </Section>
      <FinalCta title="Not sure which one to pick?" body="Tell us what you are celebrating and who is coming, and we will suggest two or three." message={WA.custom} primary={{ href: "/start", label: "Ask for help choosing" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Designs", path: "/templates" }]), itemListLd("Invitation designs", SITE_TEMPLATES.map((t) => ({ name: `${t.name} — ${categoryBySlug(t.category)?.name ?? ""}`, path: t.path })))]} />
    </>
  );
}
