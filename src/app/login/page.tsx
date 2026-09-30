import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/session";
import { brand, contactHref } from "@/lib/brand";
import { env } from "@/lib/env";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; expired?: string }> }) {
  const actor = await getCurrentActor();
  const q = await searchParams;
  if (actor) redirect(actor.kind === "admin" ? "/admin" : "/client");
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[#0b1b35] p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "linear-gradient(#4a6cf7 1px, transparent 1px), linear-gradient(90deg, #4a6cf7 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(ellipse at 80% 90%, #000 0%, transparent 70%)" }} />
        <div aria-hidden className="absolute -bottom-48 -right-32 size-[40rem] rounded-full bg-[#3056d3]/30 blur-3xl" />
        <Link href="/" aria-label={`${brand.name} home`} className="relative"><Logo tone="dark" height={52} /></Link>
        <div className="relative max-w-lg">
          <p className="eyebrow !text-[#9db1f5]">Invite · Experience · Remember</p>
          <h1 className="display mt-5 text-[52px]">A wedding invitation people keep.</h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/70">Design once, share with every guest, and return years later to a living memory of the day.</p>
        </div>
        <p className="relative text-sm text-white/50">{brand.name} · by {brand.company}</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[26rem]">
          <Link href="/" aria-label={`${brand.name} home`} className="mb-10 block lg:hidden"><Logo height={44} /></Link>
          <h2 className="display text-[34px]">Welcome back</h2>
          <p className="lede mt-2">Sign in to manage invitations, guests and memories.</p>
          {q.expired && (
            <p role="alert" className="mt-5 rounded-md border border-[#f0b9b3] bg-bad-soft px-4 py-3 text-[14px] text-bad">
              That sign-in link has expired or was already used. Request a new one below.
            </p>
          )}
          <LoginForm next={q.next} showDemoHint={!env.isProd} />
          <p className="mt-10 text-[13px] text-muted">
            Trouble signing in?{" "}
            <a className="underline underline-offset-4" href={contactHref("Sign-in help")}>Contact {brand.company}</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
