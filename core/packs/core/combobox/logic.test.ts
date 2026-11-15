import { expect, test } from "bun:test";
import { customText, matches } from "./logic";

const choices = [
  { value: "web-1", label: "web-1" },
  { value: "nas", label: "NAS" },
];

test("a label matches text it contains, in any case", () => {
  expect(matches("NAS storage", "stor")).toBe(true);
  expect(matches("NAS storage", "nas")).toBe(true);
  expect(matches("web-1", "web-2")).toBe(false);
  expect(matches("web-1", "  ")).toBe(true);
});

test("custom text is typed text that names no choice", () => {
  expect(customText(" web-3 ", choices)).toBe("web-3");
  expect(customText("nas", choices)).toBeNull();
  expect(customText("web-1", choices)).toBeNull();
  expect(customText("   ", choices)).toBeNull();
});
