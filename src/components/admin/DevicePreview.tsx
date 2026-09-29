"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type Device = "mobile" | "tablet" | "desktop";
export const DEVICE_SIZE: Record<Device, { w: number; h: number; label: string }> = {
  mobile: { w: 390, h: 844, label: "Phone" },
  tablet: { w: 820, h: 1100, label: "Tablet" },
  desktop: { w: 1360, h: 860, label: "Desktop" },
};

export interface DevicePreviewHandle {
  post: (msg: unknown) => void;
  reload: () => void;
}

/** A scaled iframe in a device frame. The page inside is the real invitation at the device's true width. */
export const DevicePreview = forwardRef<DevicePreviewHandle, { src: string; device: Device; className?: string; onMessage?: (data: { type: string; [k: string]: unknown }) => void; title?: string }>(function DevicePreview({ src, device, className, onMessage, title = "Invitation preview" }, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [box, setBox] = useState({ w: 600, h: 700 });
  const [key, setKey] = useState(0);
  const size = DEVICE_SIZE[device];
  const onMsg = useRef(onMessage);
  onMsg.current = onMessage;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow || !e.data?.type) return;
      onMsg.current?.(e.data);
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, []);

  useImperativeHandle(ref, () => ({ post: (msg) => frame.current?.contentWindow?.postMessage(msg, window.location.origin), reload: () => setKey((k) => k + 1) }), []);

  const chrome = device === "mobile" ? 14 : device === "tablet" ? 12 : 0;
  const availW = Math.max(200, box.w - 8);
  const availH = Math.max(300, box.h - 8);
  const scale = Math.min(1, availW / (size.w + chrome * 2), availH / (size.h + chrome * 2 + (device === "desktop" ? 34 : 0)));
  const outerW = (size.w + chrome * 2) * scale;
  const topBar = device === "desktop" ? 34 : 0;
  const outerH = (size.h + chrome * 2 + topBar) * scale;

  return (
    <div ref={wrap} className={cn("flex h-full w-full items-start justify-center", className)}>
      <div style={{ width: outerW, height: outerH }} className="relative shrink-0">
        <div style={{ width: size.w + chrome * 2, height: size.h + chrome * 2 + topBar, transform: `scale(${scale})`, transformOrigin: "top left" }} className={cn("absolute left-0 top-0 overflow-hidden bg-ink shadow-[var(--shadow-2)]", device === "mobile" ? "rounded-[42px]" : device === "tablet" ? "rounded-[28px]" : "rounded-lg")} >
          {device === "desktop" && (
            <div className="flex h-[34px] items-center gap-2 bg-paper-2 px-3" aria-hidden>
              <span className="size-2.5 rounded-full bg-[#e0685e]" /><span className="size-2.5 rounded-full bg-[#e6b84f]" /><span className="size-2.5 rounded-full bg-[#5bbf6a]" />
              <span className="ml-3 h-5 flex-1 rounded bg-surface" />
            </div>
          )}
          <iframe key={key} ref={frame} src={src} title={title} style={{ width: size.w, height: size.h, margin: chrome, borderRadius: device === "mobile" ? 30 : device === "tablet" ? 18 : 0 }} className="block border-0 bg-white" />
        </div>
      </div>
    </div>
  );
});
