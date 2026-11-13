/**
 * Whether to run JavaScript animations: the Web Animations API is there and the
 * player hasn't asked for reduced motion. Everything animated works without it.
 */
export function canAnimate(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  if (typeof document.body.animate !== "function") {
    return false;
  }
  return typeof window.matchMedia !== "function"
    ? true
    : !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
