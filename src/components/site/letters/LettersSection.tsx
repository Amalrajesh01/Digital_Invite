import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { availableTags } from "@/domain/letters";
import { listPublicLetters } from "@/domain/letters/service";
import { Wrap } from "@/components/site/blocks";
import { LettersExplorer } from "./LettersExplorer";

/**
 * Forever Letters, on the home page and on the For My Love page: a slow preview strip, then every experience that is switched on —
 * each shown only by its cover, its name and its colours. Nothing here is a list of names or a count: it is whatever the catalogue
 * and the studio's switches say it is, so fifty today may be fifty-five tomorrow.
 */
export async function LettersSection({ id = "forever-letters", hero }: { id?: string; hero?: boolean }) {
  const cards = await listPublicLetters();
  if (!cards.length) return null;
  const tags = availableTags(cards);
  const Title = hero ? "h1" : "h2";
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative overflow-hidden bg-[#1a0f1c] py-16 text-white sm:py-20 lg:py-24">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_88%_0%,rgba(214,86,120,.34),transparent_62%),radial-gradient(50%_42%_at_0%_100%,rgba(228,160,50,.18),transparent_62%)]" />
      <Wrap className="relative">
        <div className="max-w-3xl">
          <p className="eyebrow !text-[#f3a5b6]">Invites by Stack Bridge Labs</p>
          <Title id={`${id}-title`} className="mt-3 font-serif text-[clamp(46px,7vw,92px)] font-medium leading-[0.98] tracking-[-0.015em]">
            Forever <em className="italic text-[#f6b6c4]">Letters</em>
          </Title>
          <p className="mt-4 font-serif text-[clamp(22px,2.6vw,30px)] italic leading-snug text-[#f6d6dd]">Because some feelings deserve more than an ordinary message.</p>
          <p className="mt-5 max-w-2xl text-[17.5px] leading-relaxed text-white/80">
            Little experiences for the person who means everything: a date invitation they have to unwrap, a confession told in clues, a proposal, a birthday treasure hunt, an anniversary that travels back in time, an apology that asks for nothing, a gentle goodbye. You make it yours with your own words and photographs, and send it as one private link.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#all-letters" className="btn btn-lg bg-white text-ink hover:bg-white/90" data-track="cta_click" data-ref="letters-browse">Browse them all <ArrowRight className="size-4" aria-hidden /></a>
            <Link href="/for-my-love/make" className="btn btn-lg border-white/30 text-white hover:bg-white/10" data-track="cta_click" data-ref="letters-make">Start making one</Link>
          </div>
        </div>
        <div className="mt-12"><LettersExplorer cards={cards} tags={tags} /></div>
        <p className="mt-10 max-w-2xl text-[14.5px] leading-relaxed text-white/60">The words in every preview are examples. Each letter is private, can be paused or deleted by you at any time, and never asks the person who receives it to answer, forgive or react.</p>
      </Wrap>
    </section>
  );
}
