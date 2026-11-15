import { describe, expect, test } from "bun:test";
import { insertLink, type TextState, toggleCode, toggleLinePrefix, wrapSelection } from "./logic";

/** Writes a state as text with [ and ] around the selection, or | at the caret. */
const show = ({ value, start, end }: TextState): string =>
  start === end
    ? `${value.slice(0, start)}|${value.slice(start)}`
    : `${value.slice(0, start)}[${value.slice(start, end)}]${value.slice(end)}`;
/** Reads that notation back. */
const at = (text: string): TextState => {
  const caret = text.indexOf("|");
  if (caret >= 0) return { value: text.replace("|", ""), start: caret, end: caret };
  const start = text.indexOf("[");
  const end = text.indexOf("]") - 1;
  return { value: text.replace("[", "").replace("]", ""), start, end };
};

describe("wrapSelection", () => {
  test("wraps the selection and keeps it on the text", () => {
    expect(show(wrapSelection(at("a [word] b"), "**", "**", "bold"))).toBe("a **[word]** b");
  });
  test("inserts and selects the placeholder at a caret", () => {
    expect(show(wrapSelection(at("a | b"), "_", "_", "text"))).toBe("a _[text]_ b");
  });
  test("unwraps a wrapped selection", () => {
    expect(show(wrapSelection(at("a **[word]** b"), "**", "**", "bold"))).toBe("a [word] b");
  });
});

describe("toggleCode", () => {
  test("one line: inline code", () => {
    expect(show(toggleCode(at("run [ls] now"), "code"))).toBe("run `[ls]` now");
  });
  test("several lines: a fenced block", () => {
    expect(show(toggleCode(at("[a\nb]"), "code"))).toBe("```\n[a\nb]\n```");
  });
});

describe("toggleLinePrefix", () => {
  test("prefixes every touched line and selects them", () => {
    expect(show(toggleLinePrefix(at("x\no[ne\ntw]o\ny"), "- "))).toBe("x\n[- one\n- two]\ny");
  });
  test("removes the prefix when every line has it", () => {
    expect(show(toggleLinePrefix(at("[- one\n- two]"), "- "))).toBe("[one\ntwo]");
  });
  test("numbers the lines of an ordered list and removes the numbers", () => {
    expect(show(toggleLinePrefix(at("[one\ntwo]"), "ordered"))).toBe("[1. one\n2. two]");
    expect(show(toggleLinePrefix(at("[1. one\n2. two]"), "ordered"))).toBe("[one\ntwo]");
  });
  test("a caret moves with its text", () => {
    expect(show(toggleLinePrefix(at("tit|le"), "## "))).toBe("## tit|le");
    expect(show(toggleLinePrefix(at("## tit|le"), "## "))).toBe("tit|le");
    expect(show(toggleLinePrefix(at("> |x"), "> "))).toBe("|x");
  });
  test("a selection that ends at a line break leaves the next line alone", () => {
    expect(show(toggleLinePrefix(at("[a\n]b"), "> "))).toBe("[> a]\nb");
  });
  test("an empty text", () => {
    expect(show(toggleLinePrefix(at("|"), "- "))).toBe("- |");
  });
});

describe("insertLink", () => {
  test("a selection becomes the link text and the address is selected", () => {
    const next = insertLink({ value: "see docs here", start: 4, end: 8 }, "text", "https://");
    expect(next.value).toBe("see [docs](https://) here");
    expect(next.value.slice(next.start, next.end)).toBe("https://");
  });
  test("at a caret, the link text is selected", () => {
    const next = insertLink({ value: "see  here", start: 4, end: 4 }, "text", "https://");
    expect(next.value).toBe("see [text](https://) here");
    expect(next.value.slice(next.start, next.end)).toBe("text");
  });
});
