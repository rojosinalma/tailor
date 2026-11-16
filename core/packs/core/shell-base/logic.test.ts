import { expect, test } from "bun:test";
import {
  barItems,
  holdsCurrent,
  initial,
  isCurrent,
  matches,
  type NavEntry,
  nextRegion,
  shellForm,
  toGroups,
} from "./logic";

const items: NavEntry[] = [
  { id: "overview", label: "Overview", to: "/", exact: true },
  { id: "system", label: "System", items: [{ id: "jobs", label: "Jobs", to: "/jobs" }] },
];

test("a plain list is one group without a label", () => {
  expect(toGroups(items)).toEqual([{ id: "nav", items }]);
});

test("a list of groups stays as it is", () => {
  const groups = [
    { id: "main", label: "Main", items },
    { id: "more", items: [{ id: "x", label: "X" }] },
  ];
  expect(toGroups(groups)).toEqual(groups);
  expect(toGroups([])).toEqual([]);
});

test("an address matches its own page and the pages under it", () => {
  expect(matches("/hosts", "/hosts")).toBe(true);
  expect(matches("/hosts/", "/hosts")).toBe(true);
  expect(matches("/hosts/web-1", "/hosts")).toBe(true);
  expect(matches("/hosts/web-1", "/hosts", true)).toBe(false);
  expect(matches("/hostsx", "/hosts")).toBe(false);
  expect(matches("/hosts", "/")).toBe(false);
  expect(matches("/", "/")).toBe(true);
  expect(matches("/hosts?sort=name", "/hosts")).toBe(true);
});

test("current is forced by the flag, or found from the path", () => {
  expect(isCurrent({ id: "a", label: "A", current: true }, null)).toBe(true);
  expect(isCurrent({ id: "a", label: "A", to: "/a" }, null)).toBe(false);
  expect(isCurrent({ id: "a", label: "A", to: "/a" }, "/a/b")).toBe(true);
  expect(holdsCurrent(items[1] as NavEntry, "/jobs")).toBe(true);
  expect(holdsCurrent(items[1] as NavEntry, "/")).toBe(false);
});

test("the initial of a label", () => {
  expect(initial(" deploys")).toBe("D");
  expect(initial("")).toBe("?");
});

test("a bottom bar shows five items, or four and More", () => {
  expect(barItems([1, 2, 3, 4, 5])).toEqual({ shown: [1, 2, 3, 4, 5], more: false });
  expect(barItems([1, 2, 3, 4, 5, 6])).toEqual({ shown: [1, 2, 3, 4], more: true });
});

test("the form follows the width of the root, the edges included", () => {
  expect(shellForm(640, 16)).toBe("phone");
  expect(shellForm(641, 16)).toBe("tablet");
  expect(shellForm(1024, 16)).toBe("tablet");
  expect(shellForm(1025, 16)).toBe("desktop");
  expect(shellForm(1280, 20)).toBe("tablet");
});

test("regions cycle forward and back; from outside to the first or the last", () => {
  expect(nextRegion(0, 3, false)).toBe(1);
  expect(nextRegion(2, 3, false)).toBe(0);
  expect(nextRegion(0, 3, true)).toBe(2);
  expect(nextRegion(-1, 3, false)).toBe(0);
  expect(nextRegion(-1, 3, true)).toBe(2);
  expect(nextRegion(-1, 0, false)).toBe(-1);
});
