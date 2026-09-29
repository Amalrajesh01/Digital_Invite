import type { Metadata } from "next";
import { InviteScreen, inviteMetadata } from "@/invitation/server/render";

export const dynamic = "force-dynamic";
type Q = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string; token: string }>; searchParams: Q }): Promise<Metadata> {
  const p = await params;
  const q = await searchParams;
  return inviteMetadata(p.slug, p.token, one(q.state));
}

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string; token: string }>; searchParams: Q }) {
  const p = await params;
  const q = await searchParams;
  return <InviteScreen slug={p.slug} token={p.token} state={one(q.state)} skipGate={one(q.gate) === "0"} />;
}
