/**
 * The time logic of the time picker, shared by both kits. Plain TypeScript, no DOM.
 * A value is "HH:MM" or "HH:MM:SS" in 24-hour time, as in <input type="time">.
 */

export interface Time {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

export type ColumnKey = "hour" | "minute" | "second" | "period";

export interface TimeOption {
  /** Hour 0–23 (in a 12-hour column 0–11, "12" shows for 0), minute, second, or 0 = AM and 1 = PM. */
  readonly value: number;
  readonly text: string;
  readonly disabled: boolean;
  readonly selected: boolean;
}

export interface TimeColumn {
  readonly key: ColumnKey;
  readonly options: readonly TimeOption[];
}

export interface TimeSettings {
  /** The minute step of the minute column. */
  readonly step: number;
  readonly seconds: boolean;
  readonly hour12: boolean;
  readonly min?: string | null;
  readonly max?: string | null;
  readonly locale?: string;
}

const TIME = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;
const pad = (n: number): string => String(n).padStart(2, "0");
const seconds = (time: Time): number => time.hour * 3600 + time.minute * 60 + time.second;

/** The parts of a time, or null when the text is not a time of day. */
export function parseTime(text: string | null | undefined): Time | null {
  const match = TIME.exec(text ?? "");
  if (!match) return null;
  const time = { hour: Number(match[1]), minute: Number(match[2]), second: Number(match[3] ?? 0) };
  return time.hour < 24 && time.minute < 60 && time.second < 60 ? time : null;
}

export function printTime(time: Time, withSeconds: boolean): string {
  const text = `${pad(time.hour)}:${pad(time.minute)}`;
  return withSeconds ? `${text}:${pad(time.second)}` : text;
}

/** Whether the locale shows a 12-hour clock; `hour12` overrides it. */
export function uses12Hour(locale?: string, hour12?: boolean): boolean {
  if (hour12 !== undefined) return hour12;
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" }).resolvedOptions()
    .hourCycle;
  return cycle === "h11" || cycle === "h12";
}

const clock = (locale: string | undefined, hour12: boolean, withSeconds: boolean) =>
  new Intl.DateTimeFormat(locale, {
    hour: hour12 ? "numeric" : "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hourCycle: hour12 ? "h12" : "h23",
    timeZone: "UTC",
  });

const asDate = (time: Time): Date => new Date(Date.UTC(1970, 0, 1, time.hour, time.minute, time.second));

/** The time as the locale writes it, e.g. "2:30 PM" or "14:30". */
export function formatTime(time: Time, hour12: boolean, withSeconds: boolean, locale?: string): string {
  return clock(locale, hour12, withSeconds).format(asDate(time));
}

/** The names of AM and PM in the locale. */
export function periodNames(locale?: string): [string, string] {
  const name = (hour: number): string =>
    clock(locale, true, false)
      .formatToParts(asDate({ hour, minute: 0, second: 0 }))
      .find((part) => part.type === "dayPeriod")?.value ?? (hour < 12 ? "AM" : "PM");
  return [name(1), name(13)];
}

/** Keeps a time inside min and max. */
export function clampTime(time: Time, min?: string | null, max?: string | null): Time {
  const low = parseTime(min);
  const high = parseTime(max);
  if (low && seconds(time) < seconds(low)) return low;
  if (high && seconds(time) > seconds(high)) return high;
  return time;
}

/** The time that the popup starts from when no value is set: noon, kept inside min and max. */
export function startTime(settings: TimeSettings): Time {
  return clampTime({ hour: 12, minute: 0, second: 0 }, settings.min, settings.max);
}

/** Whether the whole span from `from` to `to` (in seconds of the day) lies outside min and max. */
const outside = (from: number, to: number, settings: TimeSettings): boolean => {
  const low = parseTime(settings.min);
  const high = parseTime(settings.max);
  return (!!low && to < seconds(low)) || (!!high && from > seconds(high));
};

/** The columns of the popup for a time: hours, minutes, seconds when asked, AM/PM on a 12-hour clock. */
export function timeColumns(time: Time, settings: TimeSettings): TimeColumn[] {
  const { hour12, step } = settings;
  const base = seconds({ hour: time.hour, minute: 0, second: 0 });
  const range = (count: number, by: number): number[] =>
    Array.from({ length: Math.ceil(count / by) }, (_, i) => i * by);
  const columns: TimeColumn[] = [
    {
      key: "hour",
      options: range(hour12 ? 12 : 24, 1).map((value) => {
        const hour = hour12 ? value + (time.hour >= 12 ? 12 : 0) : value;
        return {
          value,
          text: hour12 ? String(value === 0 ? 12 : value) : pad(value),
          disabled: outside(hour * 3600, hour * 3600 + 3599, settings),
          selected: hour === time.hour,
        };
      }),
    },
    {
      key: "minute",
      options: range(60, Math.min(Math.max(1, Math.round(step)), 60)).map((value) => ({
        value,
        text: pad(value),
        disabled: outside(base + value * 60, base + value * 60 + 59, settings),
        selected: value === time.minute,
      })),
    },
  ];
  if (settings.seconds) {
    const at = base + time.minute * 60;
    columns.push({
      key: "second",
      options: range(60, 1).map((value) => ({
        value,
        text: pad(value),
        disabled: outside(at + value, at + value, settings),
        selected: value === time.second,
      })),
    });
  }
  if (hour12) {
    columns.push({
      key: "period",
      options: periodNames(settings.locale).map((text, value) => ({
        value,
        text,
        disabled: outside(value * 43_200, value * 43_200 + 43_199, settings),
        selected: (time.hour >= 12 ? 1 : 0) === value,
      })),
    });
  }
  return columns;
}

/** The time after a pick in one column, kept inside min and max. */
export function setPart(time: Time, key: ColumnKey, value: number, settings: TimeSettings): Time {
  const pm = time.hour >= 12 ? 12 : 0;
  const next: Time =
    key === "hour"
      ? { ...time, hour: settings.hour12 ? value + pm : value }
      : key === "minute"
        ? { ...time, minute: value }
        : key === "second"
          ? { ...time, second: value }
          : { ...time, hour: (time.hour % 12) + value * 12 };
  return clampTime(next, settings.min, settings.max);
}

/** Where a key moves in a column, past disabled options; null for a key that does not move. */
export function moveOption(options: readonly TimeOption[], index: number, key: string): number | null {
  const usable = (i: number): boolean => options[i]?.disabled === false;
  const find = (from: number, by: number): number => {
    for (let i = from; i >= 0 && i < options.length; i += by) if (usable(i)) return i;
    return index;
  };
  if (key === "ArrowDown") return find(index + 1, 1);
  if (key === "ArrowUp") return find(index - 1, -1);
  if (key === "Home") return find(0, 1);
  if (key === "End") return find(options.length - 1, -1);
  return null;
}

/** The option that typed text names: a number ("7", "07", "15") or the start of AM/PM; -1 for none. */
export function matchTyped(options: readonly TimeOption[], typed: string): number {
  const text = typed.toLowerCase();
  const number = /^\d+$/.test(text) ? Number(text) : Number.NaN;
  const exact = options.findIndex((o) => !o.disabled && Number(o.text) === number);
  if (exact >= 0) return exact;
  return options.findIndex((o) => !o.disabled && o.text.toLowerCase().replace(/^0/, "").startsWith(text));
}
