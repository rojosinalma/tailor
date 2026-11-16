import { describe, expect, test } from "bun:test";
import { detectLevel, levelOf, markMatches, matchesQuery, parseAnsi, stripAnsi } from "./logic";

const E = "\x1b";

describe("levels", () => {
  test("words name levels", () => {
    expect(levelOf("ERROR")).toBe("error");
    expect(levelOf("Warning")).toBe("warn");
    expect(levelOf("trace")).toBe("debug");
    expect(levelOf("note")).toBeUndefined();
  });

  test("a line names its level near the start, also inside colour codes", () => {
    expect(detectLevel("2026-11-15 10:00:01 ERROR disk full")).toBe("error");
    expect(detectLevel("[warn] slow answer")).toBe("warn");
    expect(detectLevel(`${E}[33mWARN${E}[0m cache miss`)).toBe("warn");
    expect(detectLevel("level=debug msg=tick")).toBe("debug");
    expect(detectLevel("errors are counted")).toBeUndefined();
  });
});

describe("parseAnsi", () => {
  test("plain text is one run", () => {
    expect(parseAnsi("hello")).toEqual([{ text: "hello" }]);
  });

  test("colours, bold, dim and reset", () => {
    expect(parseAnsi(`a ${E}[31mred${E}[0m ${E}[1;32mbold green${E}[22m green ${E}[2mdim${E}[m end`)).toEqual(
      [
        { text: "a " },
        { text: "red", fg: "red" },
        { text: " " },
        { text: "bold green", fg: "green", bold: true },
        { text: " green ", fg: "green" },
        { text: "dim", fg: "green", dim: true },
        { text: " end" },
      ],
    );
  });

  test("bright colours, black and white, and the default colour", () => {
    expect(parseAnsi(`${E}[95mp${E}[30mk${E}[37mw${E}[34mb${E}[39mx`)).toEqual([
      { text: "p", fg: "pink" },
      { text: "k", fg: "muted" },
      { text: "w" },
      { text: "b", fg: "blue" },
      { text: "x" },
    ]);
  });

  test("256 colours, backgrounds, cursor moves and titles go", () => {
    expect(parseAnsi(`${E}[38;5;196mx${E}[48;2;1;2;3m${E}[2Ky${E}]0;title\x07z${E}[41mq`)).toEqual([
      { text: "xyzq" },
    ]);
    expect(stripAnsi(`${E}[1;31mfailed${E}[0m in ${E}[36m2s${E}[0m`)).toBe("failed in 2s");
  });
});

describe("filter", () => {
  test("matches in any case; an empty query matches", () => {
    expect(matchesQuery("Disk Full", "disk")).toBe(true);
    expect(matchesQuery("Disk Full", "cpu")).toBe(false);
    expect(matchesQuery("anything", "")).toBe(true);
  });

  test("marks the matches, also across runs", () => {
    const runs = parseAnsi(`time${E}[31mout${E}[0m, timeout`);
    expect(markMatches(runs, "TIMEOUT")).toEqual([
      { text: "time", mark: true },
      { text: "out", fg: "red", mark: true },
      { text: ", " },
      { text: "timeout", mark: true },
    ]);
    expect(markMatches(runs, "zzz")).toEqual(runs);
  });
});
