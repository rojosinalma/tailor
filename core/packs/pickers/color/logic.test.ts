import { describe, expect, test } from "bun:test";
import { areaText, fromArea, fromHue, hexToHsv, hsvToHex, moveArea, moveHue, parseHex } from "./logic";

describe("parse", () => {
  test("reads the hex forms", () => {
    expect(parseHex("#3366CC")).toBe("#3366cc");
    expect(parseHex("3366cc")).toBe("#3366cc");
    expect(parseHex("#36c")).toBe("#3366cc");
    expect(parseHex(" abc ")).toBe("#aabbcc");
  });

  test("rejects the rest", () => {
    for (const bad of ["", "#12", "#12345", "#gggggg", "red", "rgb(0 0 0)", null, undefined]) {
      expect(parseHex(bad)).toBeNull();
    }
  });
});

describe("hex and HSV", () => {
  test("converts the primaries", () => {
    expect(hexToHsv("#ff0000")).toEqual({ h: 0, s: 1, v: 1 });
    expect(hexToHsv("#00ff00")).toEqual({ h: 120, s: 1, v: 1 });
    expect(hexToHsv("#0000ff")).toEqual({ h: 240, s: 1, v: 1 });
    expect(hexToHsv("#000000")).toEqual({ h: 0, s: 0, v: 0 });
    expect(hexToHsv("#ffffff")).toEqual({ h: 0, s: 0, v: 1 });
  });

  test("goes there and back", () => {
    for (const hex of ["#3366cc", "#fabd2f", "#83a598", "#123456", "#ff00ff", "#808080"]) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
    expect(hsvToHex({ h: 360, s: 1, v: 1 })).toBe("#ff0000");
  });

  test("clamps out of range values", () => {
    expect(hsvToHex({ h: 500, s: 2, v: -1 })).toBe("#000000");
    expect(hsvToHex({ h: -20, s: 1, v: 1 })).toBe("#ff0000");
  });
});

describe("pointer and keys", () => {
  test("reads a point of the area and the hue slider", () => {
    expect(fromArea(200, 0.25, 0.4)).toEqual({ h: 200, s: 0.25, v: 0.6 });
    expect(fromArea(200, -1, 2)).toEqual({ h: 200, s: 0, v: 0 });
    expect(fromHue({ h: 0, s: 1, v: 1 }, 0.5).h).toBe(180);
  });

  test("moves the area thumb", () => {
    const hsv = { h: 10, s: 0.5, v: 0.5 };
    expect(moveArea(hsv, "ArrowRight")?.s).toBeCloseTo(0.51);
    expect(moveArea(hsv, "ArrowUp", true)?.v).toBeCloseTo(0.6);
    expect(moveArea({ ...hsv, s: 1 }, "ArrowRight")?.s).toBe(1);
    expect(moveArea(hsv, "Home")?.s).toBe(0);
    expect(moveArea(hsv, "x")).toBeNull();
  });

  test("moves the hue thumb", () => {
    const hsv = { h: 10, s: 0.5, v: 0.5 };
    expect(moveHue(hsv, "ArrowRight")?.h).toBe(11);
    expect(moveHue(hsv, "ArrowLeft", true)?.h).toBe(0);
    expect(moveHue(hsv, "End")?.h).toBe(360);
    expect(moveHue(hsv, "Enter")).toBeNull();
  });

  test("value texts", () => {
    expect(areaText({ h: 0, s: 0.456, v: 0.8 })).toEqual({ s: 46, v: 80 });
  });
});
