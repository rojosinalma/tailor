import { describe, expect, test } from "bun:test";
import { canAdd, joinLines, moveItem, parseLines } from "./logic";

describe("lines", () => {
  test("parses one value per line, trimmed, without empty lines", () => {
    expect(parseLines("web-1\n  nas \n\r\n\nweb-2\r\n")).toEqual(["web-1", "nas", "web-2"]);
    expect(parseLines("")).toEqual([]);
  });
  test("joins without empty values", () => {
    expect(joinLines(["web-1", " ", "nas "])).toBe("web-1\nnas");
    expect(joinLines([])).toBe("");
  });
});

describe("moves", () => {
  test("moves an item up and down", () => {
    expect(moveItem(["a", "b", "c"], 2, 1)).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
  });
  test("a move past an end changes nothing", () => {
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 1, 2)).toEqual(["a", "b"]);
  });
  test("the limit", () => {
    expect(canAdd(2, undefined)).toBe(true);
    expect(canAdd(2, 3)).toBe(true);
    expect(canAdd(3, 3)).toBe(false);
  });
});
