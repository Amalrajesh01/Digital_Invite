import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { listPublicPortfolio } from "@/domain/portfolio/service";
import { FinalCta, Heading, Section, Wrap } from "@/components/site/blocks";
import { PortfolioWall } from "@/components/site/PortfolioWall";

export const metadata = pageMetadata({
  path: "/portfolio",
  title: "Our work — stories we have brought to life",
  description: "A curated look at invitations we have made: the designs, the openings and the details that make each one feel like theirs.",
});
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const items = await listPublicPortfolio();
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbf7f0,#ffffff)] pb-6 pt-14 sm:pt-20">
        <Wrap><Heading as="h1" eyebrow="Our work" title="Stories we have brought to life." lede="Every invitation here began as a conversation and a handful of photographs. Open any one to see how it was made." /></Wrap>
      </section>
      <Section tone="white" className="!pt-10">
        {items.length ? (
          <PortfolioWall items={items} />
        ) : (
          <div className="mx-auto max-w-xl py-10 text-center">
            <p className="font-serif text-[28px] text-ink">Our first stories are being finished.</p>
            <p className="mt-3 text-[17px] text-ink-2/80">While you wait, open any design the way your guests will.</p>
            <Link href="/templates" className="btn btn-quiet mt-6">Explore the designs <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        )}
      </Section>
      <FinalCta title="Tell us your story." body="Share your photographs and a few details. We make it feel like yours." message={WA.general} primary={{ href: "/templates", label: "Choose Your Design" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Our work", path: "/portfolio" }])]} />
    </>
  );
}
