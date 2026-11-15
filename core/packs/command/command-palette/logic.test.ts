import { describe, expect, test } from "bun:test";
import { filterGroups, fuzzyMatch, highlight, matchItem, moveHighlight } from "./logic";

describe("fuzzyMatch", () => {
  test("letters in order match, out of order do not", () => {
    expect(fuzzyMatch("hst", "Hosts")).not.toBeNull();
    expect(fuzzyMatch("tsh", "Hosts")).toBeNull();
    expect(fuzzyMatch("x", "Hosts")).toBeNull();
  });
  test("an empty query matches everything with no letters", () => {
    expect(fuzzyMatch("", "Hosts")).toEqual({ score: 0, positions: [] });
    expect(fuzzyMatch("  ", "Hosts")).toEqual({ score: 0, positions: [] });
  });
  test("case and spaces in the query do not count", () => {
    expect(fuzzyMatch("OS", "hosts")?.positions).toEqual([1, 2]);
    expect(fuzzyMatch("ne w", "New host")?.positions).toEqual([0, 1, 2]);
  });
  test("prefers word starts", () => {
    expect(fuzzyMatch("nh", "New host")?.positions).toEqual([0, 4]);
    expect(fuzzyMatch("ds", "Deploy service")?.positions).toEqual([0, 7]);
    expect(fuzzyMatch("ss", "Show settings")?.positions).toEqual([0, 5]);
    expect(fuzzyMatch("gs", "goToSettings")?.positions).toEqual([0, 4]);
  });
  test("a later word start is taken only when the rest still matches", () => {
    expect(fuzzyMatch("st", "Status board")?.positions).toEqual([0, 1]);
    expect(fuzzyMatch("bx", "abx b")?.positions).toEqual([1, 2]);
  });
  test("a prefix scores higher than scattered letters", () => {
    const prefix = fuzzyMatch("set", "Settings")?.score ?? 0;
    const scattered = fuzzyMatch("set", "Restart service")?.score ?? 0;
    expect(prefix).toBeGreaterThan(scattered);
  });
  test("consecutive letters score higher than gaps", () => {
    const run = fuzzyMatch("log", "Logs")?.score ?? 0;
    const gaps = fuzzyMatch("log", "Long range")?.score ?? 0;
    expect(run).toBeGreaterThan(gaps);
  });
});

describe("highlight", () => {
  test("splits a label into matched and plain parts", () => {
    expect(highlight("Hosts", [0, 1, 4])).toEqual([
      { text: "Ho", match: true },
      { text: "st", match: false },
      { text: "s", match: true },
    ]);
    expect(highlight("Hosts", [])).toEqual([{ text: "Hosts", match: false }]);
  });
});

describe("matchItem", () => {
  test("keywords match too, without marking the label", () => {
    const item = { label: "Preferences", keywords: ["settings", "options"] };
    expect(matchItem("sett", item)).toEqual({ score: expect.any(Number), positions: [] });
    expect(matchItem("zzz", item)).toBeNull();
  });
  test("the label wins over a keyword of the same strength", () => {
    const item = { label: "Settings", keywords: ["settings"] };
    expect(matchItem("set", item)?.positions).toEqual([0, 1, 2]);
  });
});

describe("filterGroups", () => {
  const groups = [
    { id: "pages", items: [{ label: "Dashboard" }, { label: "Hosts" }, { label: "Settings" }] },
    { id: "actions", items: [{ label: "Restart service" }, { label: "Add host" }] },
  ];
  test("an empty query keeps everything in order", () => {
    expect(filterGroups(groups, "")).toEqual(groups);
  });
  test("keeps matching items, best first, and drops empty groups", () => {
    const out = filterGroups(groups, "host");
    expect(out.map((g) => g.id)).toEqual(["pages", "actions"]);
    expect(out[0]?.items.map((i) => i.label)).toEqual(["Hosts"]);
    expect(out[1]?.items.map((i) => i.label)).toEqual(["Add host"]);
    expect(filterGroups(groups, "restart").map((g) => g.id)).toEqual(["actions"]);
    expect(filterGroups(groups, "qqq")).toEqual([]);
  });
  test("a group with a better match moves up", () => {
    const out = filterGroups(groups, "add");
    expect(out[0]?.id).toBe("actions");
  });
});

describe("moveHighlight", () => {
  const enabled = [true, false, true, true];
  test("arrows skip disabled items and wrap around", () => {
    expect(moveHighlight(enabled, 0, "ArrowDown")).toBe(2);
    expect(moveHighlight(enabled, 3, "ArrowDown")).toBe(0);
    expect(moveHighlight(enabled, 0, "ArrowUp")).toBe(3);
    expect(moveHighlight(enabled, 2, "ArrowUp")).toBe(0);
  });
  test("from nothing, down goes to the first and up to the last", () => {
    expect(moveHighlight(enabled, -1, "ArrowDown")).toBe(0);
    expect(moveHighlight(enabled, -1, "ArrowUp")).toBe(3);
  });
  test("Home and End", () => {
    expect(moveHighlight([false, true, true, false], 2, "Home")).toBe(1);
    expect(moveHighlight([false, true, true, false], 1, "End")).toBe(2);
  });
  test("nothing to highlight", () => {
    expect(moveHighlight([false, false], 0, "ArrowDown")).toBe(-1);
    expect(moveHighlight([], -1, "Home")).toBe(-1);
  });
});
