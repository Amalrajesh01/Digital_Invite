import Link from "next/link";
import { brand } from "@/lib/brand";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6 text-center">
      <div className="max-w-md">
        <p className="display text-[3rem] text-brass" aria-hidden>❦</p>
        <h1 className="display mt-4 text-[2rem]">We couldn’t find this invitation</h1>
        <p className="mt-3 text-muted">The link may be mistyped. Please check with the family and try again.</p>
        <p className="mt-10 text-sm text-muted"><Link href="/" className="underline underline-offset-4">{brand.name}</Link></p>
      </div>
    </main>
  );
}
