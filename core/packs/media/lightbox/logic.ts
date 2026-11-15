/** The logic that both kits share for the lightbox: moving through the set, keys and swipes. */

/** The least distance, in CSS pixels, that counts as a swipe. */
export const SWIPE_MIN = 48;

/** Puts values into a text such as "{index} of {count}". */
export const fill = (text: string, values: Record<string, number>): string =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/** The index `delta` steps away, or null past an end of a set that does not loop. */
export function stepTo(index: number, delta: number, count: number, loop: boolean): number | null {
  if (count < 1) return null;
  const next = index + delta;
  if (next >= 0 && next < count) return next;
  return loop && count > 1 ? (next + count) % count : null;
}

/** The index that a key moves to, or null when the key does not move. */
export function keyTarget(key: string, index: number, count: number, loop: boolean): number | null {
  if (key === "ArrowLeft") return stepTo(index, -1, count, loop);
  if (key === "ArrowRight") return stepTo(index, 1, count, loop);
  if (key === "Home") return count > 0 && index !== 0 ? 0 : null;
  if (key === "End") return count > 0 && index !== count - 1 ? count - 1 : null;
  return null;
}

/** What a finished pointer move means: a swipe to the side moves, a swipe down closes. */
export function swipeAction(dx: number, dy: number, min = SWIPE_MIN): "next" | "prev" | "close" | null {
  if (Math.abs(dx) >= min && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "next" : "prev";
  if (dy >= min && dy > Math.abs(dx)) return "close";
  return null;
}
