import { describe, expect, test } from "bun:test";
import { aspectRatio, outputSize, stepZoom } from "./logic";

describe("aspects", () => {
  test("reads a ratio", () => {
    expect(aspectRatio("16:9", null)).toBeCloseTo(16 / 9);
    expect(aspectRatio("1:1", { width: 400, height: 300 })).toBe(1);
  });
  test("free takes the ratio of the image, or 1 before it loads", () => {
    expect(aspectRatio("free", { width: 400, height: 300 })).toBeCloseTo(4 / 3);
    expect(aspectRatio("free", null)).toBe(1);
    expect(aspectRatio("0:1", null)).toBe(1);
  });
});

describe("zoom", () => {
  test("steps stay between min and max", () => {
    expect(stepZoom(1, 0.1, 1, 3)).toBe(1.1);
    expect(stepZoom(1, -0.1, 1, 3)).toBe(1);
    expect(stepZoom(2.95, 0.1, 1, 3)).toBe(3);
  });
});

describe("output size", () => {
  test("keeps the area when it fits", () => {
    expect(outputSize({ x: 0, y: 0, width: 300, height: 200 })).toEqual({ width: 300, height: 200 });
    expect(outputSize({ x: 0, y: 0, width: 300, height: 200 }, 400)).toEqual({ width: 300, height: 200 });
  });
  test("scales the longer side down to the most", () => {
    expect(outputSize({ x: 0, y: 0, width: 1600, height: 900 }, 800)).toEqual({ width: 800, height: 450 });
  });
});
