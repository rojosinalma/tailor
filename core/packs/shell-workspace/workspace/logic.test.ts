import { describe, expect, test } from "bun:test";
import { lengthToPx, parseLayout, resizeByKey, resizeByPointer } from "./logic";

const bounds = { min: 192, max: 512 };

describe("stored layout", () => {
  test("reads every valid value", () =>
    expect(
      parseLayout(
        '{"left":240,"leftCollapsed":true,"panel":"notes","right":320,"bottom":200,"bottomCollapsed":false}',
      ),
    ).toEqual({
      left: 240,
      leftCollapsed: true,
      panel: "notes",
      right: 320,
      bottom: 200,
      bottomCollapsed: false,
    }));
  test("keeps a closed panel", () => expect(parseLayout('{"panel":null}')).toEqual({ panel: null }));
  test("drops values of the wrong kind", () =>
    expect(parseLayout('{"left":"wide","leftCollapsed":1,"right":-4,"panel":3}')).toEqual({}));
  test("reads nothing from broken text", () => {
    expect(parseLayout("{left")).toEqual({});
    expect(parseLayout("null")).toEqual({});
    expect(parseLayout(null)).toEqual({});
  });
});

describe("lengths", () => {
  test("rem", () => expect(lengthToPx(" 12rem", 16)).toBe(192));
  test("px", () => expect(lengthToPx("240px", 16)).toBe(240));
  test("anything else", () => expect(lengthToPx("calc(1rem + 2px)", 16)).toBeNaN());
});

describe("keys", () => {
  test("the sidebar grows to the right", () => {
    expect(resizeByKey("left", "ArrowRight", 240, bounds, 16)).toBe(256);
    expect(resizeByKey("left", "ArrowLeft", 240, bounds, 16)).toBe(224);
  });
  test("the panel grows to the left", () => {
    expect(resizeByKey("right", "ArrowLeft", 320, bounds, 16)).toBe(336);
    expect(resizeByKey("right", "ArrowRight", 320, bounds, 16)).toBe(304);
  });
  test("the bottom panel grows upward", () => {
    expect(resizeByKey("bottom", "ArrowUp", 240, bounds, 16)).toBe(256);
    expect(resizeByKey("bottom", "ArrowDown", 240, bounds, 16)).toBe(224);
  });
  test("Home and End go to the bounds; other keys do nothing", () => {
    expect(resizeByKey("right", "Home", 320, bounds, 16)).toBe(192);
    expect(resizeByKey("bottom", "End", 200, bounds, 16)).toBe(512);
    expect(resizeByKey("left", "a", 240, bounds, 16)).toBeNull();
  });
  test("stays inside the bounds", () => expect(resizeByKey("left", "ArrowRight", 510, bounds, 16)).toBe(512));
});

describe("pointer", () => {
  test("the sidebar is as wide as the pointer is from its start", () =>
    expect(resizeByPointer("left", 300, 20, bounds)).toBe(280));
  test("the panel and the bottom panel measure from their fixed edge", () => {
    expect(resizeByPointer("right", 900, 1200, bounds)).toBe(300);
    expect(resizeByPointer("bottom", 500, 800, bounds)).toBe(300);
  });
  test("stays inside the bounds", () => expect(resizeByPointer("left", 2000, 0, bounds)).toBe(512));
});
