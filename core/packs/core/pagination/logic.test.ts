import { describe, expect, test } from "bun:test";
import { clampPage, pageItems } from "./logic";

describe("pageItems", () => {
  test("shows every page when they fit", () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test("no pages for an empty list", () => {
    expect(pageItems(1, 0)).toEqual([]);
    expect(pageItems(1, -3)).toEqual([]);
  });

  test("near the start, one gap before the last page", () => {
    expect(pageItems(1, 10)).toEqual([1, 2, 3, 4, 5, "gap-end", 10]);
    expect(pageItems(4, 10)).toEqual([1, 2, 3, 4, 5, "gap-end", 10]);
  });

  test("in the middle, the neighbours of the current page between two gaps", () => {
    expect(pageItems(5, 10)).toEqual([1, "gap-start", 4, 5, 6, "gap-end", 10]);
    expect(pageItems(50, 100)).toEqual([1, "gap-start", 49, 50, 51, "gap-end", 100]);
  });

  test("near the end, one gap after the first page", () => {
    expect(pageItems(7, 10)).toEqual([1, "gap-start", 6, 7, 8, 9, 10]);
    expect(pageItems(10, 10)).toEqual([1, "gap-start", 6, 7, 8, 9, 10]);
  });

  test("more siblings show more neighbours", () => {
    expect(pageItems(10, 20, 2)).toEqual([1, "gap-start", 8, 9, 10, 11, 12, "gap-end", 20]);
    expect(pageItems(1, 20, 0)).toEqual([1, 2, 3, "gap-end", 20]);
  });

  test("the length stays the same and a gap never hides one page", () => {
    for (const siblings of [0, 1, 2]) {
      for (let count = 1; count <= 30; count++) {
        const lengths = new Set<number>();
        for (let page = 1; page <= count; page++) {
          const items = pageItems(page, count, siblings);
          lengths.add(items.length);
          expect(items).toContain(page);
          const numbers = items.filter((i): i is number => typeof i === "number");
          for (let i = 1; i < items.length - 1; i++) {
            const item = items[i];
            if (typeof item === "number") continue;
            const before = items[i - 1];
            const after = items[i + 1];
            if (typeof before !== "number" || typeof after !== "number") throw new Error("two gaps in a row");
            expect(after - before).toBeGreaterThan(2);
          }
          expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
        }
        expect(lengths.size).toBe(1);
      }
    }
  });

  test("an out-of-range page is clamped", () => {
    expect(pageItems(0, 10)).toEqual(pageItems(1, 10));
    expect(pageItems(99, 10)).toEqual(pageItems(10, 10));
  });
});

describe("clampPage", () => {
  test("keeps the page inside the pages that exist", () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(9, 5)).toBe(5);
    expect(clampPage(3, 5)).toBe(3);
    expect(clampPage(2, 0)).toBe(1);
  });
});
