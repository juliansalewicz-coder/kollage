import type { SVGProps } from "react";

/** Authored line icons: 20px grid, 1.6 stroke, round joins. */
const PATHS = {
  plus: "M10 4v12M4 10h12",
  minus: "M4 10h12",
  search: "M8.8 15.2a6.4 6.4 0 1 0 0-12.8 6.4 6.4 0 0 0 0 12.8ZM13.4 13.4 17.6 17.6",
  close: "M5 5l10 10M15 5 5 15",
  trash: "M4 6h12M8 6V4h4v2M6 6l.8 10h6.4L14 6",
  copy: "M7 7h9v9H7zM4 13V4h9",
  rotateLeft: "M4.5 7.5A6.5 6.5 0 1 1 4 11M4.5 3.5v4h4",
  rotateRight: "M15.5 7.5A6.5 6.5 0 1 0 16 11M15.5 3.5v4h-4",
  layerUp: "M10 3 3 7l7 4 7-4-7-4ZM3 11l7 4 7-4M10 17V9",
  layerDown: "M10 9 3 13l7 4 7-4-7-4ZM3 5l7 4 7-4M10 3v8",
  arrange: "M3 3h6v8H3zM11 3h6v5h-6zM11 10h6v7h-6zM3 13h6v4H3z",
  undo: "M7 5 3 9l4 4M3 9h9a5 5 0 0 1 0 10h-2",
  redo: "M13 5l4 4-4 4M17 9H8a5 5 0 0 0 0 10h2",
  share: "M10 3v10M6 7l4-4 4 4M4 12v5h12v-5",
  external: "M8 4H4v12h12v-4M11 3h6v6M17 3l-8 8",
  user: "M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3.5 17.5c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5",
  check: "M4 10.5 8 14.5 16 5.5",
  edit: "M4 16h3l9-9-3-3-9 9v3ZM11.5 5.5l3 3",
  eye: "M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6ZM10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  arrowRight: "M4 10h12M11 5l5 5-5 5",
  chevronDown: "M5 8l5 5 5-5",
  chevronRight: "M8 5l5 5-5 5",
  heart: "M10 16.5s-6.5-3.9-6.5-8.4A3.6 3.6 0 0 1 10 6a3.6 3.6 0 0 1 6.5 2.1c0 4.5-6.5 8.4-6.5 8.4Z",
  heartFilled: "M10 16.5s-6.5-3.9-6.5-8.4A3.6 3.6 0 0 1 10 6a3.6 3.6 0 0 1 6.5 2.1c0 4.5-6.5 8.4-6.5 8.4Z",
  swap: "M4 7h11M12 4l3 3-3 3M16 13H5M8 10l-3 3 3 3",
  more: "M5 10h.01M10 10h.01M15 10h.01",
  wallet: "M3 6.5h12.5a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15V5.5A1.5 1.5 0 0 1 4.5 4H14M13.5 11.5h.01",
  filter: "M3 5h14M6 10h8M8.5 15h3",
  sparkle: "M10 3v4M10 13v4M3 10h4M13 10h4",
  sliders: "M4 6h8M15 6h1M4 14h2M9 14h7M12 4v4M7 12v4",
  bag: "M5 7h10l-.8 10H5.8L5 7ZM7.5 7V6a2.5 2.5 0 0 1 5 0v1",
  link: "M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5L10 5M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1",
  lock: "M5 9h10v8H5zM7 9V6.5a3 3 0 0 1 6 0V9",
  grow: "M4 16 9 11M4 16v-4M4 16h4M16 4l-5 5M16 4v4M16 4h-4",
  shrink: "M9 11 4 16M9 11H5M9 11v4M11 9l5-5M11 9h4M11 9V5",
  tag: "M3 10V3h7l7 7-7 7-7-7ZM7 7.2a.2.2 0 1 0 0-.4.2.2 0 0 0 0 .4Z",
  truck: "M2 5h10v9H2zM12 8h3.5L18 11v3h-6M5 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM14.5 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} fill={name === "heartFilled" ? "currentColor" : undefined} strokeWidth={name === "more" ? 2.6 : undefined} />
    </svg>
  );
}
