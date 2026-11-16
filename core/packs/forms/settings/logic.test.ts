import { describe, expect, test } from "bun:test";
import { activeIndex, saveOutcome } from "./logic";

describe("activeIndex", () => {
  test("the last section that reached the line", () => {
    expect(activeIndex([0, 300, 700], 10, false)).toBe(0);
    expect(activeIndex([-400, -100, 300], 10, false)).toBe(1);
    expect(activeIndex([-900, -500, -50], 10, false)).toBe(2);
  });
  test("the first section before any reached the line", () =>
    expect(activeIndex([40, 300], 10, false)).toBe(0));
  test("the last section at the end of the box", () =>
    expect(activeIndex([-400, 100, 500], 10, true)).toBe(2));
  test("no sections", () => expect(activeIndex([], 0, false)).toBe(-1));
});

describe("saveOutcome", () => {
  test("no answer or ok saves", () => {
    expect(saveOutcome(undefined)).toEqual({ ok: true });
    expect(saveOutcome({ ok: true })).toEqual({ ok: true, message: undefined });
  });
  test("a failure keeps its message", () =>
    expect(saveOutcome({ ok: false, message: "The disk is full." })).toEqual({
      ok: false,
      message: "The disk is full.",
    }));
  test("anything else fails", () => {
    expect(saveOutcome("ok")).toEqual({ ok: false });
    expect(saveOutcome(null)).toEqual({ ok: false });
  });
});
