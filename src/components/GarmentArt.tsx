import { useId } from "react";
import { GARMENTS, mix, resolveTones, type CircleLayer, type Layer, type PathLayer } from "@/lib/garments";
import type { Product } from "@/lib/types";

function isCircle(layer: Layer): layer is CircleLayer {
  return "cx" in layer;
}

/** Cut-out product image: authored demo illustration, or the retailer image for real offers. */
/**
 * `sizes` is the rendered width hint; renders ship a 360 px and a 900 px variant.
 */
export function ProductImage({
  product,
  className,
  lazy = false,
  sizes = "180px",
}: {
  product: Product;
  className?: string;
  lazy?: boolean;
  sizes?: string;
}) {
  const img = product.image;
  if (img.type === "render") {
    const small = img.src.replace("/products/", "/products/sm/");
    const smallW = Math.round(Math.min(360, (img.width * 360) / Math.max(img.width, img.height)));
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={className}
        src={small}
        srcSet={`${small} ${smallW}w, ${img.src} ${img.width}w`}
        sizes={sizes}
        width={img.width}
        height={img.height}
        alt=""
        draggable={false}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
      />
    );
  }
  if (img.type === "retailer") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={img.src} width={img.width} height={img.height} alt="" draggable={false} loading={lazy ? "lazy" : "eager"} decoding="async" />;
  }
  return <GarmentSvg product={product} className={className} />;
}

function GarmentSvg({ product, className }: { product: Product; className?: string }) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (product.image.type !== "illustration") return null;
  const { kind, color, accent, pattern = "none" } = product.image;
  const shape = GARMENTS[kind];
  const tones = resolveTones(color, accent, shape.defaultAccent);
  const patternColor = accent ?? tones.dark;
  const fillFor = (t: PathLayer["fill"]) => (t ? tones[t] : "none");

  return (
    <svg className={className} viewBox={`0 0 ${shape.w} ${shape.h}`} aria-hidden="true" focusable="false" overflow="visible">
      <defs>
        {/* Top light and a soft cylindrical falloff give the flat cut-out its volume. */}
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="0.38" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={`${id}-cyl`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.16" />
          <stop offset="0.16" stopColor="#000000" stopOpacity="0.02" />
          <stop offset="0.38" stopColor="#ffffff" stopOpacity="0.09" />
          <stop offset="0.62" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.86" stopColor="#000000" stopOpacity="0.04" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
        {pattern === "stripes" && (
          <pattern id={`${id}-pat`} width="12" height="14" patternUnits="userSpaceOnUse">
            <rect y="0" width="12" height="6" fill={patternColor} />
          </pattern>
        )}
        {pattern === "check" && (
          <pattern id={`${id}-pat`} width="26" height="26" patternUnits="userSpaceOnUse">
            <rect x="0" y="9" width="26" height="8" fill={patternColor} opacity="0.32" />
            <rect x="9" y="0" width="8" height="26" fill={patternColor} opacity="0.32" />
            <path d="M0 2.5h26M2.5 0v26" stroke={mix(patternColor, "#ffffff", 0.45)} strokeWidth="1" opacity="0.6" />
          </pattern>
        )}
        {pattern === "denim" && (
          <pattern id={`${id}-pat`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <path d="M0 0v5" stroke="#ffffff" strokeWidth="1.1" opacity="0.13" />
          </pattern>
        )}
        {pattern === "rib" && (
          <pattern id={`${id}-pat`} width="6" height="10" patternUnits="userSpaceOnUse">
            <path d="M1.5 0v10" stroke={tones.dark} strokeWidth="1.2" opacity="0.22" />
          </pattern>
        )}
      </defs>
      {shape.layers.map((layer, i) => {
        if (isCircle(layer)) {
          return (
            <circle
              key={i}
              cx={layer.cx}
              cy={layer.cy}
              r={layer.r}
              fill={layer.fill ? tones[layer.fill] : "none"}
              stroke={layer.stroke ? tones[layer.stroke] : undefined}
              strokeWidth={layer.sw}
            />
          );
        }
        const base = (
          <path
            d={layer.d}
            fill={fillFor(layer.fill)}
            stroke={layer.stroke ? tones[layer.stroke] : layer.body ? tones.line : undefined}
            strokeWidth={layer.body && !layer.stroke ? 0.6 : layer.stroke === "line" ? Math.min(layer.sw ?? 1, 1.2) : layer.sw}
            strokeOpacity={layer.body && !layer.stroke ? 0.3 : layer.stroke === "line" || layer.stroke === "stitch" ? 0.55 : undefined}
            strokeDasharray={layer.dash}
            strokeLinecap={layer.cap ?? "round"}
            strokeLinejoin="round"
          />
        );
        if (!layer.body) return <g key={i}>{base}</g>;
        return (
          <g key={i}>
            {base}
            {pattern !== "none" && <path d={layer.d} fill={`url(#${id}-pat)`} />}
            <path d={layer.d} fill={`url(#${id}-cyl)`} />
            <path d={layer.d} fill={`url(#${id}-shade)`} />
          </g>
        );
      })}
    </svg>
  );
}
