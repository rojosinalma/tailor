import { describe, expect, test } from "bun:test";
import { choose, shownItems, type TreeItem, treeKey, typeAhead } from "./logic";

const tree: TreeItem[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/app.ts", label: "app.ts" },
      { id: "src/lib", label: "lib", children: [{ id: "src/lib/api.ts", label: "api.ts" }] },
    ],
  },
  { id: "docs", label: "docs", hasChildren: true },
  { id: "readme", label: "README.md" },
];

const ids = (open: string[]) => shownItems(tree, new Set(open)).map((s) => s.item.id);

describe("shownItems", () => {
  test("closed branches hide their children", () => {
    expect(ids([])).toEqual(["src", "docs", "readme"]);
    expect(ids(["src"])).toEqual(["src", "src/app.ts", "src/lib", "docs", "readme"]);
    expect(ids(["src/lib"])).toEqual(["src", "docs", "readme"]);
  });

  test("levels, places and parents", () => {
    const shown = shownItems(tree, new Set(["src", "src/lib"]));
    const api = shown.find((s) => s.item.id === "src/lib/api.ts");
    expect(api).toMatchObject({ level: 3, position: 1, siblings: 1, parent: "src/lib", branch: false });
    expect(shown.find((s) => s.item.id === "docs")?.branch).toBe(true);
  });
});

describe("treeKey", () => {
  const open = new Set(["src"]);
  const shown = shownItems(tree, open);

  test("up and down walk the shown items; Home and End go to the ends", () => {
    expect(treeKey("ArrowDown", "src", shown, open)).toEqual({ type: "focus", id: "src/app.ts" });
    expect(treeKey("ArrowUp", "src/app.ts", shown, open)).toEqual({ type: "focus", id: "src" });
    expect(treeKey("ArrowUp", "src", shown, open)).toBeNull();
    expect(treeKey("End", "src", shown, open)).toEqual({ type: "focus", id: "readme" });
    expect(treeKey("Home", "readme", shown, open)).toEqual({ type: "focus", id: "src" });
  });

  test("right opens a closed branch, then goes to its first child; on a leaf it does nothing", () => {
    expect(treeKey("ArrowRight", "src/lib", shown, open)).toEqual({ type: "open", id: "src/lib" });
    expect(treeKey("ArrowRight", "src", shown, open)).toEqual({ type: "focus", id: "src/app.ts" });
    expect(treeKey("ArrowRight", "readme", shown, open)).toBeNull();
  });

  test("left closes an open branch, else goes to the parent", () => {
    expect(treeKey("ArrowLeft", "src", shown, open)).toEqual({ type: "close", id: "src" });
    expect(treeKey("ArrowLeft", "src/lib", shown, open)).toEqual({ type: "focus", id: "src" });
    expect(treeKey("ArrowLeft", "readme", shown, open)).toBeNull();
  });
});

describe("typeAhead", () => {
  const shown = shownItems(tree, new Set(["src"]));
  test("finds the next label that starts with the text, round to the start", () => {
    expect(typeAhead(shown, "src", "a")).toBe("src/app.ts");
    expect(typeAhead(shown, "readme", "s")).toBe("src");
    expect(typeAhead(shown, "src", "re")).toBe("readme");
    expect(typeAhead(shown, "src", "x")).toBeNull();
  });
});

describe("choose", () => {
  test("one item, or with multiple a toggle", () => {
    expect(choose(["a"], "b", false)).toEqual(["b"]);
    expect(choose(["a"], "b", true)).toEqual(["a", "b"]);
    expect(choose(["a", "b"], "a", true)).toEqual(["b"]);
  });
});
