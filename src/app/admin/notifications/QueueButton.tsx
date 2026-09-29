"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { processQueueAction } from "@/app/actions/admin";

export function QueueButton({ queued }: { queued: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant="quiet" loading={pending} disabled={queued === 0} onClick={() => start(async () => { const r = await processQueueAction(); if (r.ok) { toast.success(`Processed ${r.data} message${r.data === 1 ? "" : "s"}`); router.refresh(); } else toast.error(r.error.message); })}>
      Send waiting messages{queued ? ` (${queued})` : ""}
    </Button>
  );
}
