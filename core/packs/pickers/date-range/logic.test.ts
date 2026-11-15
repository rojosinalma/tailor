import { describe, expect, test } from "bun:test";
import { cleanRange, formatRange, orderRange, pickDay, presetUsable, shownRange } from "./logic";

describe("picking", () => {
  test("the first click starts, the second ends", () => {
    expect(pickDay(null, "2026-11-10")).toEqual({ draft: "2026-11-10", done: null });
    expect(pickDay("2026-11-10", "2026-11-20")).toEqual({
      draft: null,
      done: { start: "2026-11-10", end: "2026-11-20" },
    });
  });

  test("an end before the start swaps the two", () => {
    expect(pickDay("2026-11-20", "2026-11-10").done).toEqual({ start: "2026-11-10", end: "2026-11-20" });
    expect(orderRange("2026-11-15", "2026-11-15")).toEqual({ start: "2026-11-15", end: "2026-11-15" });
  });

  test("shows the range in progress, else the value", () => {
    const value = { start: "2026-11-01", end: "2026-11-05" };
    expect(shownRange(value, null, "2026-11-30")).toEqual(value);
    expect(shownRange(value, "2026-11-10", null)).toEqual({ start: "2026-11-10", end: "2026-11-10" });
    expect(shownRange(value, "2026-11-10", "2026-11-03")).toEqual({ start: "2026-11-03", end: "2026-11-10" });
  });
});

describe("values", () => {
  test("cleans a range from outside", () => {
    expect(cleanRange(null)).toEqual({ start: null, end: null });
    expect(cleanRange({ start: "2026-11-20", end: "2026-11-10" })).toEqual({
      start: "2026-11-10",
      end: "2026-11-20",
    });
    expect(cleanRange({ start: "2026-02-30", end: "2026-11-10" })).toEqual({
      start: null,
      end: "2026-11-10",
    });
  });

  test("checks presets", () => {
    const week = { label: "Last 7 days", start: "2026-11-09", end: "2026-11-15" };
    expect(presetUsable(week)).toBe(true);
    expect(presetUsable(week, "2026-11-10")).toBe(false);
    expect(presetUsable({ ...week, start: "2026-11-16" })).toBe(false);
  });

  test("formats the range", () => {
    expect(formatRange({ start: "2026-11-10", end: "2026-11-20" }, "en-US")).toBe("Nov 10 – 20, 2026");
    expect(formatRange({ start: "2026-11-10", end: "2026-12-02" }, "en-US")).toBe("Nov 10 – Dec 2, 2026");
    expect(formatRange({ start: "2026-11-10", end: null }, "en-US")).toBe("Nov 10, 2026 –");
    expect(formatRange({ start: null, end: null })).toBeNull();
  });
});
