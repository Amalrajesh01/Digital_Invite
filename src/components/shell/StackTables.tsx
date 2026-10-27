"use client";
import { useEffect } from "react";

/**
 * On a phone a wide table becomes a list of cards (CSS in globals.css). Each cell needs to know its column's name, so it is copied
 * from the header once, and again whenever a table appears or its rows change.
 */
export function StackTables() {
  useEffect(() => {
    let raf = 0;
    const label = () => {
      raf = 0;
      for (const table of document.querySelectorAll<HTMLTableElement>(".overflow-x-auto table")) {
        const heads = [...table.querySelectorAll("thead th")].map((th) => (th.textContent ?? "").trim());
        if (!heads.length) continue;
        for (const row of table.querySelectorAll("tbody tr")) {
          [...row.children].forEach((cell, i) => { if (heads[i] && cell.getAttribute("data-label") !== heads[i]) cell.setAttribute("data-label", heads[i]); });
        }
      }
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(label); };
    queue();
    const mo = new MutationObserver(queue);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return null;
}
