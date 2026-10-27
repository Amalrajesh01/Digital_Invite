"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** A design's link. On a phone it opens the full invitation straight away; everywhere else it goes to the design's page. */
export function CardLink({ href, preview, ...rest }: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string; preview?: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        rest.onClick?.(e);
        if (!preview || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (window.matchMedia("(max-width: 767px)").matches) { e.preventDefault(); router.push(preview); }
      }}
    />
  );
}
