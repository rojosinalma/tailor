import { describe, expect, test } from "bun:test";
import {
  addDays,
  addMonths,
  clampIso,
  daysInMonth,
  focusDay,
  formatDate,
  formatLong,
  monthGrid,
  monthLabel,
  moveByKey,
  parseIso,
  todayIso,
  toIso,
  weekdayNames,
} from "./logic";

describe("parse and print", () => {
  test("parses a real day", () => {
    expect(parseIso("2026-11-15")).toEqual({ year: 2026, month: 10, day: 15 });
  });

  test("rejects text that is not a real day", () => {
    for (const bad of ["", "2026-13-01", "2026-02-30", "2026-1-5", "15.11.2026", null, undefined]) {
      expect(parseIso(bad)).toBeNull();
    }
  });

  test("prints and rolls over", () => {
    expect(toIso(2026, 10, 15)).toBe("2026-11-15");
    expect(toIso(2026, 11, 32)).toBe("2027-01-01");
    expect(toIso(2026, 0, 0)).toBe("2025-12-31");
    expect(toIso(5, 0, 1)).toBe("0005-01-01");
  });

  test("today comes from the local calendar", () => {
    expect(todayIso(new Date(2026, 10, 15, 23, 59))).toBe("2026-11-15");
  });
});

describe("arithmetic", () => {
  test("adds days across month and year edges", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-03-29", 7)).toBe("2026-04-05");
  });

  test("knows leap years", () => {
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2000, 1)).toBe(29);
    expect(daysInMonth(1900, 1)).toBe(28);
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });

  test("adds months and clamps the day", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
  });

  test("clamps to min and max", () => {
    expect(clampIso("2026-11-01", "2026-11-10", "2026-11-20")).toBe("2026-11-10");
    expect(clampIso("2026-11-30", "2026-11-10", "2026-11-20")).toBe("2026-11-20");
    expect(clampIso("2026-11-15", "2026-11-10", "2026-11-20")).toBe("2026-11-15");
    expect(clampIso("2026-11-15")).toBe("2026-11-15");
  });
});

describe("month grid", () => {
  const flat = (weeks: ReturnType<typeof monthGrid>) => weeks.flat();

  test("starts on Monday by default", () => {
    // November 2026 starts on a Sunday.
    const weeks = monthGrid(2026, 10, { today: "2026-11-15" });
    expect(weeks[0]?.[0]?.iso).toBe("2026-10-26");
    expect(weeks.at(-1)?.at(-1)?.iso).toBe("2026-12-06");
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  test("starts on Sunday when asked", () => {
    const weeks = monthGrid(2026, 10, { weekStart: 0, today: "2026-11-15" });
    expect(weeks[0]?.[0]?.iso).toBe("2026-11-01");
    expect(weeks.at(-1)?.at(-1)?.iso).toBe("2026-12-05");
  });

  test("marks outside days and today", () => {
    const days = flat(monthGrid(2026, 10, { today: "2026-11-15" }));
    expect(days.filter((d) => !d.outside)).toHaveLength(30);
    expect(days.find((d) => d.iso === "2026-10-31")?.outside).toBe(true);
    expect(days.filter((d) => d.today).map((d) => d.iso)).toEqual(["2026-11-15"]);
    expect(days.find((d) => d.iso === "2026-11-15")?.day).toBe(15);
  });

  test("a leap February has 29 days", () => {
    const days = flat(monthGrid(2024, 1, { today: "2024-01-01" }));
    expect(days.filter((d) => !d.outside)).toHaveLength(29);
  });

  test("disables days outside min and max", () => {
    const days = flat(monthGrid(2026, 10, { min: "2026-11-10", max: "2026-11-20", today: "2026-11-15" }));
    expect(days.find((d) => d.iso === "2026-11-09")?.disabled).toBe(true);
    expect(days.find((d) => d.iso === "2026-11-10")?.disabled).toBe(false);
    expect(days.find((d) => d.iso === "2026-11-20")?.disabled).toBe(false);
    expect(days.find((d) => d.iso === "2026-11-21")?.disabled).toBe(true);
  });
});

describe("focus and keys", () => {
  const today = "2026-11-15";

  test("focuses the selected day, else today, else the first usable day", () => {
    expect(focusDay(2026, 10, "2026-11-03", { today })).toBe("2026-11-03");
    expect(focusDay(2026, 10, "2026-12-03", { today })).toBe(today);
    expect(focusDay(2026, 9, null, { today })).toBe("2026-10-01");
    expect(focusDay(2026, 10, null, { today, min: "2026-11-20" })).toBe("2026-11-20");
  });

  test("moves by day, week, week edge and month", () => {
    expect(moveByKey("2026-11-15", "ArrowLeft")).toBe("2026-11-14");
    expect(moveByKey("2026-11-30", "ArrowRight")).toBe("2026-12-01");
    expect(moveByKey("2026-11-03", "ArrowUp")).toBe("2026-10-27");
    expect(moveByKey("2026-11-15", "ArrowDown")).toBe("2026-11-22");
    expect(moveByKey("2026-11-15", "Home")).toBe("2026-11-09");
    expect(moveByKey("2026-11-15", "End")).toBe("2026-11-15");
    expect(moveByKey("2026-11-15", "Home", { weekStart: 0 })).toBe("2026-11-15");
    expect(moveByKey("2026-11-15", "End", { weekStart: 0 })).toBe("2026-11-21");
    expect(moveByKey("2026-01-31", "PageDown")).toBe("2026-02-28");
    expect(moveByKey("2026-11-15", "PageUp")).toBe("2026-10-15");
    expect(moveByKey("2026-11-15", "a")).toBeNull();
  });

  test("stays inside min and max", () => {
    expect(moveByKey("2026-11-10", "ArrowLeft", { min: "2026-11-10" })).toBe("2026-11-10");
    expect(moveByKey("2026-11-15", "PageDown", { max: "2026-11-20" })).toBe("2026-11-20");
  });
});

describe("names", () => {
  test("weekday names follow the week start", () => {
    expect(weekdayNames("en-US", 1)[0]).toEqual({ short: "Mo", long: "Monday" });
    expect(weekdayNames("en-US", 0)[0]).toEqual({ short: "Su", long: "Sunday" });
    expect(weekdayNames("en-US", 1)[6]?.long).toBe("Sunday");
  });

  test("month and dates", () => {
    expect(monthLabel(2026, 10, "en-US")).toBe("November 2026");
    expect(formatDate("2026-11-15", "en-US")).toBe("Nov 15, 2026");
    expect(formatLong("2026-11-15", "en-US")).toBe("Sunday, November 15, 2026");
  });
});
