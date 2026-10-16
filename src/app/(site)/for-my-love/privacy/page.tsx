import { pageMetadata } from "@/lib/seo";
import { WA } from "@/lib/whatsapp";
import { FinalCta, Heading, Section, Wrap } from "@/components/site/blocks";
import { DRAFT_DAYS, MAX_PHOTOS, SUBMITTED_DAYS } from "@/domain/gifts/service";

export const metadata = pageMetadata({ path: "/for-my-love/privacy", title: "Our privacy promise for love gifts", description: "Who can see a For My Love gift, how long we keep it, and how you can pause or delete it at any time." });

const PROMISES: [string, string][] = [
  ["It lives on a link nobody can guess.", "Every gift has its own address made of random letters and numbers. It is not listed on this site, search engines are told to ignore it, and the link preview in WhatsApp shows no names and no photograph."],
  ["Only you can change it.", "When you make a gift, you get a private link that is the only way to edit, pause or delete it. We keep only a scrambled copy of the secret in it, so even we cannot open your edit page."],
  ["You can switch it off in one tap.", "Pausing stops the gift's link working immediately. You can switch it back on whenever you like."],
  ["You can delete everything.", "Delete the gift and every photograph, and the song, is removed straight away — from the gift and from our storage."],
  ["Nobody is asked to do anything.", "The person who receives it is never asked to reply, answer or react. A reply button appears only if you switch it on, and the apology gift never asks for forgiveness."],
  ["We do not use it for anything else.", "Your words and photographs are used only to show your gift. We do not advertise with them, share them, or train anything on them. Our team sees a gift only when you send it to us to publish."],
];

export default function GiftPrivacy() {
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fbe8ec,#ffffff)] pb-6 pt-14 sm:pt-20">
        <Wrap><Heading as="h1" eyebrow="For My Love" title="Our privacy promise." lede="A love gift is personal. Here, in plain words, is who can see it, how long we keep it and how to take it back." /></Wrap>
      </section>
      <Section tone="white" className="!pt-10">
        <ul className="grid gap-x-12 gap-y-9 md:grid-cols-2">
          {PROMISES.map(([t, b]) => (<li key={t}><h2 className="text-[20px] font-semibold text-ink">{t}</h2><p className="mt-2 text-[16.5px] leading-relaxed text-ink-2/85">{b}</p></li>))}
        </ul>
      </Section>
      <Section tone="paper">
        <Heading eyebrow="How long we keep it" title="Clear retention terms." />
        <dl className="mt-8 grid max-w-3xl gap-6 text-[16.5px]">
          {[
            ["A gift you start but never send to us", `Deleted automatically, with its photographs, ${DRAFT_DAYS} days after you last started it.`],
            ["A gift you have sent us, not yet published", `Kept for up to ${SUBMITTED_DAYS} days while we talk with you. If it is not published by then, it is deleted.`],
            ["A published gift", "Online until you pause or delete it. We will not remove or change it ourselves, except at your request."],
            ["A deleted gift", "Gone from the site and from our storage straight away. Our own backups of the database are kept for 7 days and then replaced, so a deleted gift can remain in a backup for up to a week."],
            ["Limits", `A gift can hold up to ${MAX_PHOTOS} photographs and one song. Please add music only if you have the right to share it.`],
          ].map(([a, b]) => (<div key={a} className="border-l-2 border-rose/40 pl-5"><dt className="font-semibold text-ink">{a}</dt><dd className="mt-1 text-ink-2/85">{b}</dd></div>))}
        </dl>
      </Section>
      <FinalCta title="Questions about your gift?" body="Ask us anything about privacy. A real person at Stack Bridge Labs replies." message={WA.general} primary={{ href: "/for-my-love/make", label: "Make a gift" }} />
    </>
  );
}
