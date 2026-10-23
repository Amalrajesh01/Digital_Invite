import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Heart, Lock, Music2 } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { categoryOf, letterBySlug } from "@/domain/letters";
import { describeExperience, musicLabel, whatYouAdd } from "@/domain/letters/describe";
import { isLetterEnabled, listPublicLetters } from "@/domain/letters/service";
import { giftPriceText } from "@/domain/gifts/pricing";
import { Heading, Section, Wrap } from "@/components/site/blocks";
import { SiteButton } from "@/components/site/WaButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const spec = letterBySlug((await params).slug);
  if (!spec) return {};
  return pageMetadata({ path: `/for-my-love/letters/${spec.slug}`, title: `${spec.title} — a Forever Letter`, description: `${spec.purpose} ${spec.feeling} A private, personal experience you make in minutes and send as one link.`, image: "WHNWkO1lBKU" });
}

export default async function LetterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const spec = letterBySlug(slug);
  if (!spec || !(await isLetterEnabled(slug))) notFound();
  const cat = categoryOf(spec.category);
  const moments = describeExperience(spec);
  const adds = whatYouAdd(spec);
  const others = (await listPublicLetters()).filter((c) => c.category === spec.category && c.slug !== spec.slug).slice(0, 4);
  const p = spec.palette;
  return (
    <>
      <section className="relative overflow-hidden bg-[#1a0f1c] text-white">
        <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(60% 55% at 85% 10%, ${p.accent}55, transparent 62%), radial-gradient(45% 40% at 0% 100%, ${p.accent2}33, transparent 62%)` }} />
        <Wrap className="relative grid items-center gap-12 pb-16 pt-8 lg:grid-cols-[1fr_auto] lg:gap-20 lg:pb-24 lg:pt-12">
          <div>
            <Link href="/for-my-love#all-letters" className="inline-flex min-h-11 items-center gap-1.5 text-[14.5px] text-white/70 hover:text-white"><ArrowLeft className="size-4" aria-hidden /> All Forever Letters</Link>
            <p className="eyebrow mt-4 !text-[#f3a5b6]"><Heart className="mr-1.5 inline size-3.5 fill-current" aria-hidden />{cat.name}</p>
            <h1 className="mt-3 max-w-2xl font-serif text-[clamp(40px,6vw,76px)] font-medium leading-[1.02] tracking-[-0.012em]">{spec.title}</h1>
            <p className="mt-5 max-w-xl font-serif text-[clamp(21px,2.4vw,28px)] italic leading-snug text-[#f6d6dd]">{spec.purpose}</p>
            <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-white/75">{spec.feeling} {spec.direction}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <SiteButton href={`/for-my-love/make?letter=${spec.slug}`} variant="light" data-track="cta_click" data-ref={`letter-make-${spec.slug}`}>Make this letter <ArrowRight className="size-4" aria-hidden /></SiteButton>
              <a href="#play" className="btn btn-lg border-white/30 text-white hover:bg-white/10">Play the demonstration</a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-[14.5px] text-white/65"><Lock className="size-4" aria-hidden /> Private by design. {giftPriceText()} when you send it to us to publish; making and previewing it is free.</p>
            <ul className="mt-6 flex items-center gap-2" aria-label="Colours of this letter">{[p.bg, p.accent, p.accent2].map((c) => <li key={c} className="size-6 rounded-full border border-white/30" style={{ background: c }} />)}</ul>
          </div>
          <div id="play" className="mx-auto w-full max-w-[22rem] scroll-mt-24">
            <div className="overflow-hidden rounded-[2.4rem] border-[9px] border-black bg-black shadow-[0_44px_80px_-36px_rgba(0,0,0,.8)]">
              <iframe src={`/for-my-love/letter-demo/${spec.slug}`} title={`${spec.title}, played as a demonstration`} loading="lazy" className="block h-[40rem] w-full border-0 bg-white" referrerPolicy="no-referrer" />
            </div>
            <p className="mt-3 text-center text-[13px] text-white/60">A real, playable demonstration. The words are examples; nothing you do here is sent.</p>
          </div>
        </Wrap>
      </section>

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-3">
          <div>
            <Heading eyebrow="What happens" title="Moment by moment." as="h2" className="!max-w-none [&>h2]:!text-[clamp(30px,3.4vw,40px)]" />
            <ol className="mt-6 grid gap-3 text-[16.5px] leading-snug text-ink-2/90">
              {moments.map((m, i) => (<li key={m} className="flex gap-3"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-rose-soft text-[12px] font-bold text-rose">{i + 1}</span>{m}</li>))}
            </ol>
          </div>
          <div>
            <Heading eyebrow="What you add" title="Your words, your photographs." as="h2" className="!max-w-none [&>h2]:!text-[clamp(30px,3.4vw,40px)]" />
            <ul className="mt-6 grid gap-3 text-[16.5px] leading-snug text-ink-2/90">
              {adds.map((a) => (<li key={a} className="flex gap-3"><Heart className="mt-1 size-4 shrink-0 fill-rose text-rose" aria-hidden />{a}</li>))}
              <li className="flex gap-3 text-muted"><Music2 className="mt-1 size-4 shrink-0" aria-hidden />Suggested sound: {musicLabel(spec)}. Music never starts by itself.</li>
            </ul>
          </div>
          <div>
            <Heading eyebrow="Our promise" title="What it will never do." as="h2" className="!max-w-none [&>h2]:!text-[clamp(30px,3.4vw,40px)]" />
            <ul className="mt-6 grid gap-3 text-[16.5px] leading-snug text-ink-2/90">
              {[...spec.care, "It never plays music, notifies, or contacts the person by itself."].map((c) => (<li key={c} className="flex gap-3"><Lock className="mt-1 size-4 shrink-0 text-rose" aria-hidden />{c}</li>))}
            </ul>
          </div>
        </div>
      </Section>

      {others.length > 0 && (
        <Section tone="paper">
          <Heading eyebrow={cat.name} title="More from this chapter." lede={cat.blurb} />
          <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {others.map((c) => (
              <li key={c.slug}>
                <Link href={`/for-my-love/letters/${c.slug}`} className="group block">
                  <img src={c.cover} alt="" width={540} height={1020} loading="lazy" className="aspect-[9/17] w-full rounded-[1.3rem] border-[4px] border-ink object-cover object-top transition group-hover:-translate-y-1" />
                  <span className="mt-3 block font-serif text-[21px] leading-tight text-ink group-hover:text-rose">{c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "For My Love", path: "/for-my-love" }, { name: spec.title, path: `/for-my-love/letters/${spec.slug}` }])]} />
    </>
  );
}
