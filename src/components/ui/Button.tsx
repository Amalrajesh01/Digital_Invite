"use client";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "quiet" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const V: Record<Variant, string> = { primary: "btn-primary", accent: "btn-accent", quiet: "btn-quiet", ghost: "btn-ghost", danger: "btn-danger" };
const S: Record<Size, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

interface Common {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, className, children, icon, disabled, ...rest }: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} type={rest.type ?? "button"} disabled={disabled || loading} aria-busy={loading || undefined} className={cn("btn", V[variant], S[size], className)}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", size = "md", className, children, icon, href, ...rest }: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cls = cn("btn", V[variant], S[size], className);
  const external = /^https?:|^mailto:|^tel:|^\/api\//.test(href);
  if (external) {
    return (
      <a {...rest} href={href} className={cls}>
        {icon}
        {children}
      </a>
    );
  }
  return (
    <Link {...rest} href={href} className={cls}>
      {icon}
      {children}
    </Link>
  );
}
