import { expect, test } from "bun:test";
import { deflateSync } from "node:zlib";
import { pixelHash, sameImage } from "./pages";

/** A small RGB PNG file from rows of pixels, with filter type 0 on every row. */
function png(
  width: number,
  height: number,
  pixel: (x: number, y: number) => [number, number, number],
): Uint8Array {
  const raw = new Uint8Array(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) raw.set(pixel(x, y), y * (width * 3 + 1) + 1 + x * 3);
  }
  const chunk = (type: string, body: Uint8Array): Uint8Array => {
    const out = new Uint8Array(12 + body.length);
    new DataView(out.buffer).setUint32(0, body.length);
    out.set(
      [...type].map((c) => c.charCodeAt(0)),
      4,
    );
    out.set(body, 8);
    return out;
  };
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 2, 0, 0, 0], 8);
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", new Uint8Array()),
  ];
  const file = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    file.set(part, offset);
    offset += part.length;
  }
  return file;
}

const grey = (): [number, number, number] => [120, 120, 120];

test("the pixel hash is the same for the same pixels and differs for other pixels", () => {
  expect(pixelHash(png(40, 40, grey))).toBe(pixelHash(png(40, 40, grey)));
  expect(pixelHash(png(40, 40, grey))).not.toBe(pixelHash(png(40, 40, () => [121, 120, 120])));
});

test("a few pixels of drawing noise count as the same image", () => {
  const base = png(100, 100, grey);
  expect(
    sameImage(
      base,
      png(100, 100, (x, y) => (y === 3 && x < 30 ? [122, 120, 120] : grey())),
    ),
  ).toBe(true);
  expect(
    sameImage(
      base,
      png(100, 100, (x, y) => (y === 3 && x < 20 ? [200, 120, 120] : grey())),
    ),
  ).toBe(true);
});

test("pixels one or two levels off do not count, however many", () => {
  const base = png(100, 100, grey);
  expect(
    sameImage(
      base,
      png(100, 100, (x, y) => (y < 5 ? [121, 122, 120] : grey())),
    ),
  ).toBe(true);
  expect(
    sameImage(
      base,
      png(100, 100, (_x, y) => (y < 2 ? [123, 120, 120] : grey())),
    ),
  ).toBe(false);
});

test("a real change is not the same image", () => {
  const base = png(100, 100, grey);
  // A border of one pixel that changed its colour, a line that moved, another size.
  expect(
    sameImage(
      base,
      png(100, 100, (_x, y) => (y === 3 ? [200, 120, 120] : grey())),
    ),
  ).toBe(false);
  expect(
    sameImage(
      base,
      png(100, 100, (x) => (x < 2 ? [123, 123, 123] : grey())),
    ),
  ).toBe(false);
  expect(sameImage(base, png(100, 101, grey))).toBe(false);
});
