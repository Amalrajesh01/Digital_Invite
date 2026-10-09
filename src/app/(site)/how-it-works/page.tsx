import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { FinalCta, HOW_IT_WORKS, Heading, Section, Wrap } from "@/components/site/blocks";
import { SiteImage } from "@/components/site/SiteImage";

export const metadata = pageMetadata({
  path: "/how-it-works",
  title: "How it works — from a link you like to a link you share",
  description: "Choose a template, share your details on WhatsApp, approve a private preview and publish. Five simple steps to a digital invitation your guests will keep.",
  image: "1dzXfvALJxs",
});

const DETAIL = [
  { img: "ch4Fc1cGTq4", more: ["Every sample on the site is a real, published invitation — open it on your phone, tap the envelope, scroll to the end.", "You do not have to match the sample: the colours, the order of the sections and every word can change."] },
  { img: "AD3k4pko7wo", more: ["We ask for the names, the date, the place and a few photographs — and anything you want guests to know: dress code, parking, a ritual to explain.", "WhatsApp is the easiest way to send it; a form works too."] },
  { img: "1dzXfvALJxs", more: ["We write the layout, set your photographs, and — if you want — the local language in a typeface made for the script.", "You see a private preview, with your names on it, before anything is shared. Ask for as many changes as you need."] },
  { img: "dYgv-1JnPTA", more: ["When you approve, the invitation goes live on its own link — a short one you choose.", "Share it on WhatsApp, in a group, by message, or as a QR code on a printed card. Guests need no app."] },
  { img: "OmLrFODvPII", more: ["Replies arrive in one place, with meals, stay and travel needs counted for you. Wishes and photographs appear when you approve them.", "Afterwards the same link becomes a gallery, a guestbook and a keepsake."] },
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbfaf7,#ffffff)] pb-4 pt-14 sm:pt-20">
        <Wrap>
          <Heading as="h1" eyebrow="How it works" title="From a link you like to a link you share." lede="You do not need to design anything. Choose, tell us the details, and we do the rest — with you in the loop at every step." />
        </Wrap>
      </section>
      <Section tone="white" className="!pt-10">
        <ol className="grid gap-16 sm:gap-20">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <div className={i % 2 ? "md:order-2" : ""}>
                <p className="font-serif text-[88px] font-light leading-none text-accent/25" aria-hidden>{String(i + 1).padStart(2, "0")}</p>
                <h2 className="-mt-2 font-serif text-[clamp(30px,3.6vw,44px)] font-medium leading-tight text-ink">{s.title}</h2>
                <p className="mt-4 text-[17.5px] leading-relaxed text-ink-2/85">{s.body}</p>
                <ul className="mt-5 space-y-3 text-[16px] leading-relaxed text-ink-2/80">
                  {DETAIL[i].more.map((m) => (<li key={m} className="border-l-2 border-accent/30 pl-4">{m}</li>))}
                </ul>
              </div>
              <div className={i % 2 ? "md:order-1" : ""}>
                <SiteImage id={DETAIL[i].img} ratio="4:3" sizes="(max-width: 768px) 100vw, 560px" priority={i === 0} />
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <FinalCta title="Ready when you are." body="Message us the occasion and the date. We reply personally, and we will tell you honestly whether it is possible." message={WA.general} primary={{ href: "/templates", label: "Browse templates" }} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "How it works", path: "/how-it-works" }])} />
    </>
  );
}
