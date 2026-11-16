/**
 * The logic of the calendar view: periods, and where each event goes in the month, the week and the agenda.
 * Plain TypeScript, no DOM. The date maths comes from the date picker; events add a time of day.
 * A moment is "YYYY-MM-DD" (a whole day) or "YYYY-MM-DDTHH:MM" (local time). The maths runs in UTC,
 * so a time zone change never shifts a day.
 */
import {
  addDays,
  addMonths,
  type Day,
  endOfWeek,
  monthGrid,
  monthLabel,
  parseIso,
  startOfWeek,
  todayIso,
  type WeekStart,
} from "../../pickers/date/logic";

export type View = "month" | "week" | "agenda";

/** What the logic needs of an event; the component adds its own fields. */
export interface EventInput {
  readonly title: string;
  readonly start: string;
  /** A whole-day event: the last day. A timed event: the end moment. */
  readonly end?: string;
  readonly allDay?: boolean;
}

/** An event with its days and minutes worked out. */
export interface Placed<E extends EventInput = EventInput> {
  readonly event: E;
  readonly startDate: string;
  /** The last day the event covers. */
  readonly endDate: string;
  /** Minutes after midnight of the start day; null for a whole-day event. */
  readonly startMinutes: number | null;
  /** Minutes after midnight of the last day, where the event ends. */
  readonly endMinutes: number;
  /** The event lies in the all-day row of the week: it is a whole-day event or it covers more than one day. */
  readonly allDayRow: boolean;
}

const MOMENT = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?$/;
const DAY_MINUTES = 1440;
const DAY_MS = 86_400_000;

/** The day and the minutes of a moment, or null when the text is not one. */
export function parseMoment(text: string | undefined): { date: string; minutes: number | null } | null {
  const match = MOMENT.exec(text ?? "");
  const date = match?.[1];
  if (!match || !date || !parseIso(date)) return null;
  if (match[2] === undefined) return { date, minutes: null };
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  if (hours > 23 || minutes > 59) return null;
  return { date, minutes: hours * 60 + minutes };
}

const dayNumber = (iso: string): number => {
  const parts = parseIso(iso);
  return parts ? Date.UTC(parts.year, parts.month, parts.day) / DAY_MS : 0;
};

/** The number of days from one day to another. */
export const daysBetween = (from: string, to: string): number => dayNumber(to) - dayNumber(from);

/** Works out the days and minutes of an event; null when its start is not a moment. */
export function place<E extends EventInput>(event: E): Placed<E> | null {
  const start = parseMoment(event.start);
  if (!start) return null;
  const end = parseMoment(event.end);
  if (event.allDay || start.minutes === null) {
    const last = end && end.date > start.date ? end.date : start.date;
    return {
      event,
      startDate: start.date,
      endDate: last,
      startMinutes: null,
      endMinutes: DAY_MINUTES,
      allDayRow: true,
    };
  }
  const from = dayNumber(start.date) * DAY_MINUTES + start.minutes;
  // An end with no time ends with its day; no end means one hour.
  const to = end ? dayNumber(end.date) * DAY_MINUTES + (end.minutes ?? DAY_MINUTES) : from + 60;
  const stop = Math.max(to, from);
  // An event that ends at midnight belongs to the day before.
  const lastMinute = stop > from ? stop - 1 : stop;
  const lastDay = Math.floor(lastMinute / DAY_MINUTES);
  const endDate = addDays(start.date, lastDay - dayNumber(start.date));
  return {
    event,
    startDate: start.date,
    endDate,
    startMinutes: start.minutes,
    endMinutes: stop - lastDay * DAY_MINUTES,
    allDayRow: endDate !== start.date,
  };
}

/** Whole-day events first, then by start, then the longer one first, then by title. */
export function compare(a: Placed, b: Placed): number {
  if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
  if (a.allDayRow !== b.allDayRow) return a.allDayRow ? -1 : 1;
  const start = (a.startMinutes ?? -1) - (b.startMinutes ?? -1);
  if (start !== 0) return start;
  if (a.endDate !== b.endDate) return a.endDate > b.endDate ? -1 : 1;
  if (a.endMinutes !== b.endMinutes) return b.endMinutes - a.endMinutes;
  return a.event.title.localeCompare(b.event.title);
}

/** Every event that can be placed, in order. */
export function placeAll<E extends EventInput>(events: readonly E[]): Placed<E>[] {
  return events
    .map((e) => place(e))
    .filter((p): p is Placed<E> => p !== null)
    .sort(compare);
}

export const covers = (item: Placed, iso: string): boolean => item.startDate <= iso && item.endDate >= iso;

/** The events on one day, in order. */
export const eventsOn = <E extends EventInput>(items: readonly Placed<E>[], iso: string): Placed<E>[] =>
  items.filter((item) => covers(item, iso));

/** One bar of an event in a week row: the column it starts in, how many it spans and its lane. */
export interface Segment<E extends EventInput = EventInput> {
  readonly item: Placed<E>;
  /** 0-based column in the week. */
  readonly col: number;
  readonly span: number;
  readonly lane: number;
  /** The event started before this week. */
  readonly before: boolean;
  /** The event goes on after this week. */
  readonly after: boolean;
}

/**
 * Lays the events of one week out as bars in lanes: an event that spans days is one bar, and each bar
 * takes the first lane that is free for all of its days.
 */
export function layoutWeek<E extends EventInput>(
  days: readonly string[],
  items: readonly Placed<E>[],
): { segments: Segment<E>[]; lanes: number } {
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) return { segments: [], lanes: 0 };
  const inWeek = items
    .filter((item) => item.startDate <= last && item.endDate >= first)
    .map((item) => {
      const col = Math.max(0, daysBetween(first, item.startDate));
      const end = Math.min(days.length - 1, daysBetween(first, item.endDate));
      return { item, col, span: end - col + 1 };
    })
    .sort((a, b) => a.col - b.col || b.span - a.span || compare(a.item, b.item));
  const laneEnds: number[] = [];
  const segments = inWeek.map(({ item, col, span }) => {
    let lane = laneEnds.findIndex((end) => end < col);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = col + span - 1;
    return {
      item,
      col,
      span,
      lane,
      before: item.startDate < first,
      after: item.endDate > last,
    };
  });
  return { segments, lanes: laneEnds.length };
}

/** One timed event in a day column: its place in minutes and its column among the events it overlaps. */
export interface Block<E extends EventInput = EventInput> {
  readonly item: Placed<E>;
  /** Minutes after midnight. */
  readonly top: number;
  /** Minutes, at least the shortest length. */
  readonly length: number;
  readonly column: number;
  readonly columns: number;
}

/**
 * Lays the timed events of one day out side by side: events that overlap, directly or through others,
 * share the width; each takes the first free column. An event is at least `shortest` minutes long, so
 * a short event never hides under the next one.
 */
export function layoutDay<E extends EventInput>(items: readonly Placed<E>[], shortest = 30): Block<E>[] {
  const timed = items
    .filter((item) => !item.allDayRow && item.startMinutes !== null)
    .map((item) => {
      const top = item.startMinutes ?? 0;
      const length = Math.min(Math.max(item.endMinutes - top, shortest), DAY_MINUTES - top);
      return { item, top, length };
    })
    .sort((a, b) => a.top - b.top || b.length - a.length);
  const blocks: Block<E>[] = [];
  let group: { item: Placed<E>; top: number; length: number; column: number }[] = [];
  let groupEnd = -1;
  const columnEnds: number[] = [];
  const flush = (): void => {
    const columns = columnEnds.length;
    for (const entry of group) blocks.push({ ...entry, columns });
    group = [];
    columnEnds.length = 0;
  };
  for (const entry of timed) {
    if (entry.top >= groupEnd) flush();
    let column = columnEnds.findIndex((end) => end <= entry.top);
    if (column === -1) column = columnEnds.length;
    columnEnds[column] = entry.top + entry.length;
    group.push({ ...entry, column });
    groupEnd = Math.max(groupEnd, entry.top + entry.length);
  }
  flush();
  return blocks;
}

/** The first and last day that a view shows around a date. */
export function periodRange(view: View, date: string, weekStart: WeekStart): { first: string; last: string } {
  if (view === "week") return { first: startOfWeek(date, weekStart), last: endOfWeek(date, weekStart) };
  const parts = parseIso(date);
  const first = `${date.slice(0, 7)}-01`;
  const days = parts ? new Date(Date.UTC(parts.year, parts.month + 1, 0)).getUTCDate() : 28;
  return { first, last: addDays(first, days - 1) };
}

/** The date one period before (by -1) or after (by 1). */
export const shiftDate = (view: View, date: string, by: number): string =>
  view === "week" ? addDays(date, 7 * by) : addMonths(date, by);

const utc = (iso: string, minutes = 0): Date => new Date(dayNumber(iso) * DAY_MS + minutes * 60_000);

/** The title of the shown period: "November 2026" or "Nov 9 – 15, 2026". */
export function periodTitle(view: View, date: string, weekStart: WeekStart, locale?: string): string {
  if (view !== "week") {
    const parts = parseIso(date);
    return parts ? monthLabel(parts.year, parts.month, locale) : date;
  }
  const { first, last } = periodRange(view, date, weekStart);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).formatRange(utc(first), utc(last));
}

/** The weeks of the month around a date, from the date picker. */
export const monthWeeks = (date: string, weekStart: WeekStart, today = todayIso()): Day[][] => {
  const parts = parseIso(date);
  return parts ? monthGrid(parts.year, parts.month, { weekStart, today }) : [];
};

/** The 7 days of the week around a date. */
export const weekDays = (date: string, weekStart: WeekStart): string[] => {
  const first = startOfWeek(date, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
};

/** "2:30 PM". */
export const formatTime = (minutes: number, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(
    utc("2000-01-01", minutes),
  );

/** "2 PM", for the hour axis. */
export const formatHour = (hour: number, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" }).format(utc("2000-01-01", hour * 60));

/** "Nov 15". */
export const formatDay = (iso: string, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(utc(iso));

/** "Sunday, November 15". */
export const formatDayLong = (iso: string, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(
    utc(iso),
  );

/** The weekday of a day: "Sun", or "Sunday" when long. */
export const formatWeekday = (iso: string, locale?: string, width: "short" | "long" = "short"): string =>
  new Intl.DateTimeFormat(locale, { weekday: width, timeZone: "UTC" }).format(utc(iso));

/** Fills the {name} marks of a text. */
export const fill = (text: string, values: Record<string, string | number>): string =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

export interface LabelTexts {
  /** "All day". */
  readonly allDay: string;
  /** "{start} to {end}". */
  readonly range: string;
}

/** The time of an event as shown: "2:30 PM – 4:00 PM", or the all-day text. */
export function timeText(item: Placed, texts: LabelTexts, locale?: string): string {
  if (item.startMinutes === null) return texts.allDay;
  const start = formatTime(item.startMinutes, locale);
  const end = formatTime(item.endMinutes % DAY_MINUTES, locale);
  if (item.startDate === item.endDate) return `${start} – ${end}`;
  return `${start} – ${formatDay(item.endDate, locale)}, ${end}`;
}

/** The accessible name of an event: "Deploy window, Nov 15, 2:30 PM to 4:00 PM". */
export function eventLabel(item: Placed, texts: LabelTexts, locale?: string): string {
  const { title } = item.event;
  const startDay = formatDay(item.startDate, locale);
  if (item.startMinutes === null) {
    const days =
      item.startDate === item.endDate
        ? startDay
        : fill(texts.range, { start: startDay, end: formatDay(item.endDate, locale) });
    return `${title}, ${days}, ${texts.allDay.toLowerCase()}`;
  }
  const start = formatTime(item.startMinutes, locale);
  const end = formatTime(item.endMinutes % DAY_MINUTES, locale);
  if (item.startDate === item.endDate) return `${title}, ${startDay}, ${fill(texts.range, { start, end })}`;
  return `${title}, ${fill(texts.range, {
    start: `${startDay}, ${start}`,
    end: `${formatDay(item.endDate, locale)}, ${end}`,
  })}`;
}

/** The minutes after midnight of a clock time. */
export const minutesOf = (now: Date): number => now.getHours() * 60 + now.getMinutes();

/** The moment text of a day and minutes: "2026-11-15T14:30", rolled over past midnight. */
export function momentText(iso: string, minutes: number): string {
  const day = Math.floor(minutes / DAY_MINUTES);
  const rest = minutes - day * DAY_MINUTES;
  const hh = String(Math.floor(rest / 60)).padStart(2, "0");
  const mm = String(rest % 60).padStart(2, "0");
  return `${addDays(iso, day)}T${hh}:${mm}`;
}
