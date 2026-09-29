"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { Sheet } from "./Sheet";
import { Button } from "./Button";

interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}
type Ask = (o: ConfirmOptions) => Promise<boolean>;
const Ctx = createContext<Ask | null>(null);

/** Confirmation flows for anything destructive or outward-facing (publish, delete, archive). */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const ask = useCallback<Ask>((o) => new Promise((resolve) => setState({ ...o, resolve })), []);
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  return (
    <Ctx.Provider value={ask}>
      {children}
      <Sheet
        open={!!state}
        onClose={() => close(false)}
        title={state?.title ?? ""}
        footer={
          <>
            <Button variant="quiet" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button variant={state?.tone === "danger" ? "danger" : "primary"} onClick={() => close(true)}>
              {state?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      >
        <div className="text-[15px] leading-relaxed text-ink-2">{state?.message}</div>
      </Sheet>
    </Ctx.Provider>
  );
}

export function useConfirm(): Ask {
  const c = useContext(Ctx);
  if (!c) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return c;
}
