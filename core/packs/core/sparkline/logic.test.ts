import { describe, expect, test } from "bun:test";
import { sparkPaths } from "./logic";

describe("sparkPaths", () => {
  test("no values gives nothing", () => {
    expect(sparkPaths([])).toBeNull();
    expect(sparkPaths([Number.NaN, Number.POSITIVE_INFINITY])).toBeNull();
  });

  test("spreads the values over the width, highest at the top", () => {
    expect(sparkPaths([0, 5, 10])?.line).toBe("M0,100L50,50L100,0");
  });

  test("one value is a flat line across", () => {
    expect(sparkPaths([7])?.line).toBe("M0,0L100,0");
  });

  test("all zero lies on the bottom edge", () => {
    expect(sparkPaths([0, 0, 0])?.line).toBe("M0,100L50,100L100,100");
  });

  test("a spike reaches the top and the rest stays low", () => {
    expect(sparkPaths([1, 1, 100, 1])?.line).toBe("M0,99L33.33,99L66.67,0L100,99");
  });

  test("a value below 0 lowers the bottom of the scale", () => {
    expect(sparkPaths([-10, 10])?.line).toBe("M0,100L100,0");
  });

  test("the area closes down to the bottom edge", () => {
    expect(sparkPaths([0, 10])?.area).toBe("M0,100L100,0L100,100L0,100Z");
  });
});
