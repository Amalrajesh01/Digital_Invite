import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoNames, letterBySlug, slimSpec } from "@/domain/letters";
import { demoValues } from "@/domain/letters/values";
import { isLetterEnabled } from "@/domain/letters/service";
import { ForeverPlayer } from "@/invitation/letters/Player";

export const metadata: Metadata = { title: "A Forever Letter — demonstration", robots: { index: false, follow: false, noarchive: true }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

/**
 * The public demonstration of one Forever Letter, played exactly as a recipient would play it — with example words and photographs, a
 * “demonstration” label on every screen, and nothing sent anywhere. It is not a gift: no row exists for it, no one can reply to it.
 * `?beat=N` opens it on a later screen (used by the gallery's pictures); it is ignored for anything but a demonstration.
 */
export default async function LetterDemo({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const q = await searchParams;
  const spec = letterBySlug(slug);
  if (!spec || !(await isLetterEnabled(slug).catch(() => true))) notFound();
  const start = Math.max(0, Math.min(40, Number(q.beat ?? 0) || 0));
  return (
    <ForeverPlayer
      spec={slimSpec(spec)} values={demoValues(spec)} names={demoNames(spec)} ui={q.lang === "ml" ? "ml" : "en"} mode="demo" replyMode="collect" whatsapp={null}
      playfulNo={spec.playfulNo === true} shareAnswers={false} intensity="standard" startAt={start} audio={null}
    />
  );
}
