import { describe, expect, test } from "bun:test";
import { DEFAULT_CONTROLS, parseConfig } from "./logic";

const tiles = { url: "data:image/svg+xml,x", attribution: "Sample" };

describe("parseConfig", () => {
  test("fills in the defaults", () => {
    const config = parseConfig({ tiles, center: [48.85, 2.29], zoom: 4 });
    expect(config.controls).toEqual(DEFAULT_CONTROLS);
    expect(config.fit).toBe(false);
    expect(config.markers).toEqual([]);
    expect(config.paths).toEqual([]);
    expect(config.tiles.maxZoom).toBeUndefined();
  });

  test("keeps markers, paths and an empty control list", () => {
    const config = parseConfig({
      tiles: { ...tiles, maxZoom: 6 },
      fit: true,
      controls: [],
      markers: [{ id: "web-1", lat: 48.85, lng: 2.29, label: "web-1", tone: "success", text: "Up" }],
      paths: [
        {
          id: "link",
          points: [
            [48.85, 2.29],
            [52.5, 13.4],
          ],
          tone: "info",
        },
      ],
    });
    expect(config.controls).toEqual([]);
    expect(config.markers[0]).toMatchObject({ id: "web-1", lat: 48.85, tone: "success", text: "Up" });
    expect(config.paths[0]?.points).toEqual([
      [48.85, 2.29],
      [52.5, 13.4],
    ]);
    expect(config.tiles.maxZoom).toBe(6);
  });

  test("needs a view: center and zoom, or fit", () => {
    expect(() => parseConfig({ tiles })).toThrow("center and zoom");
    expect(() => parseConfig({ tiles, center: [0, 0] })).toThrow("center and zoom");
    expect(parseConfig({ tiles, fit: true }).fit).toBe(true);
  });

  test("rejects wrong values", () => {
    const view = { center: [0, 0], zoom: 2 };
    expect(() => parseConfig(null)).toThrow("object");
    expect(() => parseConfig({ ...view })).toThrow("tiles");
    expect(() => parseConfig({ ...view, tiles: { url: "x" } })).toThrow("attribution");
    expect(() => parseConfig({ ...view, tiles, center: [95, 0] })).toThrow("degrees");
    expect(() => parseConfig({ ...view, tiles, controls: ["pan"] })).toThrow('unknown control "pan"');
    expect(() => parseConfig({ ...view, tiles, markers: [{ id: "a", lat: 0, lng: 0 }] })).toThrow("label");
    expect(() =>
      parseConfig({ ...view, tiles, markers: [{ id: "a", lat: 0, lng: 0, label: "a", tone: "pink" }] }),
    ).toThrow("tone");
    expect(() =>
      parseConfig({
        ...view,
        tiles,
        markers: [
          { id: "a", lat: 0, lng: 0, label: "a" },
          { id: "a", lat: 1, lng: 1, label: "b" },
        ],
      }),
    ).toThrow("used twice");
    expect(() => parseConfig({ ...view, tiles, paths: [{ id: "p", points: [[0, 0]] }] })).toThrow(
      "two points",
    );
  });
});
