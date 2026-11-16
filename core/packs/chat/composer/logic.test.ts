import { describe, expect, test } from "bun:test";
import { accepts, canSend, sendsOnKey, showsCount } from "./logic";

const key = (over: Partial<Parameters<typeof sendsOnKey>[0]> = {}) => ({
  key: "Enter",
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  isComposing: false,
  coarse: false,
  ...over,
});

describe("sendsOnKey", () => {
  test("Enter sends", () => expect(sendsOnKey(key())).toBe(true));
  test("Shift+Enter makes a new line", () => expect(sendsOnKey(key({ shiftKey: true }))).toBe(false));
  test("Enter during composition never sends", () =>
    expect(sendsOnKey(key({ isComposing: true }))).toBe(false));
  test("on a touch screen Enter makes a new line", () =>
    expect(sendsOnKey(key({ coarse: true }))).toBe(false));
  test("on a touch screen with a keyboard, Ctrl+Enter sends", () =>
    expect(sendsOnKey(key({ coarse: true, ctrlKey: true }))).toBe(true));
  test("other keys do nothing", () => expect(sendsOnKey(key({ key: "a" }))).toBe(false));
});

test("canSend: not empty, or with files", () => {
  expect(canSend("", 0)).toBe(false);
  expect(canSend("  \n ", 0)).toBe(false);
  expect(canSend("hi", 0)).toBe(true);
  expect(canSend("", 1)).toBe(true);
});

describe("accepts", () => {
  const png = { name: "Shot.PNG", type: "image/png" };
  const log = { name: "web-1.log", type: "text/plain" };
  test("no list accepts all", () => expect(accepts(png)).toBe(true));
  test("extensions, wildcards and exact types", () => {
    expect(accepts(png, ".png")).toBe(true);
    expect(accepts(png, "image/*")).toBe(true);
    expect(accepts(log, "image/*, .pdf")).toBe(false);
    expect(accepts(log, "text/plain")).toBe(true);
  });
});

test("showsCount: from 80% of the limit", () => {
  expect(showsCount(10)).toBe(false);
  expect(showsCount(79, 100)).toBe(false);
  expect(showsCount(80, 100)).toBe(true);
});
