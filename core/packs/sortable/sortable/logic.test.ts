import { describe, expect, test } from "bun:test";
import { announcement, fill, locate, move, moveBetween } from "./logic";

describe("move", () => {
  test("moves down and up", () => {
    expect(move(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(move(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  test("clamps the target and ignores a missing source", () => {
    expect(move(["a", "b", "c"], 0, 9)).toEqual(["b", "c", "a"]);
    expect(move(["a", "b", "c"], 2, -4)).toEqual(["c", "a", "b"]);
    expect(move(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });

  test("never changes the input", () => {
    const input = ["a", "b", "c"] as const;
    move(input, 0, 2);
    expect(input).toEqual(["a", "b", "c"]);
  });
});

describe("between lists", () => {
  const lists = { todo: ["a", "b"], doing: ["c"], done: [] };

  test("finds an item", () => {
    expect(locate(lists, "c")).toEqual({ list: "doing", index: 0 });
    expect(locate(lists, "x")).toBeNull();
  });

  test("moves to another list at an index", () => {
    expect(moveBetween(lists, "a", "doing", 0)).toEqual({ todo: ["b"], doing: ["a", "c"], done: [] });
    expect(moveBetween(lists, "b", "doing", 5)).toEqual({ todo: ["a"], doing: ["c", "b"], done: [] });
  });

  test("moves into an empty list", () => {
    expect(moveBetween(lists, "c", "done", 0)).toEqual({ todo: ["a", "b"], doing: [], done: ["c"] });
  });

  test("moves inside one list", () => {
    expect(moveBetween(lists, "a", "todo", 1)).toEqual({ todo: ["b", "a"], doing: ["c"], done: [] });
  });

  test("returns the same lists when nothing changes", () => {
    expect(moveBetween(lists, "a", "todo", 0)).toBe(lists);
    expect(moveBetween(lists, "x", "todo", 0)).toBe(lists);
    expect(moveBetween(lists, "a", "nowhere", 0)).toBe(lists);
  });
});

describe("announcements", () => {
  const texts = {
    pickedUp: "Picked up {label}. Position {position} of {count}.",
    moved: "Moved to position {position} of {count}.",
    movedList: "Moved to {list}, position {position} of {count}.",
  };

  test("fills placeholders and keeps unknown ones", () => {
    expect(fill("Reorder {label}", { label: "web-1" })).toBe("Reorder web-1");
    expect(fill("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });

  test("counts positions from 1", () => {
    expect(announcement("pickedUp", texts, { label: "web-1", index: 1, count: 5 })).toBe(
      "Picked up web-1. Position 2 of 5.",
    );
    expect(announcement("moved", texts, { label: "web-1", index: 2, count: 5 })).toBe(
      "Moved to position 3 of 5.",
    );
    expect(announcement("moved", texts, { label: "web-1", index: 0, count: 3, list: "Done" })).toBe(
      "Moved to Done, position 1 of 3.",
    );
  });
});
