"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function CopyButton({ text, label = "Copy", variant = "quiet", size = "sm" }: { text: string; label?: string; variant?: "quiet" | "ghost" | "primary"; size?: "sm" | "md" }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant={variant}
      size={size}
      icon={done ? <Check className="size-4" /> : <Copy className="size-4" />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          toast.success("Copied");
          setTimeout(() => setDone(false), 1800);
        } catch {
          toast.error("Could not copy — select the text and copy it manually.");
        }
      }}
    >
      {done ? "Copied" : label}
    </Button>
  );
}
