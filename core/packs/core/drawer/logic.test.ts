import { describe, expect, test } from "bun:test";
import { swipeCloses, swipeOffset } from "./logic";

describe("swipeOffset", () => {
  test("follows the pointer down", () => expect(swipeOffset(100, 160)).toBe(60));
  test("never goes up", () => expect(swipeOffset(100, 40)).toBe(0));
});

describe("swipeCloses", () => {
  test("a third of the height closes", () => expect(swipeCloses(100, 300)).toBe(true));
  test("less stays open", () => expect(swipeCloses(99, 300)).toBe(false));
  test("a sheet with no height never closes", () => expect(swipeCloses(10, 0)).toBe(false));
});
