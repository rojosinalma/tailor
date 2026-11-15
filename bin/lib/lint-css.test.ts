import { describe, expect, test } from "bun:test";
import { type CssKind, lintCss, lintCssText } from "./lint-css";

/** Lints one declaration inside a rule; line 2 is the declaration. */
const decl = (d: string, kind: CssKind = "pack") => lintCssText("t.css", `.t-x {\n  ${d};\n}\n`, kind);
const ids = (problems: { rule: string; line: number }[]) => problems.map((p) => [p.rule, p.line]);

describe("color-literal", () => {
  test.each([
    "color: var(--t-text)",
    "background: transparent",
    "fill: currentColor",
    "fill: CURRENTCOLOR",
    "color: inherit",
    "--t-x-tone: var(--t-hue-red)",
    "background: color-mix(in srgb, var(--t-surface), var(--t-text) 8%)",
    "background: color-mix(in oklch, var(--t-accent) 20%, transparent)",
    'background: url("red.svg")',
    "background: url(white.png)",
    'content: "black"',
    "font-family: var(--t-font-sans)",
  ])("passes: %s", (d) => expect(ids(decl(d))).toEqual([]));

  test.each([
    "color: #fff",
    "color: #A0B1C2",
    "color: rgb(0 0 0)",
    "color: rgba(0, 0, 0, 0.5)",
    "color: hsl(0 0% 0%)",
    "color: oklch(0.5 0.1 120)",
    "color: color(srgb 1 0 0)",
    "color: white",
    "border-color: Black",
    "background: color-mix(in srgb, #fff 8%, transparent)",
    "background: color-mix(in srgb, var(--t-text), red)",
  ])("fails: %s", (d) => expect(ids(decl(d))).toEqual([["color-literal", 2]]));

  test("reports the line inside a multi-line value", () => {
    const css =
      ".t-x {\n  box-shadow:\n    0 0 0 var(--t-border-w) var(--t-border),\n    0 0 0 var(--t-focus-w) #000;\n}\n";
    expect(ids(lintCssText("t.css", css, "pack"))).toEqual([["color-literal", 4]]);
  });
});

describe("absolute-length", () => {
  test.each([
    "width: calc(100vw - var(--t-space-6))",
    "box-shadow: 0 0 0 100vmax var(--t-backdrop)",
    "width: 50%",
    "max-width: 70ch",
    "vertical-align: -0.125em",
    "min-height: 100dvh",
    "rotate: 45deg",
    "rotate: 0.5turn",
    "grid-template-columns: 1fr 2fr",
    "margin: 0",
    "line-height: 1.5",
    "min-width: max(var(--anchor-width, 0px), var(--t-measure-2xs))",
    "padding-top: var(--t-safe-top)",
    "gap: var(--t-space-2)",
  ])("passes: %s", (d) => expect(ids(decl(d))).toEqual([]));

  test.each([
    "width: min(24rem, 100%)",
    "width: 10px",
    "font-size: 12pt",
    "margin: 1rlh",
    "width: 1in",
    "width: 2Q",
    "width: var(--t-measure-sm, 20rem)",
    "--t-x-gap: 4px",
  ])("fails: %s", (d) => expect(ids(decl(d))).toEqual([["absolute-length", 2]]));
});

describe("raw-duration", () => {
  test.each([
    "transition: opacity var(--t-motion-fast) var(--t-ease)",
    "transition-delay: 0s",
    "animation-duration: 0ms",
  ])("passes: %s", (d) => expect(ids(decl(d))).toEqual([]));

  test.each(["transition: opacity 120ms", "animation: t-spin 1s linear infinite", "transition-delay: .2s"])(
    "fails: %s",
    (d) => expect(ids(decl(d))).toEqual([["raw-duration", 2]]),
  );
});

describe("breakpoint", () => {
  test.each([
    "@media (max-width: 40rem)",
    "@media (min-width: 64rem)",
    "@media (hover: hover)",
    "@media (pointer: coarse)",
    "@media (prefers-reduced-motion: reduce)",
    "@media (prefers-color-scheme: dark)",
    "@container (min-width: 40rem)",
  ])("passes: %s", (q) =>
    expect(ids(lintCssText("t.css", `${q} {\n  .t-x { color: var(--t-text); }\n}\n`, "pack"))).toEqual([]),
  );

  test.each(["@media (max-width: 48rem)", "@media (min-width: 640px)", "@container t-card (width > 30em)"])(
    "fails: %s",
    (q) =>
      expect(
        ids(
          lintCssText(
            "t.css",
            `.t-a { color: var(--t-text); }\n${q} {\n  .t-x { color: var(--t-text); }\n}\n`,
            "pack",
          ),
        ),
      ).toEqual([["breakpoint", 2]]),
  );
});

describe("layer", () => {
  test("passes in a base file", () => {
    expect(
      ids(lintCssText("t.css", "@layer t.components {\n  .t-x { color: var(--t-text); }\n}\n", "base")),
    ).toEqual([]);
  });
  test("fails in a pack file", () => {
    expect(
      ids(lintCssText("t.css", "\n@layer t.components {\n  .t-x { color: var(--t-text); }\n}\n", "pack")),
    ).toEqual([["layer", 2]]);
  });
});

describe("important", () => {
  test("passes in a base file", () => expect(ids(decl("display: none !important", "base"))).toEqual([]));
  test("fails in a pack file", () =>
    expect(ids(decl("display: none !important"))).toEqual([["important", 2]]));
});

describe("class-prefix", () => {
  test.each<[string, CssKind]>([
    ['.t-btn:hover:not(.t-x, [data-class=".foo"])', "pack"],
    ["dialog.t-dialog[open] > .t-dialog-body", "base"],
    [".sc-page .t-btn", "showcase"],
  ])("passes: %s (%s)", (sel, kind) =>
    expect(ids(lintCssText("t.css", `\n${sel} {\n  color: var(--t-text);\n}\n`, kind))).toEqual([]),
  );

  test.each<[string, CssKind]>([
    [".btn", "pack"],
    [".t-btn > .icon", "base"],
    [".page", "showcase"],
    [".sc-page,\n.t-x:is(.demo)", "showcase"],
  ])("fails: %s (%s)", (sel, kind) => {
    const line = 2 + (sel.match(/\n/g)?.length ?? 0);
    expect(ids(lintCssText("t.css", `\n${sel} {\n  color: var(--t-text);\n}\n`, kind))).toEqual([
      ["class-prefix", line],
    ]);
  });

  test("ignores keyframe selectors", () => {
    const css = "@keyframes t-spin {\n  from { rotate: 0deg; }\n  to { rotate: 1turn; }\n}\n";
    expect(ids(lintCssText("t.css", css, "pack"))).toEqual([]);
  });
});

describe("unknown-token", () => {
  test.each([
    "color: var(--t-text)",
    "min-width: var(--anchor-width)",
    "max-height: var(--available-height, 60dvh)",
    "transform-origin: var(--transform-origin, top)",
  ])("passes: %s", (d) => expect(ids(decl(d))).toEqual([]));

  test("passes for a local component property", () => {
    const css = ".t-x {\n  --t-x-gap: var(--t-space-2);\n}\n.t-x > * {\n  gap: var(--t-x-gap);\n}\n";
    expect(ids(lintCssText("t.css", css, "pack"))).toEqual([]);
  });

  test("fails for a name that tokens.css does not define", () => {
    expect(ids(decl("color: var(--t-txet)"))).toEqual([["unknown-token", 2]]);
  });
});

describe("id-selector", () => {
  test("passes in a showcase file", () => {
    expect(ids(lintCssText("t.css", "#root {\n  color: var(--t-text);\n}\n", "showcase"))).toEqual([]);
  });
  test.each<CssKind>(["pack", "base"])("fails in a %s file", (kind) => {
    expect(ids(lintCssText("t.css", "\n.t-x #main {\n  color: var(--t-text);\n}\n", kind))).toEqual([
      ["id-selector", 2],
    ]);
  });
});

describe("lint-allow", () => {
  test("allows the next declaration for every rule", () => {
    const css =
      ".t-x {\n  /* lint-allow: a phone zooms in below 16px */\n  font-size: max(1rem, #fff, 1s) !important;\n}\n";
    expect(ids(lintCssText("t.css", css, "pack"))).toEqual([]);
  });

  test("allows only the declaration directly after it", () => {
    const css = ".t-x {\n  /* lint-allow: reason */\n  width: 1px;\n  height: 1px;\n}\n";
    expect(ids(lintCssText("t.css", css, "pack"))).toEqual([["absolute-length", 4]]);
  });

  test("an empty reason fails and allows nothing", () => {
    const css = ".t-x {\n  /* lint-allow: */\n  width: 1px;\n}\n";
    expect(ids(lintCssText("t.css", css, "pack"))).toEqual([
      ["lint-allow", 2],
      ["absolute-length", 3],
    ]);
  });
});

test("the real tree lints well under one second", async () => {
  const start = performance.now();
  await lintCss();
  expect(performance.now() - start).toBeLessThan(1000);
});
