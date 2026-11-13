"use client";

import { CloseButton } from "@/components/film/CloseButton";
import { Sheet } from "@/components/film/Sheet";

/** A poster as big as the screen allows. */
export function PosterZoom({
  src,
  alt,
  open,
  onClose,
}: {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} label={alt} className="sheet-zoom">
      <div className="relative">
        {/* Hot-linked from Wikimedia, which serves its own sizes: next/image can't help. */}
        {/* oxlint-disable-next-line nextjs/no-img-element */}
        <img src={src} alt={alt} referrerPolicy="no-referrer" className="sheet-zoom-img" />
        <CloseButton onClose={onClose} className="absolute end-100 top-100" />
      </div>
    </Sheet>
  );
}
