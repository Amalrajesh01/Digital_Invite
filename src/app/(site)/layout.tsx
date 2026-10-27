import { Cormorant_Garamond } from "next/font/google";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteTracker } from "@/components/site/SiteTracker";
import { MobileCta } from "@/components/site/MobileCta";
import { inr, loadPublicPackages } from "@/domain/catalogue/pricing";
import { JsonLd, organizationLd, websiteLd } from "@/lib/jsonld";

/** The product site’s headlines are set in the same refined serif as the invitations; the studio does not load it. */
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-serif-ui", display: "swap" });

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const essential = (await loadPublicPackages()).find((p) => p.key === "ESSENTIAL");
  return (
    <div className={`${serif.variable} site text-ink`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">Skip to content</a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <MobileCta from={essential ? inr(essential.priceMin) : undefined} />
      <SiteTracker />
      <JsonLd data={[organizationLd(), websiteLd()]} />
    </div>
  );
}
