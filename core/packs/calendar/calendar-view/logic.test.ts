import { describe, expect, test } from "bun:test";
import {
  eventLabel,
  eventsOn,
  layoutDay,
  layoutWeek,
  momentText,
  monthWeeks,
  parseMoment,
  periodRange,
  periodTitle,
  place,
  placeAll,
  shiftDate,
  timeText,
  weekDays,
} from "./logic";

const TEXTS = { allDay: "All day", range: "{start} to {end}" };
const placed = (title: string, start: string, end?: string, allDay?: boolean) => {
  const item = place({ title, start, end, allDay });
  if (!item) throw new Error(`not placed: ${start}`);
  return item;
};

describe("moments", () => {
  test("reads a day and a day with a time", () => {
    expect(parseMoment("2026-11-15")).toEqual({ date: "2026-11-15", minutes: null });
    expect(parseMoment("2026-11-15T14:30")).toEqual({ date: "2026-11-15", minutes: 870 });
    expect(parseMoment("2026-11-15T14:30:00")).toEqual({ date: "2026-11-15", minutes: 870 });
  });
  test("refuses what is not a moment", () => {
    expect(parseMoment("2026-02-30")).toBeNull();
    expect(parseMoment("2026-11-15T25:00")).toBeNull();
    expect(parseMoment("tomorrow")).toBeNull();
    expect(parseMoment(undefined)).toBeNull();
  });
  test("writes a moment and rolls past midnight", () => {
    expect(momentText("2026-11-15", 870)).toBe("2026-11-15T14:30");
    expect(momentText("2026-11-15", 1500)).toBe("2026-11-16T01:00");
  });
});

describe("placing an event", () => {
  test("a timed event with no end lasts one hour", () => {
    const item = placed("Standup", "2026-11-15T09:00");
    expect(item).toMatchObject({ startDate: "2026-11-15", endDate: "2026-11-15", endMinutes: 600 });
    expect(item.allDayRow).toBe(false);
  });
  test("a whole-day event ends on its last day", () => {
    expect(placed("Trip", "2026-11-16", "2026-11-18")).toMatchObject({
      startDate: "2026-11-16",
      endDate: "2026-11-18",
      startMinutes: null,
      allDayRow: true,
    });
    expect(placed("Holiday", "2026-11-16T10:00", undefined, true).startMinutes).toBeNull();
  });
  test("an event that ends at midnight stays on its day", () => {
    expect(placed("Late", "2026-11-15T22:00", "2026-11-16T00:00")).toMatchObject({
      endDate: "2026-11-15",
      endMinutes: 1440,
      allDayRow: false,
    });
  });
  test("an event over midnight spans two days and goes to the all-day row", () => {
    expect(placed("Migration", "2026-11-15T22:00", "2026-11-16T02:00")).toMatchObject({
      endDate: "2026-11-16",
      endMinutes: 120,
      allDayRow: true,
    });
  });
  test("events sort whole-day first, then by start, then the longer first", () => {
    const list = placeAll([
      { title: "b", start: "2026-11-15T10:00" },
      { title: "a", start: "2026-11-15T10:00", end: "2026-11-15T12:00" },
      { title: "day", start: "2026-11-15" },
      { title: "bad", start: "soon" },
      { title: "early", start: "2026-11-14T23:00" },
    ]);
    expect(list.map((i) => i.event.title)).toEqual(["early", "day", "a", "b"]);
    expect(eventsOn(list, "2026-11-15").map((i) => i.event.title)).toEqual(["day", "a", "b"]);
  });
});

describe("weeks of a month", () => {
  test("November 2026 from Monday has 6 weeks and marks today and the days outside", () => {
    const weeks = monthWeeks("2026-11-15", 1, "2026-11-15");
    expect(weeks).toHaveLength(6);
    expect(weeks[0]?.[0]).toMatchObject({ iso: "2026-10-26", outside: true });
    expect(weeks[5]?.[6]).toMatchObject({ iso: "2026-12-06", outside: true });
    expect(
      weeks
        .flat()
        .filter((d) => d.today)
        .map((d) => d.iso),
    ).toEqual(["2026-11-15"]);
  });
  test("the week around a date", () => {
    expect(weekDays("2026-11-15", 1)).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
    ]);
    expect(weekDays("2026-11-15", 0)[0]).toBe("2026-11-15");
  });
});

describe("events that span days", () => {
  const days = weekDays("2026-11-15", 1);
  test("a span is one bar; bars take the first free lane", () => {
    const { segments, lanes } = layoutWeek(
      days,
      placeAll([
        { title: "Trip", start: "2026-11-10", end: "2026-11-12" },
        { title: "Backup", start: "2026-11-11T02:00" },
        { title: "Audit", start: "2026-11-13" },
      ]),
    );
    expect(lanes).toBe(2);
    expect(segments.map((s) => [s.item.event.title, s.col, s.span, s.lane])).toEqual([
      ["Trip", 1, 3, 0],
      ["Backup", 2, 1, 1],
      ["Audit", 4, 1, 0],
    ]);
  });
  test("a span cut by the week edges marks both ends", () => {
    const { segments } = layoutWeek(
      days,
      placeAll([{ title: "Freeze", start: "2026-11-05", end: "2026-11-20" }]),
    );
    expect(segments[0]).toMatchObject({ col: 0, span: 7, before: true, after: true });
  });
  test("events outside the week are left out", () => {
    expect(layoutWeek(days, placeAll([{ title: "Later", start: "2026-11-30" }])).segments).toEqual([]);
  });
});

describe("overlap columns in a day", () => {
  test("events that overlap share the width, the next free column is reused", () => {
    const blocks = layoutDay(
      placeAll([
        { title: "A", start: "2026-11-15T09:00", end: "2026-11-15T11:00" },
        { title: "B", start: "2026-11-15T09:30", end: "2026-11-15T10:00" },
        { title: "C", start: "2026-11-15T10:00", end: "2026-11-15T10:30" },
        { title: "D", start: "2026-11-15T13:00" },
      ]),
    );
    expect(blocks.map((b) => [b.item.event.title, b.column, b.columns])).toEqual([
      ["A", 0, 2],
      ["B", 1, 2],
      ["C", 1, 2],
      ["D", 0, 1],
    ]);
  });
  test("a short event is at least 30 minutes, and never runs past midnight", () => {
    const [short, late] = layoutDay(
      placeAll([
        { title: "Ping", start: "2026-11-15T08:00", end: "2026-11-15T08:05" },
        { title: "Late", start: "2026-11-15T23:50", end: "2026-11-16T00:00" },
      ]),
    );
    expect(short).toMatchObject({ top: 480, length: 30 });
    expect(late).toMatchObject({ top: 1430, length: 10 });
  });
  test("whole-day events stay out of the day column", () => {
    expect(layoutDay(placeAll([{ title: "Day", start: "2026-11-15" }]))).toEqual([]);
  });
});

describe("periods", () => {
  test("ranges and shifts", () => {
    expect(periodRange("month", "2026-11-15", 1)).toEqual({ first: "2026-11-01", last: "2026-11-30" });
    expect(periodRange("week", "2026-11-15", 1)).toEqual({ first: "2026-11-09", last: "2026-11-15" });
    expect(shiftDate("week", "2026-11-15", 1)).toBe("2026-11-22");
    expect(shiftDate("month", "2026-01-31", 1)).toBe("2026-02-28");
  });
  test("titles", () => {
    expect(periodTitle("month", "2026-11-15", 1, "en-US")).toBe("November 2026");
    expect(periodTitle("week", "2026-11-15", 1, "en-US")).toBe("Nov 9 – 15, 2026");
    expect(periodTitle("week", "2026-12-01", 1, "en-US")).toBe("Nov 30 – Dec 6, 2026");
  });
});

describe("names", () => {
  test("a timed event", () => {
    const item = placed("Deploy window", "2026-11-15T14:30", "2026-11-15T16:00");
    expect(eventLabel(item, TEXTS, "en-US")).toBe("Deploy window, Nov 15, 2:30 PM to 4:00 PM");
    expect(timeText(item, TEXTS, "en-US")).toBe("2:30 PM – 4:00 PM");
  });
  test("whole-day and spanning events", () => {
    expect(eventLabel(placed("Backup", "2026-11-15"), TEXTS, "en-US")).toBe("Backup, Nov 15, all day");
    expect(eventLabel(placed("Trip", "2026-11-16", "2026-11-18"), TEXTS, "en-US")).toBe(
      "Trip, Nov 16 to Nov 18, all day",
    );
    expect(eventLabel(placed("Move", "2026-11-15T22:00", "2026-11-16T02:00"), TEXTS, "en-US")).toBe(
      "Move, Nov 15, 10:00 PM to Nov 16, 2:00 AM",
    );
  });
});
