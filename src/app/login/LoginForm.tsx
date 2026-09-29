"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { loginAction, requestMagicLinkAction } from "../actions/auth";

const schema = z.object({ email: z.string().trim().email("Enter a valid email address"), password: z.string() });
type Values = z.infer<typeof schema>;

export function LoginForm({ next, showDemoHint }: { next?: string; showDemoHint: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "link">("password");
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ devLink?: string } | null>(null);
  const [pending, start] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    setError: setFieldError,
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const submit = handleSubmit((v) =>
    start(async () => {
      setError("");
      if (!v.password) return setFieldError("password", { message: "Enter your password" });
      const res = await loginAction({ ...v, next });
      if (res.ok) router.replace(res.data.redirectTo);
      else setError(res.error.message);
    }),
  );

  const sendLink = () =>
    start(async () => {
      setError("");
      if (!(await trigger("email"))) return;
      const res = await requestMagicLinkAction(getValues("email"));
      if (res.ok) setSent({ devLink: res.data.devLink });
      else setError(res.error.message);
    });

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Sign-in method" className="mb-6 inline-flex rounded-md border border-rule-strong bg-surface p-0.5 text-[13.5px]">
        {(
          [
            ["password", "Password"],
            ["link", "Email me a link"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={mode === k}
            onClick={() => {
              setMode(k);
              setError("");
              setSent(null);
            }}
            className={cn("rounded-[4px] px-3.5 py-1.5 font-medium transition-colors", mode === k ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2")}
          >
            {label}
          </button>
        ))}
      </div>

      {sent ? (
        <div role="status" className="rounded-md border border-rule-strong bg-surface p-5">
          <Mail className="size-5 text-brass" aria-hidden />
          <p className="display mt-3 text-[24px]">Check your inbox</p>
          <p className="mt-1 text-[14.5px] text-muted">If that email belongs to a client account, a sign-in link is on its way. It works once and expires in 30 minutes.</p>
          {sent.devLink && (
            <p className="mt-4 break-all rounded bg-paper-2 p-3 text-[12.5px]">
              <span className="eyebrow mb-1 block">Development only — no email provider</span>
              <a className="underline" href={sent.devLink}>
                {sent.devLink}
              </a>
            </p>
          )}
        </div>
      ) : (
        <form
          onSubmit={
            mode === "password"
              ? submit
              : (e) => {
                  e.preventDefault();
                  sendLink();
                }
          }
          className="space-y-4"
          noValidate
        >
          <TextField label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />
          {mode === "password" && <TextField label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />}
          {error && (
            <p role="alert" className="text-[14px] text-bad">
              {error}
            </p>
          )}
          <Button type="submit" loading={pending} className="w-full" size="lg">
            {mode === "password" ? "Sign in" : "Send me a sign-in link"}
          </Button>
        </form>
      )}

      {showDemoHint && mode === "password" && (
        <div className="mt-8 rounded-md border border-dashed border-rule-strong p-4 text-[13px] text-muted">
          <p className="eyebrow mb-2">Demo accounts (development)</p>
          <p>
            Super Admin — <code>admin@aoire.in</code> / <code>ChangeMe-Now-123</code>
          </p>
          <p className="mt-1">
            Luxury client — <code>luxury.client@example.com</code> / <code>Demo-Client-123</code>
          </p>
          <p className="mt-1">
            Signature client — <code>signature.client@example.com</code> / <code>Demo-Client-123</code>
          </p>
        </div>
      )}
    </div>
  );
}
