/** The page logic of the pagination, shared by both kits. Pages count from 1. */

/** A page number, or a gap that stands for two or more hidden pages. */
export type PageItem = number | "gap-start" | "gap-end";

/**
 * The items to show for a page count: the first and the last page, the current page and `siblings` pages on
 * each side of it, with gaps between. The list keeps one length while the current page moves, so the buttons
 * do not jump, and a gap never hides a single page.
 */
export function pageItems(page: number, count: number, siblings = 1): PageItem[] {
  const total = Math.max(0, Math.floor(count));
  if (total === 0) return [];
  const current = Math.min(Math.max(1, Math.floor(page)), total);
  const slots = siblings * 2 + 5;
  if (total <= slots) return range(1, total);
  if (current - siblings <= 3) return [...range(1, slots - 2), "gap-end", total];
  if (current + siblings >= total - 2) return [1, "gap-start", ...range(total - slots + 3, total)];
  return [1, "gap-start", ...range(current - siblings, current + siblings), "gap-end", total];
}

/** The page number limited to the pages that exist. */
export const clampPage = (page: number, count: number): number =>
  Math.min(Math.max(1, Math.floor(page)), Math.max(1, Math.floor(count)));

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);
