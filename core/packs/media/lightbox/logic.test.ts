import { describe, expect, test } from "bun:test";
import { fill, keyTarget, stepTo, swipeAction } from "./logic";

describe("stepTo", () => {
  test("moves inside the set", () => {
    expect(stepTo(2, 1, 5, false)).toBe(3);
    expect(stepTo(2, -1, 5, false)).toBe(1);
  });
  test("stops at the ends without loop", () => {
    expect(stepTo(4, 1, 5, false)).toBeNull();
    expect(stepTo(0, -1, 5, false)).toBeNull();
  });
  test("wraps with loop", () => {
    expect(stepTo(4, 1, 5, true)).toBe(0);
    expect(stepTo(0, -1, 5, true)).toBe(4);
  });
  test("a set of one never moves", () => {
    expect(stepTo(0, 1, 1, true)).toBeNull();
    expect(stepTo(0, 1, 0, true)).toBeNull();
  });
});

describe("keyTarget", () => {
  test("arrows, Home and End", () => {
    expect(keyTarget("ArrowRight", 1, 4, false)).toBe(2);
    expect(keyTarget("ArrowLeft", 1, 4, false)).toBe(0);
    expect(keyTarget("Home", 3, 4, false)).toBe(0);
    expect(keyTarget("End", 0, 4, false)).toBe(3);
  });
  test("no move at the ends and for other keys", () => {
    expect(keyTarget("Home", 0, 4, false)).toBeNull();
    expect(keyTarget("End", 3, 4, false)).toBeNull();
    expect(keyTarget("ArrowRight", 3, 4, false)).toBeNull();
    expect(keyTarget("Enter", 1, 4, false)).toBeNull();
  });
});

describe("swipeAction", () => {
  test("a swipe to the left goes to the next item, to the right to the previous", () => {
    expect(swipeAction(-80, 10)).toBe("next");
    expect(swipeAction(80, -10)).toBe("prev");
  });
  test("a swipe down closes", () => {
    expect(swipeAction(10, 90)).toBe("close");
  });
  test("a short or an upward move does nothing", () => {
    expect(swipeAction(-20, 5)).toBeNull();
    expect(swipeAction(5, -90)).toBeNull();
  });
});

test("fill puts the values in", () => {
  expect(fill("{index} of {count}", { index: 3, count: 12 })).toBe("3 of 12");
  expect(fill("{other}", {})).toBe("{other}");
});
