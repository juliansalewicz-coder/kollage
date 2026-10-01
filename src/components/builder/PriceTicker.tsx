"use client";

import { useEffect, useRef, useState } from "react";
import { formatCHF } from "@/lib/format";

/**
 * A price that shows how it just changed: the number settles in and the difference
 * (e.g. −60.00) stays visible for a moment. The difference is decoration only; screen readers
 * get the new total through the surrounding live region.
 */
export function PriceTicker({ value, className = "", resetKey = 0 }: { value: number; className?: string; resetKey?: number }) {
  const prev = useRef(value);
  const lastReset = useRef(resetKey);
  const [delta, setDelta] = useState<{ diff: number; key: number } | null>(null);

  useEffect(() => {
    const diff = Math.round((value - prev.current) * 100) / 100;
    prev.current = value;
    // A whole look was opened (or the first load): that is not a price change worth pointing at.
    if (lastReset.current !== resetKey) {
      lastReset.current = resetKey;
      setDelta(null);
      return;
    }
    if (!diff) return;
    setDelta({ diff, key: Date.now() });
    const t = window.setTimeout(() => setDelta(null), 1800);
    return () => window.clearTimeout(t);
  }, [value, resetKey]);

  return (
    <span className={`ticker ${className}`}>
      <span key={delta?.key ?? 0} className={`num ticker__value ${delta ? "is-changed" : ""}`}>
        {formatCHF(value)}
      </span>
      {delta && (
        <span key={`d${delta.key}`} className={`num ticker__delta ${delta.diff < 0 ? "is-down" : "is-up"}`} aria-hidden="true">
          {delta.diff < 0 ? "−" : "+"}
          {formatCHF(Math.abs(delta.diff)).replace("CHF ", "")}
        </span>
      )}
    </span>
  );
}
