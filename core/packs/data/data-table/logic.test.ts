import { describe, expect, test } from "bun:test";
import {
  compareValues,
  matchesFilter,
  matchesText,
  nextSort,
  pageSelection,
  pageWindow,
  rangeText,
  selectRange,
  sortRows,
} from "./logic";

describe("compareValues", () => {
  test("text in the reading order, numbers inside text by value, case ignored", () => {
    expect(["web-10", "web-2", "Api", "db"].sort((a, b) => compareValues(a, b, "text"))).toEqual([
      "Api",
      "db",
      "web-2",
      "web-10",
    ]);
  });

  test("numbers by value, a missing number last", () => {
    expect(["12", "", "3.5", "-1"].sort((a, b) => compareValues(a, b, "num"))).toEqual([
      "-1",
      "3.5",
      "12",
      "",
    ]);
  });

  test("dates by time", () => {
    const dates = ["2026-11-15T10:00:00Z", "2026-01-02", "Nov 3, 2026"];
    expect(dates.sort((a, b) => compareValues(a, b, "date"))).toEqual([
      "2026-01-02",
      "Nov 3, 2026",
      "2026-11-15T10:00:00Z",
    ]);
  });
});

describe("nextSort", () => {
  test("a click cycles ascending, descending, none", () => {
    const one = nextSort([], "name", false);
    expect(one).toEqual([{ id: "name", desc: false }]);
    const two = nextSort(one, "name", false);
    expect(two).toEqual([{ id: "name", desc: true }]);
    expect(nextSort(two, "name", false)).toEqual([]);
  });

  test("a click on another column replaces the sort", () => {
    expect(nextSort([{ id: "name", desc: true }], "host", false)).toEqual([{ id: "host", desc: false }]);
  });

  test("Shift+click adds a second key and cycles it in place", () => {
    const base = [{ id: "host", desc: false }];
    const two = nextSort(base, "name", true);
    expect(two).toEqual([
      { id: "host", desc: false },
      { id: "name", desc: false },
    ]);
    expect(nextSort(two, "host", true)).toEqual([
      { id: "host", desc: true },
      { id: "name", desc: false },
    ]);
    expect(nextSort(nextSort(two, "name", true), "name", true)).toEqual(base);
  });
});

describe("sortRows", () => {
  const rows = [
    { host: "nas", mem: "64" },
    { host: "web-1", mem: "12" },
    { host: "nas", mem: "8" },
  ];
  const value = (row: (typeof rows)[number], id: string): string => (id === "host" ? row.host : row.mem);
  const type = (id: string) => (id === "mem" ? "num" : "text") as "num" | "text";

  test("by several keys, the first key first", () => {
    const sorted = sortRows(
      rows,
      [
        { id: "host", desc: false },
        { id: "mem", desc: true },
      ],
      value,
      type,
    );
    expect(sorted.map((r) => `${r.host}:${r.mem}`)).toEqual(["nas:64", "nas:8", "web-1:12"]);
  });

  test("no keys keep the order", () => {
    expect(sortRows(rows, [], value, type)).toEqual(rows);
  });
});

describe("filters", () => {
  test("text matches every word, in any case and order", () => {
    expect(matchesText("web-1 nas running", "RUN web")).toBe(true);
    expect(matchesText("web-1 nas running", "web stopped")).toBe(false);
    expect(matchesText("anything", "  ")).toBe(true);
  });

  test("a select filter matches the exact value; an empty filter passes", () => {
    expect(matchesFilter("running", "running", "select")).toBe(true);
    expect(matchesFilter("running-old", "running", "select")).toBe(false);
    expect(matchesFilter("running", "", "select")).toBe(true);
    expect(matchesFilter("example/api:3.4", "api", "text")).toBe(true);
  });
});

describe("pages", () => {
  test("the window of a page", () => {
    expect(pageWindow(2, 20, 312)).toEqual({ page: 2, pageCount: 16, start: 20, end: 40 });
    expect(pageWindow(16, 20, 312)).toEqual({ page: 16, pageCount: 16, start: 300, end: 312 });
  });

  test("a page past the end is the last page; no rows is one empty page", () => {
    expect(pageWindow(40, 20, 45).page).toBe(3);
    expect(pageWindow(3, 20, 0)).toEqual({ page: 1, pageCount: 1, start: 0, end: 0 });
  });

  test("the count line", () => {
    expect(rangeText(pageWindow(2, 20, 312), 312, "of")).toBe("21–40 of 312");
    expect(rangeText(pageWindow(1, 20, 0), 0, "of")).toBe("0 of 0");
  });
});

describe("selection", () => {
  const order = ["a", "b", "c", "d", "e"];

  test("a click changes one row", () => {
    expect([...selectRange(new Set(), order, null, "c", true, false)]).toEqual(["c"]);
    expect([...selectRange(new Set(["c"]), order, "c", "c", false, false)]).toEqual([]);
  });

  test("Shift+click selects from the anchor to the row, in both directions", () => {
    expect([...selectRange(new Set(["b"]), order, "b", "d", true, true)].sort()).toEqual(["b", "c", "d"]);
    expect([...selectRange(new Set(["d"]), order, "d", "a", true, true)].sort()).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  test("Shift+click on a selected row clears the range", () => {
    const all = new Set(order);
    expect([...selectRange(all, order, "b", "d", false, true)]).toEqual(["a", "e"]);
  });

  test("Shift+click with an anchor that is gone changes one row", () => {
    expect([...selectRange(new Set(), order, "x", "c", true, true)]).toEqual(["c"]);
  });

  test("the page box", () => {
    expect(pageSelection(new Set(["a", "b"]), ["a", "b"])).toBe("all");
    expect(pageSelection(new Set(["a"]), ["a", "b"])).toBe("some");
    expect(pageSelection(new Set(["z"]), ["a", "b"])).toBe("none");
    expect(pageSelection(new Set(), [])).toBe("none");
  });
});
