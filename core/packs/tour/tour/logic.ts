/** The logic of the guided tour: moving between steps and the cut-out around a target. Plain TypeScript, no DOM. */
import type { Box } from "@tailor/core/position";

/**
 * The next step from `index` in a direction whose target is on the page, or null when there is none.
 * A step whose target is missing is passed over.
 */
export function nextPresent(index: number, direction: 1 | -1, present: readonly boolean[]): number | null {
  for (let i = index + direction; i >= 0 && i < present.length; i += direction) if (present[i]) return i;
  return null;
}

/** The first step at or after `index` with a target, then the nearest before it; null when no step has one. */
export function settle(index: number, present: readonly boolean[]): number | null {
  if (present[index]) return index;
  return nextPresent(index, 1, present) ?? nextPresent(index, -1, present);
}

/** The position of a step among the steps with a target, from 1, and their count: "Step 2 of 5". */
export function position(index: number, present: readonly boolean[]): { index: number; count: number } {
  let count = 0;
  let at = 0;
  present.forEach((here, i) => {
    if (!here) return;
    count++;
    if (i <= index) at = count;
  });
  return { index: at, count };
}

/** The cut-out around a target: its box grown by the padding, kept inside the viewport. */
export function cutout(
  target: Box,
  padding: number,
  viewport: { readonly width: number; readonly height: number },
): Box {
  const left = Math.max(0, target.x - padding);
  const top = Math.max(0, target.y - padding);
  const right = Math.min(viewport.width, target.x + target.width + padding);
  const bottom = Math.min(viewport.height, target.y + target.height + padding);
  return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/**
 * How far to scroll the page down (positive) or up (negative) so that a target sits in the free space
 * above a bottom sheet, `margin` from its edges. A target taller than the space keeps its top in view.
 */
export function scrollAboveSheet(
  target: Box,
  viewportHeight: number,
  sheetHeight: number,
  margin: number,
): number {
  const top = margin;
  const bottom = viewportHeight - sheetHeight - margin;
  if (target.y < top) return target.y - top;
  if (target.y + target.height > bottom) return Math.min(target.y + target.height - bottom, target.y - top);
  return 0;
}
