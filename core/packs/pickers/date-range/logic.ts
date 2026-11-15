/**
 * The range logic of the date range picker, shared by both kits. Plain TypeScript, no DOM.
 * Days are ISO strings (YYYY-MM-DD); the day arithmetic comes from the date picker.
 */
import { isOutOfBounds, parseIso } from "../date/logic";

export interface DateRange {
  readonly start: string | null;
  readonly end: string | null;
}

export interface RangePreset {
  readonly label: string;
  readonly start: string;
  readonly end: string;
}

export const EMPTY: DateRange = { start: null, end: null };

/** Two days as a range, the earlier one first. */
export const orderRange = (a: string, b: string): DateRange =>
  a <= b ? { start: a, end: b } : { start: b, end: a };

/** A range from outside, with days that are not real days dropped and the ends in order. */
export function cleanRange(range: Partial<DateRange> | null | undefined): DateRange {
  const start = parseIso(range?.start) ? (range?.start ?? null) : null;
  const end = parseIso(range?.end) ? (range?.end ?? null) : null;
  return start && end ? orderRange(start, end) : { start, end };
}

/**
 * A click on a day. The first click starts a range (the draft); the second ends it, in either order.
 * Returns the new draft and, after the second click, the finished range.
 */
export function pickDay(draft: string | null, iso: string): { draft: string | null; done: DateRange | null } {
  return draft ? { draft: null, done: orderRange(draft, iso) } : { draft: iso, done: null };
}

/** The range the calendar shows: the range in progress up to the day under the pointer or the focus, else the value. */
export function shownRange(value: DateRange, draft: string | null, hover: string | null): DateRange {
  return draft ? orderRange(draft, hover ?? draft) : value;
}

/** Whether a preset can be picked: real days, in order, inside min and max. */
export function presetUsable(preset: RangePreset, min?: string | null, max?: string | null): boolean {
  const range = cleanRange(preset);
  return (
    range.start === preset.start &&
    range.end === preset.end &&
    !isOutOfBounds(preset.start, { min, max }) &&
    !isOutOfBounds(preset.end, { min, max })
  );
}

/** The range as text, e.g. "Nov 10 – 20, 2026"; null when the range has no start. */
export function formatRange(range: DateRange, locale?: string): string | null {
  const day = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  if (!range.start) return null;
  if (!range.end) return `${format.format(day(range.start))} –`;
  return format.formatRange(day(range.start), day(range.end));
}
