"use client";

import Link, { type LinkProps } from "next/link";
import { type ComponentProps, useEffect } from "react";
import { preloadGames } from "@/components/LazyScreens";

/** A link into a game, which loads the game's code while the player reads the home page. */
export function ModeLink(props: LinkProps & Omit<ComponentProps<"a">, keyof LinkProps>) {
  useEffect(() => {
    // Safari has no requestIdleCallback.
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(preloadGames);
    } else {
      setTimeout(preloadGames, 300);
    }
  }, []);

  return (
    <Link
      {...props}
      onPointerEnter={(e) => {
        props.onPointerEnter?.(e);
        preloadGames();
      }}
      onPointerDown={(e) => {
        props.onPointerDown?.(e);
        preloadGames();
      }}
    />
  );
}
