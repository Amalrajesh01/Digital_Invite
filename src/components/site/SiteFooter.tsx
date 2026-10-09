import Link from "next/link";
import { brand } from "@/lib/brand";
import { companyLink } from "@/lib/site";
import { waLink, WA } from "@/lib/whatsapp";
import { CATEGORIES, categoryBySlug } from "@/domain/catalogue/categories";
import { demosIn } from "@/domain/catalogue/demos";
import { ProductLockup } from "@/components/brand/Logo";
import { WaIcon } from "./WaButton";

const OCCASIONS = ["wedding", "engagement", "birthday", "anniversary", "corporate", "conclave", "conference", "funeral"] as const;

/** The product site’s footer: where to go, what we make it for, who makes it — and a line that goes to WhatsApp. */
export function SiteFooter() {
  const links = OCCASIONS.map((s) => categoryBySlug(s)).filter((c): c is NonNullable<typeof c> => !!c && demosIn(c.slug).length > 0);
  return (
    <footer className="bg-[#0b1b35] text-white">
      <div className="mx-auto grid max-w-[76rem] gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <ProductLockup tone="dark" />
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/70">Beautiful digital invitations, crafted for moments that matter — in English and the language your family speaks.</p>
          <a href={waLink(WA.general)} target="_blank" rel="noopener noreferrer" className="btn btn-sm mt-6 bg-[#1fa855] text-white hover:bg-[#188f47]">
            <WaIcon className="size-4" /> Talk to us on WhatsApp
          </a>
        </div>
        <nav aria-label="Product">
          <p className="eyebrow !text-white/50">Explore</p>
          <ul className="mt-4 grid gap-2.5 text-[15px]">
            {[["/templates", "Templates"], ["/categories", "Categories"], ["/pricing", "Pricing"], ["/how-it-works", "How it works"], ["/faq", "FAQ"]].map(([href, label]) => (
              <li key={href}><Link href={href} className="text-white/80 hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Occasions">
          <p className="eyebrow !text-white/50">Occasions</p>
          <ul className="mt-4 grid gap-2.5 text-[15px]">
            {links.map((c) => (
              <li key={c.slug}><Link href={`/templates/${c.slug}`} className="text-white/80 hover:text-white">{c.name} invitations</Link></li>
            ))}
            <li><Link href="/categories" className="text-white/80 hover:text-white">All {CATEGORIES.length} occasions →</Link></li>
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className="eyebrow !text-white/50">{brand.company}</p>
          <ul className="mt-4 grid gap-2.5 text-[15px]">
            <li><a href={companyLink()} className="text-white/80 hover:text-white">{brand.company} home</a></li>
            <li><a href={companyLink("/services/all-solutions")} className="text-white/80 hover:text-white">Our services</a></li>
            <li><a href={brand.contactUrl} className="text-white/80 hover:text-white">Contact</a></li>
            <li><Link href="/login" className="text-white/80 hover:text-white">Sign in to the studio</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-6 text-[13.5px] text-white/60 sm:px-8">
          <p>
            © {new Date().getFullYear()} {brand.company}. {SENTENCE}
          </p>
          <p>
            Invites is built and run by{" "}
            <a href={companyLink()} className="underline underline-offset-4 hover:text-white">{brand.company}</a>.
          </p>
        </div>
      </div>
    </footer>
  );
}

const SENTENCE = "All sample invitations on this site use fictional names, dates and places; photographs show real people as stand-ins.";
