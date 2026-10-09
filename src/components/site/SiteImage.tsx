import { cn } from "@/lib/cn";
import { stockInfo } from "@/domain/imagery/stock";
import { FallbackImg } from "./FallbackImg";

/**
 * A photograph on the product site. It comes from our own bundled set (`/stock/<id>`, resized, WebP, cached), is
 * lazy-loaded below the fold, reserves its space so the page never jumps — and if it cannot load for any reason the
 * tinted placeholder behind it shows, never a broken-image icon. (A server component: the metadata of the whole stock
 * set stays out of the browser bundle.)
 */
const WIDTHS = [480, 800, 1080, 1440, 1920];
export type SiteRatio = "1:1" | "4:5" | "3:4" | "2:3" | "3:2" | "4:3" | "16:9" | "21:9" | "9:19";

export function SiteImage({ id, alt, ratio = "4:5", sizes = "(max-width: 768px) 100vw, 50vw", priority, className, imgClassName, rounded = true, caption }: {
  id: string; alt?: string; ratio?: SiteRatio; sizes?: string; priority?: boolean; className?: string; imgClassName?: string; rounded?: boolean; caption?: boolean;
}) {
  const info = stockInfo(id);
  const [rw, rh] = ratio.split(":").map(Number);
  const text = alt ?? info?.alt ?? "";
  return (
    <figure className={cn("relative m-0 overflow-hidden bg-paper-2", rounded && "rounded-lg", className)} style={{ aspectRatio: `${rw} / ${rh}` }}>
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_30%_10%,var(--brass-soft),var(--paper-2)_65%)]" />
      {info && (
        <FallbackImg
          src={`/stock/${id}?w=1080&r=${ratio}`}
          srcSet={WIDTHS.map((w) => `/stock/${id}?w=${w}&r=${ratio} ${w}w`).join(", ")}
          sizes={sizes}
          alt={text}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          className={cn("absolute inset-0 size-full object-cover", imgClassName)}
        />
      )}
      {caption && text && <figcaption className="sr-only">{text}</figcaption>}
    </figure>
  );
}
