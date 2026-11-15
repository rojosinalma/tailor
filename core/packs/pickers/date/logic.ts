/**
 * The date logic of the date picker, shared by both kits. Plain TypeScript, no DOM.
 * A date is an ISO string YYYY-MM-DD. Months are 0-based (0 = January), as in Date.
 * The arithmetic runs in UTC, so a time zone change never shifts a day.
 */

export type WeekStart = 0 | 1;

export interface DateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface Day {
  readonly iso: string;
  readonly day: number;
  /** The day belongs to the month before or after the shown one. */
  readonly outside: boolean;
  readonly today: boolean;
  /** The day is before min or after max. */
  readonly disabled: boolean;
}

export interface Bounds {
  readonly min?: string | null;
  readonly max?: string | null;
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

const pad = (value: number, width: number): string => String(value).padStart(width, "0");

/** The parts of an ISO date, or null when the text is not a real day. */
export function parseIso(iso: string | null | undefined): DateParts | null {
  const match = ISO.exec(iso ?? "");
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day)
    return null;
  return { year, month, day };
}

/** The ISO date of a year, a 0-based month and a day. Values out of range roll over, as in Date.UTC. */
export function toIso(year: number, month: number, day: number): string {
  const date = new Date(0);
  date.setUTCFullYear(year, month, day);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}`;
}

const toUtc = (iso: string): Date => {
  const parts = parseIso(iso);
  if (!parts) throw new Error(`Not an ISO date: "${iso}"`);
  return new Date(Date.UTC(parts.year, parts.month, parts.day));
};

const fromUtc = (date: Date): string => toIso(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/** Today in the local calendar of the user. */
export function todayIso(now: Date = new Date()): string {
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(iso: string, n: number): string {
  return fromUtc(new Date(toUtc(iso).getTime() + n * DAY_MS));
}

/** Moves by whole months and keeps the day, clamped to the length of the new month. */
export function addMonths(iso: string, n: number): string {
  const date = toUtc(iso);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const last = daysInMonth(year, month + n);
  return toIso(year, month + n, Math.min(day, last));
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** The day of the week, 0 = Sunday. */
const weekday = (iso: string): number => toUtc(iso).getUTCDay();

export function startOfWeek(iso: string, weekStart: WeekStart = 1): string {
  return addDays(iso, -((weekday(iso) - weekStart + 7) % 7));
}

export function endOfWeek(iso: string, weekStart: WeekStart = 1): string {
  return addDays(startOfWeek(iso, weekStart), 6);
}

/** ISO dates compare as text, so min and max are plain string comparisons. */
export function isOutOfBounds(iso: string, { min, max }: Bounds): boolean {
  return (!!min && iso < min) || (!!max && iso > max);
}

export function clampIso(iso: string, min?: string | null, max?: string | null): string {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

export interface GridOptions extends Bounds {
  readonly weekStart?: WeekStart;
  readonly today?: string;
}

/** The weeks of a month, each 7 days, from the start of the first week to the end of the last. */
export function monthGrid(year: number, month: number, options: GridOptions = {}): Day[][] {
  const { weekStart = 1, today = todayIso() } = options;
  const first = toIso(year, month, 1);
  const last = toIso(year, month, daysInMonth(year, month));
  const end = endOfWeek(last, weekStart);
  const weeks: Day[][] = [];
  for (let start = startOfWeek(first, weekStart); start <= end; start = addDays(start, 7)) {
    const week: Day[] = [];
    for (let i = 0; i < 7; i++) {
      const iso = addDays(start, i);
      week.push({
        iso,
        day: Number(iso.slice(8)),
        outside: iso < first || iso > last,
        today: iso === today,
        disabled: isOutOfBounds(iso, options),
      });
    }
    weeks.push(week);
  }
  return weeks;
}

/**
 * The day that holds the roving tabindex in a shown month: the selected day, else today,
 * else the first day that can be picked, else the first of the month.
 */
export function focusDay(
  year: number,
  month: number,
  selected: string | null | undefined,
  options: GridOptions = {},
): string {
  const { today = todayIso() } = options;
  const prefix = toIso(year, month, 1).slice(0, 7);
  const usable = (iso: string | null | undefined): iso is string =>
    !!iso && iso.startsWith(prefix) && !isOutOfBounds(iso, options);
  if (usable(selected)) return selected;
  if (usable(today)) return today;
  for (let day = 1; day <= daysInMonth(year, month); day++) {
    const iso = toIso(year, month, day);
    if (!isOutOfBounds(iso, options)) return iso;
  }
  return toIso(year, month, 1);
}

/** Where a key moves the focus in the grid, kept inside min and max; null for a key that does not move it. */
export function moveByKey(iso: string, key: string, options: GridOptions = {}): string | null {
  const { weekStart = 1 } = options;
  const moves: Record<string, () => string> = {
    ArrowLeft: () => addDays(iso, -1),
    ArrowRight: () => addDays(iso, 1),
    ArrowUp: () => addDays(iso, -7),
    ArrowDown: () => addDays(iso, 7),
    Home: () => startOfWeek(iso, weekStart),
    End: () => endOfWeek(iso, weekStart),
    PageUp: () => addMonths(iso, -1),
    PageDown: () => addMonths(iso, 1),
  };
  const move = moves[key];
  return move ? clampIso(move(), options.min, options.max) : null;
}

export interface WeekdayName {
  readonly short: string;
  readonly long: string;
}

/** The names of the 7 weekdays in grid order. The short name is at most 2 characters. */
export function weekdayNames(locale: string | undefined, weekStart: WeekStart = 1): WeekdayName[] {
  const short = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const long = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
  // 2023-01-01 is a Sunday.
  return Array.from({ length: 7 }, (_, i) => {
    const date = toUtc(toIso(2023, 0, 1 + weekStart + i));
    return { short: Array.from(short.format(date)).slice(0, 2).join(""), long: long.format(date) };
  });
}

export function monthLabel(year: number, month: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month, 1)),
  );
}

/** The medium date, e.g. "Nov 15, 2026". */
export function formatDate(iso: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(toUtc(iso));
}

/** The full date for a screen reader, e.g. "Sunday, November 15, 2026". */
export function formatLong(iso: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(toUtc(iso));
}

/** The first day of the month of a date. */
export const monthOf = (iso: string): string => `${iso.slice(0, 7)}-01`;

/**
 * The first shown month after the focus moved, when `months` months show side by side:
 * the view stays while the focus is inside it, else it moves just enough to show the focus.
 */
export function viewFor(view: string, focus: string, months = 1): string {
  const first = monthOf(view);
  const target = monthOf(focus);
  if (target < first) return target;
  if (target > addMonths(first, months - 1)) return addMonths(target, -(months - 1));
  return first;
}

export interface RangeMarks {
  readonly start: boolean;
  readonly end: boolean;
  /** Strictly between the start and the end. */
  readonly inside: boolean;
}

/** How a day sits in a range from start to end (start ≤ end); an open range marks its start only. */
export function rangeMarks(iso: string, start: string | null, end: string | null): RangeMarks {
  return {
    start: !!start && iso === start,
    end: !!end && iso === end,
    inside: !!start && !!end && iso > start && iso < end,
  };
}
