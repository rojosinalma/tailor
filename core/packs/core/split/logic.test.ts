import { describe, expect, test } from "bun:test";
import { clampSize, parseSize, sizeFromKey, sizeFromPointer, splitBounds } from "./logic";

const bounds = splitBounds(15, 85);

describe("bounds", () => {
  test("defaults to 15 and 85", () => expect(splitBounds()).toEqual({ min: 15, max: 85 }));
  test("holds the values between 0 and 100", () =>
    expect(splitBounds(-5, 120)).toEqual({ min: 0, max: 100 }));
  test("swaps a min above the max", () => expect(splitBounds(70, 30)).toEqual({ min: 30, max: 70 }));
});

describe("clamp", () => {
  test("keeps a size inside", () => expect(clampSize(40, bounds)).toBe(40));
  test("raises a size under the min", () => expect(clampSize(3, bounds)).toBe(15));
  test("lowers a size over the max", () => expect(clampSize(99, bounds)).toBe(85));
  test("rounds to one decimal", () => expect(clampSize(33.333, bounds)).toBe(33.3));
  test("gives the middle for NaN", () => expect(clampSize(Number.NaN, bounds)).toBe(50));
});

describe("parse", () => {
  test("reads a number", () => expect(parseSize("40", 50, bounds)).toBe(40));
  test("clamps what it reads", () => expect(parseSize("5", 50, bounds)).toBe(15));
  test("falls back on text", () => expect(parseSize("wide", 30, bounds)).toBe(30));
  test("falls back on empty and null", () => {
    expect(parseSize("", 30, bounds)).toBe(30);
    expect(parseSize(null, 30, bounds)).toBe(30);
  });
});

describe("keys", () => {
  test("arrows move by 2", () => {
    expect(sizeFromKey("ArrowLeft", 50, bounds)).toBe(48);
    expect(sizeFromKey("ArrowUp", 50, bounds)).toBe(48);
    expect(sizeFromKey("ArrowRight", 50, bounds)).toBe(52);
    expect(sizeFromKey("ArrowDown", 50, bounds)).toBe(52);
  });
  test("arrows stop at the bounds", () => {
    expect(sizeFromKey("ArrowLeft", 16, bounds)).toBe(15);
    expect(sizeFromKey("ArrowRight", 84, bounds)).toBe(85);
  });
  test("Home and End go to min and max", () => {
    expect(sizeFromKey("Home", 50, bounds)).toBe(15);
    expect(sizeFromKey("End", 50, bounds)).toBe(85);
  });
  test("other keys do nothing", () => expect(sizeFromKey("a", 50, bounds)).toBeNull());
});

describe("pointer", () => {
  test("gives the percent of the length", () => expect(sizeFromPointer(400, 100, 1000, bounds)).toBe(30));
  test("clamps outside the split", () => {
    expect(sizeFromPointer(0, 100, 1000, bounds)).toBe(15);
    expect(sizeFromPointer(2000, 100, 1000, bounds)).toBe(85);
  });
  test("gives the middle for an empty split", () => expect(sizeFromPointer(10, 0, 0, bounds)).toBe(50));
});
