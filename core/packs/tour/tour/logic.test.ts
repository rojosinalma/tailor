import { describe, expect, test } from "bun:test";
import { cutout, nextPresent, position, scrollAboveSheet, settle } from "./logic";

describe("moving between steps", () => {
  const present = [true, false, true, true, false];
  test("next and back pass over a step with no target", () => {
    expect(nextPresent(0, 1, present)).toBe(2);
    expect(nextPresent(2, -1, present)).toBe(0);
    expect(nextPresent(3, 1, present)).toBeNull();
    expect(nextPresent(0, -1, present)).toBeNull();
  });
  test("settle finds the nearest step with a target", () => {
    expect(settle(1, present)).toBe(2);
    expect(settle(4, present)).toBe(3);
    expect(settle(0, [false, false])).toBeNull();
  });
  test("the position counts only the steps with a target", () => {
    expect(position(0, present)).toEqual({ index: 1, count: 3 });
    expect(position(3, present)).toEqual({ index: 3, count: 3 });
  });
});

describe("the cut-out", () => {
  const viewport = { width: 800, height: 600 };
  test("grows the target by the padding", () => {
    expect(cutout({ x: 100, y: 50, width: 200, height: 40 }, 8, viewport)).toEqual({
      x: 92,
      y: 42,
      width: 216,
      height: 56,
    });
  });
  test("stays inside the viewport", () => {
    expect(cutout({ x: -20, y: 590, width: 900, height: 40 }, 8, viewport)).toEqual({
      x: 0,
      y: 582,
      width: 800,
      height: 18,
    });
  });
  test("a target out of the viewport has no area", () => {
    expect(cutout({ x: 10, y: 900, width: 50, height: 20 }, 4, viewport).height).toBe(0);
  });
});

describe("scrolling above a bottom sheet", () => {
  test("a target under the sheet scrolls up into the free space", () => {
    // Free space: 16 to 600 - 300 - 16 = 284.
    expect(scrollAboveSheet({ x: 0, y: 400, width: 100, height: 40 }, 600, 300, 16)).toBe(156);
  });
  test("a target above the top scrolls down, one in the space stays", () => {
    expect(scrollAboveSheet({ x: 0, y: -50, width: 100, height: 40 }, 600, 300, 16)).toBe(-66);
    expect(scrollAboveSheet({ x: 0, y: 100, width: 100, height: 40 }, 600, 300, 16)).toBe(0);
  });
  test("a target taller than the space keeps its top in view", () => {
    expect(scrollAboveSheet({ x: 0, y: 200, width: 100, height: 500 }, 600, 300, 16)).toBe(184);
  });
});
