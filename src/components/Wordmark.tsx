/** Kollage wordmark: two overlapping cut-out cards and the name. */
export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      <svg className="wordmark__mark" width={size * 1.15} height={size * 1.15} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3" y="5" width="11" height="14" rx="2.2" transform="rotate(-8 8.5 12)" fill="var(--ink)" />
        <rect x="10" y="4" width="11" height="14" rx="2.2" transform="rotate(7 15.5 11)" fill="var(--accent)" />
      </svg>
      <span className="wordmark__text">Kollage</span>
    </span>
  );
}
