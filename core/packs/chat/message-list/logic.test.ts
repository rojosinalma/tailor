import { describe, expect, test } from "bun:test";
import { atEnd, atStart, countAppended, formatDay, layout, nextScrollTop } from "./logic";

const metrics = (scrollTop: number, scrollHeight = 1000, clientHeight = 400) => ({
  scrollTop,
  scrollHeight,
  clientHeight,
});

describe("atEnd and atStart", () => {
  test("the end counts with a little slack", () => {
    expect(atEnd(metrics(600))).toBe(true);
    expect(atEnd(metrics(580))).toBe(true);
    expect(atEnd(metrics(500))).toBe(false);
    expect(atEnd(metrics(0, 300, 400))).toBe(true);
  });
  test("the start counts with a little slack", () => {
    expect(atStart(metrics(0))).toBe(true);
    expect(atStart(metrics(20))).toBe(true);
    expect(atStart(metrics(200))).toBe(false);
  });
});

describe("nextScrollTop", () => {
  test("pinned: a new message or a growing one keeps the view at the end", () => {
    expect(nextScrollTop({ pinned: true, anchorOffset: 0 }, { ...metrics(600, 1100), anchorOffset: 0 })).toBe(
      700,
    );
  });
  test("pinned and already at the end: nothing to do", () => {
    expect(nextScrollTop({ pinned: true, anchorOffset: 0 }, { ...metrics(600), anchorOffset: 0 })).toBeNull();
  });
  test("pinned with content shorter than the view: the end is the top", () => {
    expect(
      nextScrollTop({ pinned: true, anchorOffset: 0 }, { ...metrics(0, 200), anchorOffset: 0 }),
    ).toBeNull();
  });
  test("scrolled up: growth below does not move the view", () => {
    expect(
      nextScrollTop({ pinned: false, anchorOffset: -12 }, { ...metrics(200, 1400), anchorOffset: -12 }),
    ).toBeNull();
  });
  test("scrolled up: older messages added above keep the reading position", () => {
    expect(
      nextScrollTop({ pinned: false, anchorOffset: -12 }, { ...metrics(10, 1500), anchorOffset: 488 }),
    ).toBe(510);
  });
  test("scrolled up with no message in sight: nothing to do", () => {
    expect(
      nextScrollTop({ pinned: false, anchorOffset: null }, { ...metrics(10), anchorOffset: 5 }),
    ).toBeNull();
  });
});

describe("countAppended", () => {
  test("counts the messages after the last known one", () => {
    expect(countAppended(["a", "b"], ["a", "b", "c", "d"])).toBe(2);
  });
  test("older messages above do not count", () => {
    expect(countAppended(["c", "d"], ["a", "b", "c", "d"])).toBe(0);
  });
  test("an empty list before counts every message", () => {
    expect(countAppended([], ["a"])).toBe(1);
  });
  test("a list that was replaced counts nothing", () => {
    expect(countAppended(["a"], ["x", "y"])).toBe(0);
  });
});

describe("layout", () => {
  const at = (iso: string) => new Date(iso);
  test("groups messages of the same author in a row", () => {
    const result = layout([
      { role: "other", author: "alice", time: at("2026-11-15T10:00:00") },
      { role: "other", author: "alice", time: at("2026-11-15T10:01:00") },
      { role: "other", author: "bob", time: at("2026-11-15T10:02:00") },
      { role: "self", time: at("2026-11-15T10:03:00") },
      { role: "self", time: at("2026-11-15T10:04:00") },
    ]);
    expect(result.map((r) => r.groupStart)).toEqual([true, false, true, true, false]);
  });
  test("a system line breaks a group and stands alone", () => {
    const result = layout([
      { role: "other", author: "alice" },
      { role: "system" },
      { role: "system" },
      { role: "other", author: "alice" },
    ]);
    expect(result.map((r) => r.groupStart)).toEqual([true, true, true, true]);
  });
  test("a day separator before the first message and where the day changes", () => {
    const result = layout([
      { role: "other", author: "alice", time: at("2026-11-14T22:00:00") },
      { role: "other", author: "alice", time: at("2026-11-14T23:00:00") },
      { role: "other", author: "alice", time: at("2026-11-15T09:00:00") },
      { role: "other", author: "alice" },
    ]);
    expect(result.map((r) => r.day !== null)).toEqual([true, false, true, false]);
    expect(result.map((r) => r.groupStart)).toEqual([true, false, true, false]);
  });
});

test("formatDay: today, or the date", () => {
  const now = new Date("2026-11-15T12:00:00");
  expect(formatDay(new Date("2026-11-15T08:00:00"), now, "Today", "en-US")).toBe("Today");
  expect(formatDay(new Date("2026-11-14T08:00:00"), now, "Today", "en-US")).toBe("Nov 14, 2026");
});
