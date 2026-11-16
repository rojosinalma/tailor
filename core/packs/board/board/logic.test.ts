import { describe, expect, test } from "bun:test";
import { applyBoardMove, columnCards } from "./logic";

const cards = [
  { id: "a", columnId: "todo" },
  { id: "b", columnId: "doing" },
  { id: "c", columnId: "todo" },
  { id: "d", columnId: "doing" },
];

const ids = (list: readonly { id: string; columnId: string }[]) => list.map((c) => `${c.id}:${c.columnId}`);

describe("applyBoardMove", () => {
  test("moves a card to the start, the middle and the end of another column", () => {
    expect(ids(applyBoardMove(cards, { cardId: "a", toColumnId: "doing", index: 0 }))).toEqual([
      "a:doing",
      "b:doing",
      "c:todo",
      "d:doing",
    ]);
    expect(
      ids(columnCards(applyBoardMove(cards, { cardId: "a", toColumnId: "doing", index: 1 }), "doing")),
    ).toEqual(["b:doing", "a:doing", "d:doing"]);
    expect(
      ids(columnCards(applyBoardMove(cards, { cardId: "a", toColumnId: "doing", index: 9 }), "doing")),
    ).toEqual(["b:doing", "d:doing", "a:doing"]);
  });

  test("moves inside a column", () => {
    expect(
      ids(columnCards(applyBoardMove(cards, { cardId: "a", toColumnId: "todo", index: 1 }), "todo")),
    ).toEqual(["c:todo", "a:todo"]);
  });

  test("moves into an empty column and ignores an unknown card", () => {
    expect(ids(applyBoardMove(cards, { cardId: "b", toColumnId: "done", index: 0 }))).toEqual([
      "a:todo",
      "c:todo",
      "d:doing",
      "b:done",
    ]);
    expect(applyBoardMove(cards, { cardId: "x", toColumnId: "done", index: 0 })).toEqual(cards);
  });
});
