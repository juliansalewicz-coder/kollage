/** Kollage wordmark: the name in spaced capitals, nothing else. */
export function Wordmark({ size = 17 }: { size?: number }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      Kollage
    </span>
  );
}
