/**
 * The logic of the relative time, shared by both kits. Plain TypeScript, no DOM.
 * It picks the unit and the value, formats them, tells when the text changes next, and runs one shared
 * timer for every relative time on the page.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** Each unit applies from its own start up to the start of the next one. */
const UNITS: readonly { unit: Intl.RelativeTimeFormatUnit; size: number }[] = [
  { unit: "year", size: YEAR },
  { unit: "month", size: MONTH },
  { unit: "week", size: WEEK },
  { unit: "day", size: DAY },
  { unit: "hour", size: HOUR },
  { unit: "minute", size: MINUTE },
];

/** The shortest and the longest wait between two updates. */
const MIN_WAIT = SECOND;
const MAX_WAIT = HOUR;

export interface Relative {
  /** null: less than a minute away, shown as "just now". */
  readonly unit: Intl.RelativeTimeFormatUnit | null;
  /** Whole units; negative in the past. */
  readonly value: number;
}

/** The unit and the whole number of units between now and the date. */
export function relative(date: Date, now: Date): Relative {
  const diff = date.getTime() - now.getTime();
  const distance = Math.abs(diff);
  const match = UNITS.find((u) => distance >= u.size);
  if (!match) return { unit: null, value: 0 };
  const count = Math.floor(distance / match.size);
  return { unit: match.unit, value: diff < 0 ? -count : count };
}

/** The text: "2 hours ago", "in 3 days", or the just-now text. */
export function formatRelative(date: Date, now: Date, justNow: string, locale?: string): string {
  const { unit, value } = relative(date, now);
  if (unit === null) return justNow;
  return new Intl.RelativeTimeFormat(locale, { numeric: "always" }).format(value, unit);
}

/** The full local date and time, e.g. "November 15, 2026 at 10:00 AM". */
export function formatFull(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(date);
}

/** The milliseconds until the text of the date changes, kept between one second and one hour. */
export function nextUpdate(date: Date, now: Date): number {
  const diff = date.getTime() - now.getTime();
  const distance = Math.abs(diff);
  const match = UNITS.find((u) => distance >= u.size);
  let wait: number;
  if (diff <= 0) {
    // In the past the distance grows: the value changes at its next whole unit, or the unit at its threshold.
    const size = match?.size ?? MINUTE;
    const step = (Math.floor(distance / size) + 1) * size - distance;
    const above = [...UNITS].reverse().find((u) => u.size > distance);
    wait = Math.min(step, above ? above.size - distance : step);
  } else {
    // In the future the distance shrinks: the value changes when it drops below its current whole unit.
    // Less than a minute ahead stays "just now" until a minute has passed.
    wait = match ? distance - Math.floor(distance / match.size) * match.size + 1 : distance + MINUTE;
  }
  return Math.min(MAX_WAIT, Math.max(MIN_WAIT, wait));
}

/** Parses an ISO string or takes a Date; null for a value that is not a time. */
export function toDate(value: string | Date): Date | null {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

/** An update: it repaints and returns the milliseconds until it is due again. */
export type Update = () => number;

interface Ticker {
  readonly due: Map<Update, number>;
  timer: ReturnType<typeof setTimeout> | null;
}

// One ticker per page, shared by every bundle that loads this module.
const host = globalThis as { __tailorTime?: Ticker };
if (!host.__tailorTime) host.__tailorTime = { due: new Map(), timer: null };
const ticker: Ticker = host.__tailorTime;

function schedule(): void {
  if (ticker.timer !== null) clearTimeout(ticker.timer);
  ticker.timer = null;
  if (ticker.due.size === 0) return;
  const first = Math.min(...ticker.due.values());
  ticker.timer = setTimeout(tick, Math.max(0, first - Date.now()));
}

function tick(): void {
  const now = Date.now();
  for (const [update, at] of ticker.due) {
    if (at > now) continue;
    const wait = update();
    // An update may stop itself, for example when its element left the page.
    if (ticker.due.has(update)) ticker.due.set(update, now + wait);
  }
  schedule();
}

/** Calls the update when it is due, on the one shared timer. Returns the function that stops it. */
export function subscribe(update: Update, wait: number): () => void {
  ticker.due.set(update, Date.now() + wait);
  schedule();
  return () => {
    ticker.due.delete(update);
    schedule();
  };
}

/** The number of updates on the shared timer, and whether it runs. */
export function tickerState(): { readonly count: number; readonly running: boolean } {
  return { count: ticker.due.size, running: ticker.timer !== null };
}
