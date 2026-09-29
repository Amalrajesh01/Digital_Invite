import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/session";
import { brand } from "@/lib/brand";
import { env } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; expired?: string }> }) {
  const actor = await getCurrentActor();
  const q = await searchParams;
  if (actor) redirect(actor.kind === "admin" ? "/admin" : "/client");
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[#16352a] p-14 text-[#f6efd6] lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #c2a04c 1px, transparent 0)", backgroundSize: "26px 26px" }} />
        <div aria-hidden className="absolute -bottom-40 -right-40 size-[38rem] rounded-full border border-[#c2a04c]/40" />
        <div aria-hidden className="absolute -bottom-24 -right-24 size-[30rem] rounded-full border border-[#c2a04c]/30" />
        <Link href="/" className="display relative text-[34px] leading-none">
          {brand.name}
        </Link>
        <div className="relative max-w-lg">
          <p className="eyebrow !text-[#c2a04c]">Invite · Experience · Remember</p>
          <h1 className="display mt-5 text-[64px]">A wedding invitation people keep.</h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-[#f6efd6]/75">Design once, share with every guest, and return years later to a living memory of the day.</p>
        </div>
        <p className="relative text-sm text-[#f6efd6]/55">{brand.tagline}</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[26rem]">
          <Link href="/" className="display mb-10 block text-[30px] lg:hidden">
            {brand.name}
          </Link>
          <h2 className="display text-[40px]">Welcome back</h2>
          <p className="lede mt-2">Sign in to manage invitations, guests and memories.</p>
          {q.expired && (
            <p role="alert" className="mt-5 rounded-md border border-[#dcb2ad] bg-bad-soft px-4 py-3 text-[14px] text-bad">
              That sign-in link has expired or was already used. Request a new one below.
            </p>
          )}
          <LoginForm next={q.next} showDemoHint={!env.isProd} />
          <p className="mt-10 text-[13px] text-muted">
            Trouble signing in? Write to{" "}
            <a className="underline underline-offset-4" href={`mailto:${brand.supportEmail}`}>
              {brand.supportEmail}
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
