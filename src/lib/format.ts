const chf = new Intl.NumberFormat("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "CHF 1’249.00" (Swiss grouping). */
export function formatCHF(value: number): string {
  return `CHF ${chf.format(value)}`;
}

const dateFmt = new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric" });

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

export function pieces(n: number): string {
  return n === 1 ? "1 Teil" : `${n} Teile`;
}
