"use client";

import { useEffect, useState } from "react";
import type { BudgetSummary } from "@/lib/budget";
import { formatCHF } from "@/lib/format";
import { Icon } from "../Icon";

/** Personal outfit budget. Informs, never blocks. Product value and shipping are shown apart. */
export function BudgetBox({
  summary,
  idPrefix,
  onBudget,
  onCheaper,
}: {
  summary: BudgetSummary;
  idPrefix: string;
  onBudget: (value: number | null) => void;
  onCheaper: (() => void) | null;
}) {
  const [text, setText] = useState(summary.budget === null ? "" : String(summary.budget));
  useEffect(() => {
    setText(summary.budget === null ? "" : String(summary.budget));
  }, [summary.budget]);

  const over = summary.remaining !== null && summary.remaining < 0;
  const ratio = summary.budget ? Math.min(1, summary.productValue / summary.budget) : 0;
  const dupes = summary.placed - summary.distinct;

  return (
    <div className="budget">
      <div className="field">
        <label htmlFor={`${idPrefix}-budget`}>Mein Budget für diesen Look</label>
        <div className="budget__input">
          <span aria-hidden="true">CHF</span>
          <input
            id={`${idPrefix}-budget`}
            type="number"
            inputMode="decimal"
            min={0}
            step={10}
            placeholder="z. B. 500"
            value={text}
            aria-describedby={`${idPrefix}-budget-state`}
            onChange={(e) => {
              setText(e.target.value);
              const n = Number(e.target.value.replace(",", "."));
              onBudget(e.target.value.trim() === "" || !Number.isFinite(n) || n <= 0 ? null : Math.round(n * 100) / 100);
            }}
          />
        </div>
      </div>

      {summary.budget !== null && (
        <div className={`budget__meter ${over ? "is-over" : ""}`} aria-hidden="true">
          <span style={{ transform: `scaleX(${ratio})` }} />
        </div>
      )}

      <dl className="budget__lines" id={`${idPrefix}-budget-state`} aria-live="polite">
        <div>
          <dt>Produktwert</dt>
          <dd className="num">{formatCHF(summary.productValue)}</dd>
        </div>
        {summary.remaining !== null && (
          <div className={over ? "is-over" : "is-ok"}>
            <dt>{over ? "Über Budget" : "Restbudget"}</dt>
            <dd className="num">{formatCHF(Math.abs(summary.remaining))}</dd>
          </div>
        )}
        <div className="budget__ship">
          <dt>Versand, geschätzt</dt>
          <dd className="num">{summary.shipping === 0 ? "gratis" : `+ ${formatCHF(summary.shipping)}`}</dd>
        </div>
      </dl>
      <p className="budget__note">
        Produktwert ohne Versand und ohne mögliche weitere Kosten. Versand gilt, wenn jedes Teil beim günstigsten Shop gekauft wird
        {summary.shops.length > 1 ? ` (${summary.shops.length} Shops)` : ""}.
        {dupes > 0 && ` ${dupes === 1 ? "Ein Teil liegt" : `${dupes} Teile liegen`} mehrfach auf der Leinwand und ${dupes === 1 ? "zählt" : "zählen"} nur einmal.`}
      </p>
      {over && onCheaper && (
        <button type="button" className="btn btn--ghost btn--sm budget__cheaper" onClick={onCheaper}>
          <Icon name="swap" size={16} /> Günstigere Alternative zum teuersten Teil
        </button>
      )}
    </div>
  );
}
