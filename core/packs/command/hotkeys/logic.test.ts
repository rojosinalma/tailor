import { describe, expect, test } from "bun:test";
import { canonicalKeys, firesInFields, formatSteps, libraryChord, parseKeys } from "./logic";

describe("parseKeys", () => {
  test("a chord with modifiers", () => {
    expect(parseKeys("Mod+K")).toEqual([{ modifiers: ["Mod"], key: "K" }]);
    expect(parseKeys("Shift+?")).toEqual([{ modifiers: ["Shift"], key: "?" }]);
  });
  test("modifiers come in one order, letters in upper case", () => {
    expect(parseKeys("Shift+Mod+p")).toEqual([{ modifiers: ["Mod", "Shift"], key: "P" }]);
  });
  test("a sequence", () => {
    expect(parseKeys("G then S")).toEqual([
      { modifiers: [], key: "G" },
      { modifiers: [], key: "S" },
    ]);
  });
  test("single and named keys", () => {
    expect(parseKeys("/")).toEqual([{ modifiers: [], key: "/" }]);
    expect(parseKeys("Escape")).toEqual([{ modifiers: [], key: "Escape" }]);
    expect(parseKeys("Mod++")).toEqual([{ modifiers: ["Mod"], key: "+" }]);
  });
  test("a malformed text throws", () => {
    expect(() => parseKeys("")).toThrow();
    expect(() => parseKeys("Mod+")).toThrow();
    expect(() => parseKeys("Shift")).toThrow();
    expect(() => parseKeys("Hyper+K")).toThrow();
  });
});

describe("canonicalKeys", () => {
  test("the same keys written two ways are one shortcut", () => {
    expect(canonicalKeys("Shift+Mod+k")).toBe(canonicalKeys("Mod+Shift+K"));
    expect(canonicalKeys("g then s")).toBe("G S");
    expect(canonicalKeys("Mod+K")).not.toBe(canonicalKeys("Ctrl+K"));
  });
});

describe("formatSteps", () => {
  test("Apple devices show symbols", () => {
    expect(formatSteps("Mod+K", true)).toEqual([["⌘", "K"]]);
    expect(formatSteps("Mod+Shift+P", true)).toEqual([["⇧", "⌘", "P"]]);
  });
  test("other devices show names", () => {
    expect(formatSteps("Mod+K", false)).toEqual([["Ctrl", "K"]]);
    expect(formatSteps("Mod+Ctrl+K", false)).toEqual([["Ctrl", "K"]]);
    expect(formatSteps("Shift+?", false)).toEqual([["Shift", "?"]]);
  });
  test("named keys and sequences", () => {
    expect(formatSteps("Escape", false)).toEqual([["Esc"]]);
    expect(formatSteps("G then S", false)).toEqual([["G"], ["S"]]);
  });
});

describe("firesInFields", () => {
  test("only shortcuts with Mod, Ctrl or Meta", () => {
    expect(firesInFields(parseKeys("Mod+K"))).toBe(true);
    expect(firesInFields(parseKeys("Ctrl+S"))).toBe(true);
    expect(firesInFields(parseKeys("Shift+?"))).toBe(false);
    expect(firesInFields(parseKeys("/"))).toBe(false);
    expect(firesInFields(parseKeys("Escape"))).toBe(false);
  });
});

describe("libraryChord", () => {
  test("Ctrl becomes Control", () => {
    const [chord] = parseKeys("Ctrl+Shift+K");
    expect(chord && libraryChord(chord)).toBe("Control+Shift+K");
  });
});
