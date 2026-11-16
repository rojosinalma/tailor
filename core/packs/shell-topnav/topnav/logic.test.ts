import { expect, test } from "bun:test";
import { fit } from "./logic";

const widths = [100, 100, 100, 100, 100];

test("every link shows when all fit, without More", () => {
  expect(fit(widths, 500, 80, -1)).toEqual([0, 1, 2, 3, 4]);
});

test("the links that do not fit go into More, last ones first", () => {
  expect(fit(widths, 420, 80, -1)).toEqual([0, 1, 2]);
  expect(fit(widths, 499, 80, -1)).toEqual([0, 1, 2, 3]);
});

test("the current link takes the place of the last visible one", () => {
  expect(fit(widths, 420, 80, 4)).toEqual([0, 1, 4]);
  expect(fit(widths, 420, 80, 1)).toEqual([0, 1, 2]);
});

test("a wide current link takes the place of several", () => {
  expect(fit([100, 100, 100, 250], 420, 80, 3)).toEqual([3]);
});

test("nothing fits: only More", () => {
  expect(fit(widths, 60, 80, -1)).toEqual([]);
  expect(fit(widths, 60, 80, 2)).toEqual([]);
});
