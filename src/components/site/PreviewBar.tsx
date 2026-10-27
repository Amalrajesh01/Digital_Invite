"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** When a phone opens a design straight from the gallery (?from=gallery): the way back and the way forward, over the invitation. Not shown inside the framed preview. */
export function PreviewBar({ start }: { start: string }) {
  const router = useRouter();
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(window.top === window.self && new URLSearchParams(location.search).get("from") === "gallery"); }, []);
  if (!on) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[2147483000] flex items-center gap-2 border-t border-black/10 bg-white/95 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-[15px] text-[#17141f] backdrop-blur" style={{ fontFamily: "var(--font-ui), system-ui, sans-serif" }}>
      <button type="button" onClick={() => (history.length > 1 ? router.back() : router.push("/templates"))} className="min-h-11 rounded-full border border-black/15 px-4 font-medium">← Designs</button>
      <a href={start} className="min-h-11 flex-1 rounded-full bg-[#3056d3] px-4 py-2.5 text-center font-semibold text-white">Use This Design</a>
    </div>
  );
}
