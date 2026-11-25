import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { colorHex } from "./fashion";

interface Props {
  imageKey?: string | null;
  imageUrl?: string | null; // real photo; the drawing shows if it is missing
  color?: string; // color name, e.g. "Brown"
  className?: string;
}

// Simple built-in clothing illustrations, tinted with the chosen color.
// Every shape is drawn in a 200x200 box.
const SHAPES: Record<string, (fill: string, line: string) => ReactElement> = {
  jacket: (f, l) => (
    <g fill={f} stroke={l} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M62 34 L88 26 Q100 42 112 26 L138 34 L176 120 L152 130 L143 92 V172 H57 V92 L48 130 L24 120 Z" />
      <path d="M100 40 V172" fill="none" />
      <path d="M72 120 H88 M112 120 H128" fill="none" />
    </g>
  ),
  tshirt: (f, l) => (
    <g fill={f} stroke={l} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M66 32 Q100 56 134 32 L172 58 L152 90 L138 80 V170 H62 V80 L48 90 L28 58 Z" />
    </g>
  ),
  shirt: (f, l) => (
    <g fill={f} stroke={l} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M66 32 L100 52 L134 32 L172 62 L158 128 L140 122 V172 H60 V122 L42 128 L28 62 Z" />
      <path d="M100 52 V172" fill="none" />
      <path d="M66 32 L84 48 L100 52 L116 48 L134 32" fill="none" />
      <circle cx="100" cy="80" r="1.8" fill={l} />
      <circle cx="100" cy="106" r="1.8" fill={l} />
      <circle cx="100" cy="132" r="1.8" fill={l} />
    </g>
  ),
  hoodie: (f, l) => (
    <g fill={f} stroke={l} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M64 40 Q100 20 136 40 L174 124 L150 134 L142 96 V172 H58 V96 L50 134 L26 124 Z" />
      <path d="M76 38 Q100 74 124 38" fill="none" />
      <path d="M72 128 H128 L120 156 H80 Z" />
      <path d="M92 58 V84 M108 58 V84" fill="none" />
    </g>
  ),
  sweater: (f, l) => (
    <g fill={f} stroke={l} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M68 32 Q100 50 132 32 L176 128 L152 138 L142 98 V170 H58 V98 L48 138 L24 128 Z" />
      <path d="M58 156 H142 M58 164 H142" fill="none" />
    </g>
  ),
  jeans: (f, l) => (
    <g fill={f} stroke={l} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M62 24 H138 L150 176 H108 L100 82 L92 176 H50 Z" />
      <path d="M62 38 H138" fill="none" />
      <path d="M68 46 Q80 60 92 46" fill="none" />
      <path d="M132 46 Q120 60 108 46" fill="none" />
    </g>
  ),
  shorts: (f, l) => (
    <g fill={f} stroke={l} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M62 36 H138 L152 124 H108 L100 92 L92 124 H48 Z" />
      <path d="M62 50 H138" fill="none" />
    </g>
  ),
  dress: (f, l) => (
    <g fill={f} stroke={l} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M80 24 L100 42 L120 24 L130 74 L158 176 H42 L70 74 Z" />
      <path d="M70 74 H130" fill="none" />
    </g>
  ),
  skirt: (f, l) => (
    <g fill={f} stroke={l} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M70 48 H130 L164 156 H36 Z" />
      <path d="M70 62 H130" fill="none" />
      <path d="M84 62 L66 156 M100 62 V156 M116 62 L134 156" fill="none" />
    </g>
  ),
  sneakers: (f, l) => (
    <g strokeWidth="2.5" strokeLinejoin="round" stroke={l}>
      <path d="M22 128 Q26 96 56 94 L84 112 L122 114 Q168 118 178 142 V154 H22 Z" fill={f} />
      <path d="M22 146 H178 V156 Q100 164 22 156 Z" fill="#f4f4f2" />
      <path d="M88 116 L96 104 M100 118 L108 106 M112 120 L120 110" fill="none" />
    </g>
  ),
  boots: (f, l) => (
    <g strokeWidth="2.5" strokeLinejoin="round" stroke={l}>
      <path d="M68 28 H116 V104 L160 122 Q172 128 172 146 V158 H64 Z" fill={f} />
      <path d="M64 148 H172 V162 H64 Z" fill="#d8c3a0" />
      <path d="M68 58 H116 M68 76 H116" fill="none" />
    </g>
  ),
  cap: (f, l) => (
    <g fill={f} stroke={l} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M40 116 Q42 52 100 52 Q158 52 160 116 Z" />
      <path d="M100 112 H182 Q188 130 134 130 H100 Z" />
      <circle cx="100" cy="56" r="4" />
    </g>
  ),
};

// The illustration keys an admin can pick from
export const IMAGE_KEYS = Object.keys(SHAPES);

const FALLBACK = "tshirt";

// Just the garment shapes (200x200 box), for drawing on the fitting-room model.
export function Garment({ imageKey, color }: { imageKey?: string | null; color?: string }) {
  const key = imageKey && SHAPES[imageKey] ? imageKey : FALLBACK;
  return SHAPES[key](colorHex(color ?? "Grey"), "rgba(0,0,0,0.38)");
}

export default function ProductArt({ imageKey, imageUrl, color, className }: Props) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [imageUrl]);
  const photo = imageUrl?.split(",")[0].trim();
  if (photo && !broken) {
    return (
      <img
        className={`product-photo${className ? " " + className : ""}`}
        src={photo}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }
  const key = imageKey && SHAPES[imageKey] ? imageKey : FALLBACK;
  const fill = colorHex(color ?? "Grey");
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      role="img"
      aria-label={key}
      preserveAspectRatio="xMidYMid meet"
    >
      <ellipse cx="100" cy="182" rx="56" ry="6" fill="rgba(0,0,0,0.12)" />
      {SHAPES[key](fill, "rgba(0,0,0,0.38)")}
    </svg>
  );
}
