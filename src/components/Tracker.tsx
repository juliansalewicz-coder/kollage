"use client";

import { useEffect } from "react";
import { track, visitSource } from "@/lib/track";

/** Records the landing page of a visit and every click on a shop link (/weiter/…). Renders nothing. */
export function Tracker() {
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("kollage.v1.landed")) {
        sessionStorage.setItem("kollage.v1.landed", "1");
        track("landing", { source: visitSource() ?? "direkt" });
      }
    } catch {
      /* storage blocked: skip the landing event */
    }
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='/weiter/']");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const url = new URL(href, window.location.origin);
      track("shop_clicked", { offer: decodeURIComponent(url.pathname.split("/")[2] ?? ""), look: url.searchParams.get("look") });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
