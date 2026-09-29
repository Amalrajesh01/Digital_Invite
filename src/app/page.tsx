import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center p-8">
      <div>
        <h1 className="display text-5xl">Aoire Invites</h1>
        <p className="mt-4"><Link className="underline" href="/invite/meenakshi-and-aravind">Open the demo invitation</Link></p>
      </div>
    </main>
  );
}
