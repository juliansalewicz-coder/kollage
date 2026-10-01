"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Modal surface: a compact card on desktop, a bottom sheet on phones.
 * Native <dialog> gives focus containment and Escape; focus returns to the opener.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className = "",
  closeLabel = "Schliessen",
  initialFocus,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  /** CSS selector of the element that gets focus when the sheet opens (default: the dialog's first control). */
  initialFocus?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = `sheet-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dlg.showModal();
      if (initialFocus) dlg.querySelector<HTMLElement>(initialFocus)?.focus();
    } else if (!open && dlg.open) {
      dlg.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const onClosed = () => {
      const el = opener.current;
      opener.current = null;
      if (el && document.contains(el)) el.focus({ preventScroll: true });
    };
    dlg.addEventListener("close", onClosed);
    return () => dlg.removeEventListener("close", onClosed);
  }, []);

  return (
    <dialog
      ref={ref}
      className={`sheet ${className}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="sheet__body">
          <div className="sheet__grip" aria-hidden="true" />
          <div className="sheet__head">
            <h2 id={titleId} className="sheet__title">
              {title}
            </h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label={closeLabel}>
              <Icon name="close" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
