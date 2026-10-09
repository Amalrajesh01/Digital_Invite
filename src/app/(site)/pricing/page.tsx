import { Check, Minus } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd, faqLd, pricingLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { FEATURES, type FeatureGroup, type FeatureKey } from "@/domain/packages/features";
import { loadPublicPackages, priceText } from "@/domain/catalogue/pricing";
import { FAQ_GROUPS } from "@/domain/catalogue/faq";
import { FaqList, FinalCta, Heading, PackageCards, Section, Wrap } from "@/components/site/blocks";

export const metadata = pageMetadata({
  path: "/pricing",
  title: "Pricing — three packages, one-time",
  description: "Essential, Signature and Luxury digital invitation packages, priced per invitation, one-time, in Indian rupees. See exactly what each includes.",
  image: "ch4Fc1cGTq4",
});
export const dynamic = "force-dynamic";

const GROUP_ORDER: FeatureGroup[] = ["Invitation", "Guests & RSVP", "Participation", "Travel & Venue", "Event day", "Games", "Memories", "Dashboard"];

export default async function PricingPage() {
  const packages = await loadPublicPackages();
  const has = (pkg: (typeof packages)[number], f: FeatureKey) => pkg.features.includes(f);
  const groups = GROUP_ORDER.map((g) => ({ group: g, keys: (Object.keys(FEATURES) as FeatureKey[]).filter((k) => FEATURES[k].group === g) })).filter((g) => g.keys.length);
  const pricingFaq = FAQ_GROUPS.find((g) => g.title === "Pricing and support")?.items ?? [];
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbfaf7,#ffffff)] pb-4 pt-14 sm:pt-20">
        <Wrap>
          <Heading as="h1" eyebrow="Pricing" title="One engine. Three ways to celebrate." lede="Every package is the same premium invitation, for any occasion. You choose how much of the experience you want around it. Prices are in Indian rupees, one-time, per invitation." />
        </Wrap>
      </section>
      <Section tone="white" className="!pt-6">
        <PackageCards packages={packages} />
        <p className="mt-8 text-[14.5px] text-muted">Planning a conference, a conclave or a large gathering? Tell us what you need — registration, speakers, a programme, partners — and we will quote it.</p>
      </Section>

      <Section tone="paper">
        <Heading eyebrow="Compare" title="Everything each package includes." lede="Features, not guesses: this table is generated from what each package really switches on." />
        <div className="mt-10 overflow-x-auto rounded-xl border border-rule-strong bg-white">
          <table className="w-full min-w-[40rem] border-collapse text-left text-[15px]">
            <caption className="sr-only">Features included in each package</caption>
            <thead>
              <tr className="border-b border-rule-strong bg-paper">
                <th scope="col" className="p-4 font-semibold">Feature</th>
                {packages.map((p) => (
                  <th key={p.key} scope="col" className="w-36 p-4 text-center font-semibold">
                    {p.name}
                    <span className="mt-0.5 block text-[12.5px] font-normal text-muted">{priceText(p.priceMin, p.priceMax)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map(({ group, keys }) => (
              <tbody key={group}>
                <tr><th colSpan={packages.length + 1} scope="colgroup" className="bg-paper-2/70 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted">{group}</th></tr>
                {keys.map((k) => (
                  <tr key={k} className="border-t border-rule">
                    <th scope="row" className="p-4 font-normal">
                      <span className="font-medium text-ink">{FEATURES[k].label}</span>
                      <span className="mt-0.5 block text-[13.5px] text-muted">{FEATURES[k].description}</span>
                    </th>
                    {packages.map((p) => (
                      <td key={p.key} className="p-4 text-center">
                        {has(p, k) ? <Check className="mx-auto size-5 text-accent" aria-label="Included" /> : <Minus className="mx-auto size-5 text-rule-strong" aria-label="Not included" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </Section>

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Heading eyebrow="Questions" title="About pricing and support." />
          <FaqList items={pricingFaq} />
        </div>
      </Section>

      <FinalCta title="Not sure which package suits you?" body="Tell us about the occasion and the guests, and we will say honestly which one you need — and which you do not." message={WA.pricing} primary={{ href: "/templates", label: "Browse templates" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]), pricingLd(packages.map((p) => ({ name: p.name, description: p.blurb, priceMin: p.priceMin, priceMax: p.priceMax }))), faqLd(pricingFaq)]} />
    </>
  );
}
