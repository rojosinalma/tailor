import { describe, expect, test } from "bun:test";
import { moveLeft, pageLeft, type TrackMetrics, viewOf } from "./logic";

// Six slides of 200px with a gap of 16px in a track of 416px: two per view, three pages.
const at = (scrollLeft: number): TrackMetrics => ({
  scrollLeft,
  maxScroll: 6 * 216 - 16 - 416,
  trackWidth: 416,
  slideWidth: 200,
  gap: 16,
  count: 6,
});

describe("viewOf", () => {
  test("counts the slides per view and the pages", () => {
    expect(viewOf(at(0))).toEqual({ perView: 2, pages: 3, page: 0, atStart: true, atEnd: false });
  });
  test("knows the page in the middle and at the end", () => {
    expect(viewOf(at(432)).page).toBe(1);
    expect(viewOf(at(864))).toMatchObject({ page: 2, atEnd: true, atStart: false });
  });
  test("one slide that fits is both ends", () => {
    expect(viewOf({ ...at(0), count: 1, maxScroll: 0 })).toMatchObject({
      pages: 1,
      atStart: true,
      atEnd: true,
    });
  });
});

describe("moves", () => {
  test("one view on, one view back", () => {
    expect(moveLeft(at(0), 1, false)).toBe(432);
    expect(moveLeft(at(432), -1, false)).toBe(0);
  });
  test("never past the end", () => {
    expect(moveLeft(at(648), 1, false)).toBe(864);
  });
  test("stops at the ends, or wraps with loop", () => {
    expect(moveLeft(at(864), 1, false)).toBeNull();
    expect(moveLeft(at(0), -1, false)).toBeNull();
    expect(moveLeft(at(864), 1, true)).toBe(0);
    expect(moveLeft(at(0), -1, true)).toBe(864);
  });
  test("the position of a page", () => {
    expect(pageLeft(at(0), 1)).toBe(432);
    expect(pageLeft(at(0), 2)).toBe(864);
  });
});
