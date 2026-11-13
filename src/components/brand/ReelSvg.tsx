import { PALETTE } from "@/lib/display/palette";

/** The six holes of the reel, on a circle around the hub (unit coordinates). */
const HOLES = [0, 1, 2, 3, 4, 5].map((i) => {
  const a = (i * Math.PI) / 3 - Math.PI / 2;
  return { x: 0.5 + 0.28 * Math.cos(a), y: 0.5 + 0.28 * Math.sin(a) };
});

/**
 * Filmdle's mark: a film reel, as in the home page's sleeves. Plain SVG so `next/og`
 * can draw it for the link preview image and the favicon.
 */
export function ReelSvg({ size }: { size: number }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <circle cx={s / 2} cy={s / 2} r={s / 2} fill={PALETTE.label} />
      <circle cx={s / 2} cy={s / 2} r={s * 0.46} fill={PALETTE.vinyl} />
      {HOLES.map((h) => (
        <circle key={`${h.x}:${h.y}`} cx={h.x * s} cy={h.y * s} r={s * 0.11} fill={PALETTE.page} />
      ))}
      <circle cx={s / 2} cy={s / 2} r={s * 0.09} fill={PALETTE.label} />
      <circle cx={s / 2} cy={s / 2} r={s * 0.045} fill={PALETTE.page} />
    </svg>
  );
}
