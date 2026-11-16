/**
 * The logic of the message list, shared by both kits. Plain TypeScript, no DOM.
 * It decides where the transcript scrolls after a change, counts the messages that arrived out of sight,
 * and lays the messages out in days and author groups.
 */

/** How close to the end (in CSS pixels) still counts as "at the end". */
export const END_SLACK = 32;

export interface ScrollMetrics {
  readonly scrollTop: number;
  readonly scrollHeight: number;
  readonly clientHeight: number;
}

export const atEnd = (m: ScrollMetrics, slack = END_SLACK): boolean =>
  m.scrollHeight - m.clientHeight - m.scrollTop <= slack;

export const atStart = (m: ScrollMetrics, slack = END_SLACK): boolean => m.scrollTop <= slack;

export interface ScrollBefore {
  /** The view was at the end before the change. */
  readonly pinned: boolean;
  /** The distance from the top of the view to the top of the first message in sight, if any. */
  readonly anchorOffset: number | null;
}

export interface ScrollAfter extends ScrollMetrics {
  /** The same distance for the same message, after the change. */
  readonly anchorOffset: number | null;
}

/**
 * The scroll position after the content changed, or null to leave it.
 * Pinned to the end: it stays at the end. Scrolled up: the message in sight keeps its place on the screen,
 * so older messages added above or a message growing below never move what the user reads.
 */
export function nextScrollTop(before: ScrollBefore, after: ScrollAfter): number | null {
  if (before.pinned) {
    const end = Math.max(0, after.scrollHeight - after.clientHeight);
    return end === after.scrollTop ? null : end;
  }
  if (before.anchorOffset === null || after.anchorOffset === null) return null;
  const shift = after.anchorOffset - before.anchorOffset;
  return shift === 0 ? null : after.scrollTop + shift;
}

/** The number of messages added after the last one that was there before. Older ones added above do not count. */
export function countAppended(before: readonly string[], after: readonly string[]): number {
  const last = before[before.length - 1];
  if (last === undefined) return after.length;
  const index = after.lastIndexOf(last);
  return index === -1 ? 0 : after.length - index - 1;
}

export type Role = "self" | "other" | "system";

export interface Placed {
  readonly role: Role;
  readonly author?: string;
  readonly time?: Date | null;
}

export interface Layout {
  /** A day separator goes before the message: the date of its day. */
  readonly day: Date | null;
  /** The message starts a group: it shows the avatar and the name. */
  readonly groupStart: boolean;
}

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** A day separator where the day changes, and a new group where the author or the role changes or a day starts. */
export function layout(messages: readonly Placed[]): Layout[] {
  let lastDay: Date | null = null;
  let previous: Placed | undefined;
  return messages.map((message) => {
    const time = message.time ?? null;
    const day = time && !(lastDay && sameDay(lastDay, time)) ? time : null;
    if (time) lastDay = time;
    const groupStart =
      day !== null ||
      previous === undefined ||
      message.role === "system" ||
      previous.role !== message.role ||
      previous.author !== message.author;
    previous = message;
    return { day, groupStart };
  });
}

/** A short clock time, e.g. "2:30 PM". */
export const formatClock = (date: Date, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(date);

/** The label of a day separator: the today text on the current day, the date on other days. */
export const formatDay = (date: Date, now: Date, today: string, locale?: string): string =>
  sameDay(date, now) ? today : new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
