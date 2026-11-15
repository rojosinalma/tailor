import { describe, expect, test } from "bun:test";
import { addFiles, type FileLike, formatSize, matchesAccept, refusalText } from "./logic";

const file = (name: string, size = 1000, type = ""): FileLike => ({ name, size, type });

describe("sizes", () => {
  test("formats in steps of 1000", () => {
    expect(formatSize(0, "en-US")).toBe("0 B");
    expect(formatSize(980, "en-US")).toBe("980 B");
    expect(formatSize(1500, "en-US")).toBe("1.5 kB");
    expect(formatSize(2_000_000, "en-US")).toBe("2 MB");
    expect(formatSize(12_345_678, "en-US")).toBe("12 MB");
    expect(formatSize(3.2e12, "en-US")).toBe("3.2 TB");
  });
});

describe("accept", () => {
  test("matches extensions, types and groups", () => {
    expect(matchesAccept(file("Report.PDF"), ".pdf")).toBe(true);
    expect(matchesAccept(file("photo.png", 1, "image/png"), "image/*")).toBe(true);
    expect(matchesAccept(file("photo.png", 1, "image/png"), "image/jpeg, .gif")).toBe(false);
    expect(matchesAccept(file("notes.txt", 1, "text/plain"), "text/plain")).toBe(true);
    expect(matchesAccept(file("anything.bin"), "")).toBe(true);
    expect(matchesAccept(file("anything.bin"), null)).toBe(true);
  });
});

describe("adding files", () => {
  test("multiple files join the kept ones", () => {
    const { files, refused } = addFiles([file("a.txt")], [file("b.txt"), file("c.txt")], { multiple: true });
    expect(files.map((f) => f.name)).toEqual(["a.txt", "b.txt", "c.txt"]);
    expect(refused).toEqual([]);
  });

  test("a single file replaces the kept one", () => {
    expect(addFiles([file("a.txt")], [file("b.txt"), file("c.txt")], {}).files.map((f) => f.name)).toEqual([
      "b.txt",
    ]);
  });

  test("refuses files of the wrong type, too large or too many", () => {
    const { files, refused } = addFiles(
      [file("a.pdf")],
      [file("b.png"), file("c.pdf", 5000), file("d.pdf"), file("e.pdf")],
      { multiple: true, accept: ".pdf", maxSize: 2000, maxFiles: 2 },
    );
    expect(files.map((f) => f.name)).toEqual(["a.pdf", "d.pdf"]);
    expect(refused).toEqual([
      { reason: "type", name: "b.png" },
      { reason: "size", name: "c.pdf", limit: 2000 },
      { reason: "count", name: "e.pdf", limit: 2 },
    ]);
  });

  test("a refused single file keeps the kept one", () => {
    const { files, refused } = addFiles([file("a.pdf")], [file("big.pdf", 9000)], { maxSize: 2000 });
    expect(files.map((f) => f.name)).toEqual(["a.pdf"]);
    expect(refused).toHaveLength(1);
  });

  test("says why", () => {
    const texts = {
      type: "not an accepted type",
      size: "larger than",
      count: "too many files, the limit is",
    };
    expect(refusalText({ reason: "size", name: "big.iso", limit: 10_000_000 }, texts, "en-US")).toBe(
      "big.iso: larger than 10 MB",
    );
    expect(refusalText({ reason: "type", name: "x.exe" }, texts)).toBe("x.exe: not an accepted type");
    expect(refusalText({ reason: "count", name: "e.pdf", limit: 2 }, texts)).toBe(
      "e.pdf: too many files, the limit is 2",
    );
  });
});
