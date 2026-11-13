import { clsx } from "clsx";
import type { GameColor } from "@/components/game/ScreenMain";
import { ModeLink } from "@/components/home/ModeLink";

/** A game mode on the home page, drawn as a film can with its reel peeking out. */
export function ModeSleeve({
  href,
  game,
  tag,
  name,
  desc,
}: {
  href: string;
  game: GameColor;
  tag: string;
  name: string;
  desc: string;
}) {
  return (
    <ModeLink href={href} className={clsx("sleeve", `sleeve-${game}`)}>
      <span className="sleeve-reel reel spin-slow" aria-hidden />
      <span className="sleeve-tag font-mono">{tag}</span>
      <span className="text-xl font-black lg:text-3xl">{name}</span>
      <span className="sleeve-desc text-sm lg:text-base">{desc}</span>
    </ModeLink>
  );
}
