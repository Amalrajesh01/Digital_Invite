import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd, faqLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { FAQ_ALL, FAQ_GROUPS } from "@/domain/catalogue/faq";
import { FaqList, FinalCta, Heading, Section, Wrap } from "@/components/site/blocks";

export const metadata = pageMetadata({
  path: "/faq",
  title: "Frequently asked questions",
  description: "How digital invitations work, what guests see, how replies are collected, what happens after the event, and what it costs.",
  image: "ch4Fc1cGTq4",
});

export default function FaqPage() {
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbfaf7,#ffffff)] pb-4 pt-14 sm:pt-20">
        <Wrap>
          <Heading as="h1" eyebrow="FAQ" title="Questions, answered plainly." lede="If yours is not here, message us on WhatsApp — a person replies." />
        </Wrap>
      </section>
      <Section tone="white" className="!pt-10">
        <div className="grid gap-16">
          {FAQ_GROUPS.map((g) => (
            <div key={g.title} className="grid gap-8 lg:grid-cols-[0.5fr_1.5fr]">
              <h2 className="font-serif text-[clamp(28px,3.2vw,38px)] font-medium text-ink">{g.title}</h2>
              <FaqList items={g.items} />
            </div>
          ))}
        </div>
      </Section>
      <FinalCta title="Still wondering?" body="Ask us anything. We reply personally, usually the same day." message={WA.general} primary={{ href: "/templates", label: "Browse templates" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }]), faqLd(FAQ_ALL)]} />
    </>
  );
}
