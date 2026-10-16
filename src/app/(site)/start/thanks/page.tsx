import Link from "next/link";
import { Check } from "lucide-react";
import { waLink } from "@/lib/whatsapp";
import { WaIcon } from "@/components/site/WaButton";
import { Wrap } from "@/components/site/blocks";
import { siteTemplateBySlug } from "@/domain/catalogue/templates";

export const metadata = { title: "Thank you", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Thanks({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const name = first(q.name).slice(0, 40);
  const ref = first(q.ref).replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase();
  const tpl = siteTemplateBySlug(first(q.t));
  const text = `Hi, I just sent an enquiry${ref ? ` (ref ${ref})` : ""}${tpl ? ` for the “${tpl.name}” design` : ""}.${name ? ` I am ${name}.` : ""}`;
  return (
    <section className="bg-[linear-gradient(180deg,#fbf7f0,#ffffff)] py-16 sm:py-24">
      <Wrap className="max-w-2xl text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-ok-soft text-ok"><Check className="size-7" aria-hidden /></span>
        <h1 className="mt-6 font-serif text-[clamp(38px,5vw,58px)] font-medium leading-[1.04] text-ink">Thank you{name ? `, ${name}` : ""}.</h1>
        <p className="mt-4 text-[18px] leading-relaxed text-ink-2/85">We have your details{ref ? <> — your reference is <b className="tnum">{ref}</b></> : ""}. We will message you on WhatsApp.</p>
        <p className="mt-2 text-[16px] text-muted">Want to speak sooner? Say hello now and we will pick it up from there.</p>
        <a href={waLink(text)} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" data-ref="thanks" className="btn btn-lg mt-8 bg-[#1fa855] text-white hover:bg-[#188f47]"><WaIcon /> Say hello on WhatsApp</a>
        <p className="mt-10 text-[15px] text-muted">In the meantime, <Link href="/templates" className="text-accent underline underline-offset-4">look at more designs</Link>, or read <Link href="/how-it-works" className="text-accent underline underline-offset-4">how it works</Link>.</p>
      </Wrap>
    </section>
  );
}
