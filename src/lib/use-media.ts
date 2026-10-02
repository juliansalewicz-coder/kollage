"use client";

import { useSyncExternalStore } from "react";

/**
 * Live media query. Re-renders when the window crosses the breakpoint (tablet rotation, resized window),
 * so layout-dependent state never keeps the value it had on first render.
 * `null` on the server and during hydration: unknown, so callers do not act on a guessed layout.
 */
export function useMediaQuery(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}
