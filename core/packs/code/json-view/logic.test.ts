import { describe, expect, test } from "bun:test";
import {
  childrenOf,
  initialOpen,
  kindOf,
  leafText,
  parentId,
  topLevel,
  treeKey,
  visibleNodes,
} from "./logic";

const value = {
  hosts: [
    { name: "web-1", up: true },
    { name: "nas", up: false },
  ],
  total: 2,
  next: null,
};

describe("model", () => {
  test("kinds", () => {
    expect([{}, [], "a", 1, true, null].map(kindOf)).toEqual([
      "object",
      "array",
      "string",
      "number",
      "boolean",
      "null",
    ]);
  });
  test("the top level holds the entries of the root", () => {
    const top = topLevel(value);
    expect(top.map((n) => n.key)).toEqual(["hosts", "total", "next"]);
    expect(top[0]?.size).toBe(2);
    expect(top[0]?.level).toBe(1);
  });
  test("a plain or empty root is one item", () => {
    expect(topLevel(42).map(leafText)).toEqual(["42"]);
    expect(topLevel({})[0]?.kind).toBe("object");
  });
  test("children carry their keys and level", () => {
    const hosts = topLevel(value)[0];
    if (!hosts) throw new Error("no hosts");
    const [first] = childrenOf(hosts);
    expect(first?.key).toBe(0);
    expect(first?.level).toBe(2);
    expect(first && parentId(first.id)).toBe(hosts.id);
  });
  test("strings show as JSON", () => {
    const [node] = topLevel({ a: 'say "hi"' });
    if (!node) throw new Error("no node");
    expect(leafText(node)).toBe('"say \\"hi\\""');
  });
});

describe("open and visible", () => {
  test("depth 1 opens nothing below the top", () => {
    expect(initialOpen(value, 1).size).toBe(0);
    expect(visibleNodes(value, new Set()).length).toBe(3);
  });
  test("depth 2 opens the top level", () => {
    const open = initialOpen(value, 2);
    expect([...open]).toEqual(['["hosts"]']);
    expect(visibleNodes(value, open).map((n) => n.key)).toEqual(["hosts", 0, 1, "total", "next"]);
  });
});

describe("treeKey", () => {
  const open = new Set(['["hosts"]']);
  const visible = visibleNodes(value, open);
  test("down and up move through the shown nodes", () => {
    expect(treeKey("ArrowDown", '["hosts"]', visible, open)).toEqual({ type: "focus", id: '["hosts",0]' });
    expect(treeKey("ArrowUp", '["hosts"]', visible, open)).toBeNull();
    expect(treeKey("End", '["hosts"]', visible, open)).toEqual({ type: "focus", id: '["next"]' });
  });
  test("right opens, then goes to the first child", () => {
    expect(treeKey("ArrowRight", '["hosts",0]', visible, open)).toEqual({ type: "open", id: '["hosts",0]' });
    expect(treeKey("ArrowRight", '["hosts"]', visible, open)).toEqual({ type: "focus", id: '["hosts",0]' });
    expect(treeKey("ArrowRight", '["total"]', visible, open)).toBeNull();
  });
  test("left closes, or goes to the parent", () => {
    expect(treeKey("ArrowLeft", '["hosts"]', visible, open)).toEqual({ type: "close", id: '["hosts"]' });
    expect(treeKey("ArrowLeft", '["hosts",1]', visible, open)).toEqual({ type: "focus", id: '["hosts"]' });
  });
});
