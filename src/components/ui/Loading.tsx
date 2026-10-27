import { cn } from "@/lib/cn";

/** Loading screens: the shape of the page that is coming, shimmering, so nothing jumps when it arrives. */
const Bar = ({ className }: { className: string }) => <div aria-hidden className={cn("skeleton", className)} />;
const Status = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div role="status" aria-busy="true" aria-live="polite" className={className}><span className="sr-only">Loading…</span>{children}</div>
);

/** A page of the product site: a heading, a line of text, a row of buttons, then a grid of cards. */
export function SiteLoading() {
  return (
    <Status className="mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:pt-20">
      <Bar className="h-3 w-28" />
      <Bar className="mt-5 h-12 w-4/5 max-w-2xl sm:h-16" />
      <Bar className="mt-4 h-4 w-full max-w-xl" />
      <Bar className="mt-2 h-4 w-3/5 max-w-md" />
      <div className="mt-8 flex gap-3"><Bar className="h-12 w-44 !rounded-full" /><Bar className="h-12 w-32 !rounded-full" /></div>
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">{[0, 1, 2].map((i) => <Bar key={i} className="h-56 !rounded-2xl" />)}</div>
    </Status>
  );
}

/** The design gallery: a filter, then phone-shaped cards. */
export function GalleryLoading() {
  return (
    <Status className="mx-auto w-full max-w-6xl px-5 pb-24 pt-12 sm:pt-20">
      <Bar className="h-3 w-32" />
      <Bar className="mt-5 h-11 w-4/5 max-w-xl sm:h-14" />
      <Bar className="mt-6 h-12 w-full !rounded-xl sm:w-2/3" />
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i}>
            <Bar className="aspect-[9/19] w-full !rounded-[1.7rem]" />
            <Bar className="mt-4 h-6 w-3/4" />
            <Bar className="mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </Status>
  );
}

/** A guest's invitation or a preview, while it is being fetched: a phone-shaped sheet with a portrait and a few lines. */
export function InvitationLoading() {
  return (
    <Status className="grid min-h-dvh place-items-center bg-[#f4f1ec] px-6">
      <div className="w-full max-w-sm text-center">
        <Bar className="mx-auto aspect-[4/5] w-3/4 !rounded-[999px]" />
        <Bar className="mx-auto mt-8 h-3 w-1/2" />
        <Bar className="mx-auto mt-4 h-9 w-4/5" />
        <Bar className="mx-auto mt-4 h-4 w-3/5" />
      </div>
    </Status>
  );
}

/** The studio, workspace and admin: a title row and a stack of panels. */
export function AppLoading() {
  return (
    <Status className="w-full p-4 sm:p-8">
      <Bar className="h-8 w-56" />
      <Bar className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Bar key={i} className="h-24 !rounded-xl" />)}</div>
      <div className="mt-6 grid gap-3">{[0, 1, 2, 3, 4].map((i) => <Bar key={i} className="h-14 !rounded-lg" />)}</div>
    </Status>
  );
}
