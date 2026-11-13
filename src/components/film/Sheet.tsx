"use client";

import { clsx } from "clsx";
import { type ReactNode, useEffect, useRef } from "react";

/**
 * A modal sheet (`<dialog>`): the full-screen poster, or a film's details. The browser
 * traps the focus inside and closes it on Escape; a tap outside it closes it too.
 */
export function Sheet({
  open,
  onClose,
  label,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    // The dialog itself is only hit outside its content (on the backdrop): that closes it,
    // as players expect on a phone. Keyboard players have Escape and the close button.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-label={label}
      className={clsx("sheet", className)}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
