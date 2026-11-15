/**
 * The size maths of the split, shared by both kits. Plain TypeScript, no DOM.
 * A size is the share of the first pane in percent of the split, rounded to one decimal.
 */

export interface SplitBounds {
  readonly min: number;
  readonly max: number;
}

export const SPLIT_DEFAULTS = { size: 50, min: 15, max: 85, step: 2 } as const;

const round = (value: number): number => Math.round(value * 10) / 10;

/** The bounds from the given values: each between 0 and 100, min never above max. */
export function splitBounds(min: number = SPLIT_DEFAULTS.min, max: number = SPLIT_DEFAULTS.max): SplitBounds {
  const low = Math.min(100, Math.max(0, min));
  const high = Math.min(100, Math.max(0, max));
  return low <= high ? { min: low, max: high } : { min: high, max: low };
}

/** The size held inside the bounds. A value that is not a number gives the middle of the bounds. */
export function clampSize(size: number, bounds: SplitBounds): number {
  if (!Number.isFinite(size)) return round((bounds.min + bounds.max) / 2);
  return round(Math.min(bounds.max, Math.max(bounds.min, size)));
}

/** A size read from text (a stored value, a data attribute), or the fallback when the text is not a number. */
export function parseSize(text: string | null | undefined, fallback: number, bounds: SplitBounds): number {
  const value = text === null || text === undefined || text.trim() === "" ? Number.NaN : Number(text);
  return clampSize(Number.isFinite(value) ? value : fallback, bounds);
}

/** The new size for a key on the handle, or null when the key does nothing. */
export function sizeFromKey(
  key: string,
  size: number,
  bounds: SplitBounds,
  step: number = SPLIT_DEFAULTS.step,
): number | null {
  switch (key) {
    case "ArrowLeft":
    case "ArrowUp":
      return clampSize(size - step, bounds);
    case "ArrowRight":
    case "ArrowDown":
      return clampSize(size + step, bounds);
    case "Home":
      return bounds.min;
    case "End":
      return bounds.max;
    default:
      return null;
  }
}

/** The size for a pointer at `position`, on a split that starts at `start` and is `length` long. */
export function sizeFromPointer(
  position: number,
  start: number,
  length: number,
  bounds: SplitBounds,
): number {
  if (length <= 0) return clampSize(Number.NaN, bounds);
  return clampSize(((position - start) / length) * 100, bounds);
}
