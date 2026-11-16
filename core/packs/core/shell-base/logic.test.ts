import { expect, test } from "bun:test";
import { barItems, holdsCurrent, initial, isCurrent, matches, type NavEntry, toGroups } from "./logic";

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
