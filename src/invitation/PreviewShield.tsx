"use client";
import { useEffect } from "react";

/**
 * Deterrents for the public template previews. None of this stops a determined person with a screenshot tool —
 * nothing a browser can display can be made uncopyable — but it removes the easy routes (save, drag, select, print,
 * "view as page") and puts a tiled, traceable mark across everything that is captured.
 */
export function PreviewShield({ mark }: { mark: string }) {
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    const keys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["s", "u", "p", "a", "c"].includes(k)) e.preventDefault();
      if (e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k))) e.preventDefault();
    };
    for (const ev of ["contextmenu", "dragstart", "copy", "cut", "selectstart"]) document.addEventListener(ev, stop);
    document.addEventListener("keydown", keys);
    const style = document.createElement("style");
    style.textContent = `@media print{html{display:none!important}} .inv img{-webkit-user-drag:none;user-select:none;pointer-events:auto} .inv{-webkit-user-select:none;user-select:none}`;
    document.head.appendChild(style);
    return () => {
      for (const ev of ["contextmenu", "dragstart", "copy", "cut", "selectstart"]) document.removeEventListener(ev, stop);
      document.removeEventListener("keydown", keys);
      style.remove();
    };
  }, []);

  // Deliberately faint and small: a person scrolling past cannot read it, but the stamp is still in every screenshot and shows up when the contrast is raised.
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='170'><text x='14' y='96' transform='rotate(-24 150 85)' font-family='sans-serif' font-size='9' letter-spacing='0.6' fill='rgba(255,255,255,0.05)' stroke='rgba(0,0,0,0.035)' stroke-width='0.3'>${mark}</text></svg>`;
  return <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 2147483000, pointerEvents: "none", backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")` }} />;
}
