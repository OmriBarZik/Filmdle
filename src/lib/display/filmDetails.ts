/**
 * Which film's details are open (`FilmDetails`), if any. A card deep in the swipe line
 * opens them, and the game screen shows them, so they share this small store instead
 * of passing callbacks down through the line.
 */
let openId: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function openFilmDetails(id: string): void {
  openId = id;
  emit();
}

export function closeFilmDetails(): void {
  if (openId !== null) {
    openId = null;
    emit();
  }
}

export function openFilmId(): string | null {
  return openId;
}

export function subscribeFilmDetails(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
