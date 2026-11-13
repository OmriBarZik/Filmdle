import { PALETTE } from "@/lib/display/palette";

/**
 * The six holes of the reel, a little over a quarter of the way out from the hub
 * (unit coordinates), as `.reel` draws them in poster.css.
 */
const HOLES = [0, 1, 2, 3, 4, 5].map((i) => {
  const a = (i * Math.PI) / 3 - Math.PI / 2;
  return { x: 0.5 + 0.28 * Math.cos(a), y: 0.5 + 0.28 * Math.sin(a) };
});

/**
 * Filmdle's mark: the film reel that spins on the home page's Daily Five sleeve, drawn
 * the same way as `.reel` (a dark disc with a violet rim and hub, its holes showing the
 * sleeve's violet). Plain SVG so `next/og` can draw it for the link preview image and
 * the icons.
 */
export function ReelSvg({ size }: { size: number }) {
  const s = size;
  const c = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <circle cx={c} cy={c} r={c} fill={PALETTE.label} />
      <circle cx={c} cy={c} r={c * 0.94} fill={PALETTE.vinyl} />
      {HOLES.map((h) => (
        <circle
          key={`${h.x}:${h.y}`}
          cx={h.x * s}
          cy={h.y * s}
          r={s * 0.105}
          fill={PALETTE.sleeve}
        />
      ))}
      <circle cx={c} cy={c} r={s * 0.064} fill={PALETTE.label} />
      <circle cx={c} cy={c} r={s * 0.035} fill={PALETTE.sleeve} />
    </svg>
  );
}
