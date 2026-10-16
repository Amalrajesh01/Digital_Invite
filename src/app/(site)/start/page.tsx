import { Check } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { CATEGORIES } from "@/domain/catalogue/categories";
import { SITE_TEMPLATES, siteTemplateBySlug } from "@/domain/catalogue/templates";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { WaButton } from "@/components/site/WaButton";
import { Wrap } from "@/components/site/blocks";
import { WA } from "@/lib/whatsapp";

export const metadata = { ...pageMetadata({ path: "/start", title: "Create your invitation", description: "Tell us about your celebration. We will message you on WhatsApp with a private preview." }), robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** The short form: what, who, how to reach you. Everything else we ask on WhatsApp, where people are comfortable. */
export default async function StartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const tpl = siteTemplateBySlug(first(q.template));
  const occasion = CATEGORIES.find((c) => c.slug === (tpl && !tpl.love ? tpl.category : first(q.occasion)))?.slug ?? "";
  return (
    <section className="bg-[linear-gradient(180deg,#fbf7f0,#ffffff)] py-10 sm:py-16">
      <Wrap className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
        <div>
          <p className="eyebrow">Create your invitation</p>
          <h1 className="mt-3 font-serif text-[clamp(38px,5.2vw,60px)] font-medium leading-[1.02] text-ink">Tell us about your celebration.</h1>
          <p className="mt-4 max-w-xl text-[18px] leading-relaxed text-ink-2/85">Two details are enough to begin. We will message you on WhatsApp, ask for the rest there, and send you a private preview with your details in it.</p>
          {tpl && !tpl.love && <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-marigold/40 bg-marigold-soft px-4 py-2 text-[15px] font-medium text-[#8a5410]"><Check className="size-4" aria-hidden /> You chose “{tpl.name}”</p>}
          <div className="mt-9 max-w-xl">
            <EnquiryForm
              occasions={CATEGORIES.filter((c) => !c.family && c.slug !== "for-my-love").map((c) => ({ slug: c.slug, name: c.name }))}
              templates={SITE_TEMPLATES.filter((t) => !t.love).map((t) => ({ slug: t.slug, name: `${t.name} (${t.styleLabel})`, occasion: t.category }))}
              initialOccasion={occasion}
              initialTemplate={tpl && !tpl.love ? tpl.slug : ""}
            />
          </div>
        </div>
        <aside className="lg:pt-24">
          <div className="rounded-2xl border border-rule-strong bg-white p-6 sm:p-8">
            <p className="eyebrow">What happens next</p>
            <ol className="mt-5 grid gap-5 text-[16px] text-ink-2/90">
              {[["We message you on WhatsApp", "A real person says hello and asks for names, the place and a few photographs."], ["You see it first", "We send a private preview, with your details in it. Ask for changes until it is right."], ["Then we publish it", "You pay us directly, and we give you the link to share."]].map(([t, b], i) => (
                <li key={t} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent">{i + 1}</span><span><b className="block text-ink">{t}</b>{b}</span></li>
              ))}
            </ol>
            <div className="mt-8 border-t border-rule pt-6">
              <p className="text-[15px] text-ink-2/85">Prefer to talk? Message us now.</p>
              <WaButton message={tpl ? WA.template(tpl.name) : WA.general} variant="outline" className="mt-3" trackRef="start-aside">Chat on WhatsApp</WaButton>
            </div>
          </div>
        </aside>
      </Wrap>
    </section>
  );
}
