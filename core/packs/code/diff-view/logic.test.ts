import { describe, expect, test } from "bun:test";
import { diffPatch, diffTexts, splitRows } from "./logic";

const before = "port=80\nhost=web-1\nworkers=2\nlog=info\n";
const after = "port=8080\nhost=web-1\nworkers=4\nlog=info\ntz=UTC\n";

describe("diffTexts", () => {
  test("numbers the lines and counts the changes", () => {
    const model = diffTexts(before, after, 3);
    expect(model.added).toBe(3);
    expect(model.removed).toBe(2);
    expect(model.hunks).toHaveLength(1);
    const lines = model.hunks[0]?.lines ?? [];
    expect(lines[0]).toEqual({ change: "remove", text: "port=80", old: 1 });
    expect(lines[1]).toEqual({ change: "add", text: "port=8080", new: 1 });
    expect(lines[2]).toEqual({ change: "context", text: "host=web-1", old: 2, new: 2 });
    expect(lines.at(-1)).toEqual({ change: "add", text: "tz=UTC", new: 5 });
  });
  test("context limits the lines around a change", () => {
    const long = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`);
    const changed = long.map((l, i) => (i === 10 ? "changed" : l));
    const model = diffTexts(long.join("\n"), changed.join("\n"), 1);
    expect(model.hunks[0]?.lines.map((l) => l.change)).toEqual(["context", "remove", "add", "context"]);
    expect(model.hunks[0]?.header).toBe("@@ -10,3 +10,3 @@");
  });
  test("equal texts give no hunks", () => {
    expect(diffTexts("a\n", "a\n", 3).hunks).toEqual([]);
  });
});

describe("diffPatch", () => {
  const patch = `--- a/app.ini
+++ b/app.ini
@@ -1,2 +1,2 @@
-port=80
+port=8080
 host=web-1
\\ No newline at end of file
--- a/b.ini
+++ b/b.ini
@@ -3 +3 @@
-x
+y
`;
  test("parses every file and names them", () => {
    const model = diffPatch(patch);
    expect(model.hunks.map((h) => h.file)).toEqual(["app.ini", "b.ini"]);
    expect(model.hunks[0]?.lines).toHaveLength(3);
    expect(model.hunks[1]?.lines[0]).toEqual({ change: "remove", text: "x", old: 3 });
    expect(model.added).toBe(2);
  });
});

describe("splitRows", () => {
  test("pairs removed with added lines and keeps the rest alone", () => {
    const lines = diffTexts("a\nb\nc\n", "a\nB\nC\nD\n", 3).hunks[0]?.lines ?? [];
    const rows = splitRows(lines);
    expect(rows.map((r) => [r.left?.text, r.right?.text])).toEqual([
      ["a", "a"],
      ["b", "B"],
      ["c", "C"],
      [undefined, "D"],
    ]);
  });
});
