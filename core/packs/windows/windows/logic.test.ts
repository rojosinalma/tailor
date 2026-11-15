import { describe, expect, test } from "bun:test";
import {
  cascadePosition,
  clampBox,
  keyAction,
  moveBox,
  parseLayouts,
  resizeBox,
  toFront,
  withoutId,
  zIndex,
} from "./logic";

const viewport = { width: 1000, height: 800 };
const min = { width: 200, height: 120 };
const box = { x: 100, y: 100, width: 400, height: 300 };

describe("clamp", () => {
  test("keeps a box that fits", () => expect(clampBox(box, viewport, min)).toEqual(box));
  test("keeps 48 px of the bar inside on the right", () =>
    expect(clampBox({ ...box, x: 990 }, viewport, min).x).toBe(952));
  test("keeps 48 px of the bar inside on the left", () =>
    expect(clampBox({ ...box, x: -900 }, viewport, min).x).toBe(-352));
  test("keeps the top edge inside", () => expect(clampBox({ ...box, y: -50 }, viewport, min).y).toBe(0));
  test("keeps the bar above the bottom edge", () =>
    expect(clampBox({ ...box, y: 900 }, viewport, min).y).toBe(752));
  test("shrinks a box larger than the viewport", () =>
    expect(clampBox({ x: 0, y: 0, width: 2000, height: 2000 }, viewport, min)).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
    }));
  test("grows a box under the minimum", () =>
    expect(clampBox({ ...box, width: 50, height: 50 }, viewport, min)).toMatchObject({
      width: 200,
      height: 120,
    }));
  test("a viewport under the minimum gives the viewport size", () =>
    expect(clampBox(box, { width: 150, height: 100 }, min)).toMatchObject({ width: 150, height: 100 }));
});

describe("move", () => {
  test("moves by the delta", () =>
    expect(moveBox(box, 30, -20, viewport, min)).toEqual({ ...box, x: 130, y: 80 }));
  test("stops where the strip would leave", () =>
    expect(moveBox(box, 5000, 5000, viewport, min)).toMatchObject({ x: 952, y: 752 }));
});

describe("resize", () => {
  test("the bottom end corner grows the size", () =>
    expect(resizeBox(box, "se", 50, 40, viewport, min)).toEqual({ ...box, width: 450, height: 340 }));
  test("the top start corner keeps the opposite corner", () =>
    expect(resizeBox(box, "nw", -50, -40, viewport, min)).toEqual({ x: 50, y: 60, width: 450, height: 340 }));
  test("stops at the minimum, from either side", () => {
    expect(resizeBox(box, "e", -1000, 0, viewport, min).width).toBe(200);
    expect(resizeBox(box, "w", 1000, 0, viewport, min)).toMatchObject({ x: 300, width: 200 });
    expect(resizeBox(box, "n", 0, 1000, viewport, min)).toMatchObject({ y: 280, height: 120 });
  });
  test("stops at the viewport edge", () => {
    expect(resizeBox(box, "e", 5000, 0, viewport, min).width).toBe(900);
    expect(resizeBox(box, "w", -5000, 0, viewport, min)).toMatchObject({ x: 0, width: 500 });
    expect(resizeBox(box, "s", 0, 5000, viewport, min).height).toBe(700);
  });
  test("an edge only moves the axis it owns", () =>
    expect(resizeBox(box, "s", 99, 10, viewport, min)).toEqual({ ...box, height: 310 }));
});

describe("cascade", () => {
  const size = { width: 400, height: 300 };
  test("the first window starts at the origin", () =>
    expect(cascadePosition(null, size, viewport)).toEqual({ x: 48, y: 48 }));
  test("the next one is offset", () =>
    expect(cascadePosition({ x: 48, y: 48 }, size, viewport)).toEqual({ x: 80, y: 80 }));
  test("wraps to the origin when it would leave the viewport", () =>
    expect(cascadePosition({ x: 480, y: 480 }, size, viewport)).toEqual({ x: 48, y: 48 }));
  test("a small viewport moves the origin in", () =>
    expect(cascadePosition(null, size, { width: 420, height: 320 })).toEqual({ x: 20, y: 20 }));
});

describe("keys", () => {
  test("an arrow moves by a step", () =>
    expect(keyAction("ArrowLeft", false, false)).toEqual({ kind: "move", dx: -16, dy: 0 }));
  test("Shift takes a larger step", () =>
    expect(keyAction("ArrowDown", true, false)).toEqual({ kind: "move", dx: 0, dy: 64 }));
  test("Alt resizes", () =>
    expect(keyAction("ArrowRight", false, true)).toEqual({ kind: "resize", dx: 16, dy: 0 }));
  test("Enter maximises", () => expect(keyAction("Enter", false, false)).toEqual({ kind: "maximize" }));
  test("other keys do nothing", () => expect(keyAction("a", false, false)).toBeNull());
});

describe("z-order", () => {
  test("brings an id to the front", () => expect(toFront(["a", "b", "c"], "a")).toEqual(["b", "c", "a"]));
  test("adds a new id at the front", () => expect(toFront(["a"], "b")).toEqual(["a", "b"]));
  test("removes an id", () => expect(withoutId(["a", "b"], "a")).toEqual(["b"]));
  test("the level counts from 1 at the back", () => expect(zIndex(["a", "b"], "b")).toBe(2));
});

describe("stored layouts", () => {
  const layout = { x: 1, y: 2, width: 300, height: 200, minimized: false, maximized: true };
  test("reads valid layouts", () =>
    expect(parseLayouts(JSON.stringify({ notes: layout }))).toEqual({ notes: layout }));
  test("drops invalid entries", () =>
    expect(parseLayouts(JSON.stringify({ notes: layout, bad: { x: "1" }, worse: null }))).toEqual({
      notes: layout,
    }));
  test("ignores text that is not JSON or not an object", () => {
    expect(parseLayouts("{")).toEqual({});
    expect(parseLayouts("[1]")).toEqual({});
    expect(parseLayouts(null)).toEqual({});
  });
});
