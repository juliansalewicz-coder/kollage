"use client";

import { Icon } from "./Icon";

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

/** Shows what is filtering the list; each filter can be removed alone, all at once via reset. */
export function ActiveFilters({ filters, onReset, className = "" }: { filters: ActiveFilter[]; onReset: () => void; className?: string }) {
  if (!filters.length) return null;
  return (
    <div className={`active-filters ${className}`} role="group" aria-label="Aktive Filter">
      {filters.map((f) => (
        <button key={f.key} type="button" className="active-filter" onClick={f.onRemove} aria-label={`Filter ${f.label} entfernen`}>
          {f.label}
          <Icon name="close" size={14} />
        </button>
      ))}
      <button type="button" className="text-btn active-filters__reset" onClick={onReset}>
        Alle zurücksetzen
      </button>
    </div>
  );
}
