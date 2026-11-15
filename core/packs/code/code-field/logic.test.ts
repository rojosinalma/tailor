import { describe, expect, test } from "bun:test";
import { lineCount, rowsFor, tabEdit } from "./logic";

const apply = (value: string, start: number, end: number): [string, number, number] => {
  const e = tabEdit(value, start, end);
  return [value.slice(0, e.from) + e.text + value.slice(e.to), e.selectionStart, e.selectionEnd];
};

describe("rowsFor", () => {
  test("grows with the lines between the bounds", () => {
    expect(lineCount("a\nb\nc")).toBe(3);
    expect(rowsFor("a", 3, 8)).toBe(3);
    expect(rowsFor("1\n2\n3\n4\n5", 3, 8)).toBe(5);
    expect(rowsFor("\n".repeat(20), 3, 8)).toBe(8);
  });
  test("a max below rows keeps rows", () => {
    expect(rowsFor("\n".repeat(20), 4, 2)).toBe(4);
  });
});

describe("tabEdit", () => {
  test("inserts two spaces at the caret", () => {
    expect(apply("ab", 1, 1)).toEqual(["a  b", 3, 3]);
  });
  test("indents every selected line", () => {
    expect(apply("one\ntwo\nthree", 5, 9)).toEqual(["one\n  two\n  three", 7, 13]);
  });
  test("a selection inside one line indents that line", () => {
    expect(apply("key=value", 4, 9)).toEqual(["  key=value", 6, 11]);
  });
});
