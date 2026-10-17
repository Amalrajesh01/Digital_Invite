import { Check, Minus } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd, faqLd, pricingLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { FEATURES, type FeatureGroup, type FeatureKey } from "@/domain/packages/features";
import { loadPublicPackages, priceText } from "@/domain/catalogue/pricing";
import { FAQ_GROUPS } from "@/domain/catalogue/faq";
import { FaqList, FinalCta, Heading, LovePriceCard, PackageCards, Section, Wrap } from "@/components/site/blocks";
import { giftPriceText } from "@/domain/gifts/pricing";

export const metadata = pageMetadata({
  path: "/pricing",
  title: "Pricing — gifts from ₹499, weddings from ₹999",
  description: "A For My Love gift is ₹499. Wedding and event invitations start at ₹999 with Essential, then Signature and Luxury — one-time, in Indian rupees. See exactly what each includes.",
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
      <section className="bg-[linear-gradient(180deg,#fbf7f0,#ffffff)] pb-4 pt-14 sm:pt-20">
        <Wrap>
          <Heading as="h1" eyebrow="Pricing" title="Pay once. Choose how much you want." lede="Every package gives you the same beautiful design, for any occasion. What changes is how much happens around it: replies, wishes, photographs, the day itself. Prices are in Indian rupees, one-time, for each invitation." />
        </Wrap>
      </section>
      <Section tone="white" className="!pt-6">
        <LovePriceCard price={giftPriceText()} />
        <p className="mt-12 text-[15px] font-semibold text-ink">Wedding and event invitations</p>
        <PackageCards packages={packages} />
        <p className="mt-8 max-w-3xl text-[15px] leading-relaxed text-muted">What costs extra: anything outside these lists — for example your own web address for the invitation, or a large event with registration, speakers and partners. Tell us what you need and we will quote it before you decide. Love gifts are priced separately; ask us on WhatsApp.</p>
      </Section>

      <Section tone="paper">
        <Heading eyebrow="Compare" title="Everything each package includes." lede="This table is built from what each package really switches on, so it is always exact." />
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

      <FinalCta title="Not sure which package suits you?" body="Tell us about the occasion and the guests, and we will say honestly which one you need — and which you do not." message={WA.pricing} primary={{ href: "/templates", label: "Choose Your Design" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]), pricingLd(packages.map((p) => ({ name: p.name, description: p.blurb, priceMin: p.priceMin, priceMax: p.priceMax }))), faqLd(pricingFaq)]} />
    </>
  );
}
