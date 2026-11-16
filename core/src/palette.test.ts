import { expect, test } from "bun:test";
import { Glob } from "bun";
import {
  contrast,
  mix,
  type PaletteSpec,
  paletteColors,
  paletteContrastProblems,
  paletteCss,
  readable,
  tokenPairs,
} from "./palette";

const files = (await Array.fromAsync(new Glob("*.json").scan(`${import.meta.dir}/../palettes/src`))).filter(
  (f) => f !== "palette.schema.json",
);

test("there are 21 palettes, each with a dark and a light mode", async () => {
  expect(files.length).toBe(21);
  for (const file of files) {
    const palette = (await Bun.file(`${import.meta.dir}/../palettes/src/${file}`).json()) as PaletteSpec;
    expect(palette.light, `${palette.id} has no light mode`).toBeDefined();
    expect(palette.name).not.toMatch(/[()[\]]/);
  }
});

test("every palette keeps its text readable in both modes", async () => {
  const problems: string[] = [];
  for (const file of files) {
    problems.push(
      ...paletteContrastProblems(
        (await Bun.file(`${import.meta.dir}/../palettes/src/${file}`).json()) as PaletteSpec,
      ),
    );
  }
  expect(problems).toEqual([]);
});

test("contrast follows the WCAG formula", () => {
  expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
});

test("the stylesheet of a palette scopes both modes to the palette", async () => {
  const palette = (await Bun.file(`${import.meta.dir}/../palettes/src/gruvbox.json`).json()) as PaletteSpec;
  const css = paletteCss(palette);
  expect(css).toContain('[data-palette="gruvbox"] {');
  expect(css).toContain('[data-palette="gruvbox"][data-mode="light"] {');
  expect(css).toContain("--t-canvas: #282828;");
});

test("the guarded tokens stay readable on every surface, in every palette and mode", async () => {
  const problems: string[] = [];
  for (const file of files) {
    const palette = (await Bun.file(`${import.meta.dir}/../palettes/src/${file}`).json()) as PaletteSpec;
    for (const mode of ["dark", "light"] as const) {
      const tokens = Object.fromEntries(tokenPairs(paletteColors(palette, mode), mode));
      const get = (name: string): string => tokens[`--t-${name}`] ?? "";
      const check = (fg: string, bg: string, min: number): void => {
        const ratio = contrast(get(fg), get(bg));
        if (ratio < min)
          problems.push(`${palette.id} ${mode}: ${fg} on ${bg} is ${ratio.toFixed(2)}, below ${min}`);
      };
      for (const surface of ["canvas", "surface", "inset"]) {
        for (const text of [
          "text",
          "muted",
          "link",
          "accent-text",
          "success-text",
          "warning-text",
          "danger-text",
          "info-text",
        ]) {
          check(text, surface, 4.5);
        }
        for (const hue of ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink"]) {
          if (get(`hue-${hue}-text`)) check(`hue-${hue}-text`, surface, 4.5);
        }
        check("border-control", surface, 3);
        check("focus", surface, 3);
      }
      check("text", "selection", 4.5);
      // Text in a tone colour on the tint (20%) of that tone, over every surface. Neutral is muted on muted.
      for (const [text, tone] of [
        ["muted", "muted"],
        ["accent-text", "accent-solid"],
        ...["accent", "success", "warning", "danger", "info"].map((t) => [`${t}-text`, t]),
      ]) {
        for (const surface of ["canvas", "surface", "inset"]) {
          const ratio = contrast(get(text as string), mix(get(surface), get(tone as string), 0.2));
          if (ratio < 4.5)
            problems.push(
              `${palette.id} ${mode}: ${text} on a ${tone} tint of ${surface} is ${ratio.toFixed(2)}`,
            );
        }
      }
      // Normal text on the weak tint (5%) of every tone, over the canvas and the raised surface.
      for (const tone of ["accent", "success", "warning", "danger", "info"]) {
        for (const surface of ["canvas", "surface"]) {
          const ratio = contrast(get("text"), mix(get(surface), get(tone), 0.05));
          if (ratio < 4.5)
            problems.push(
              `${palette.id} ${mode}: text on a weak ${tone} tint of ${surface} is ${ratio.toFixed(2)}`,
            );
        }
      }
      check("on-accent", "accent-solid", 4.5);
      for (const tone of ["success", "warning", "danger", "info"]) check(`on-${tone}`, tone, 4.5);
    }
  }
  expect(problems).toEqual([]);
});

test("a readable colour keeps its value when it already passes", () => {
  expect(readable("#ffffff", ["#000000"], "lighter")).toBe("#ffffff");
  expect(contrast(readable("#777777", ["#888888"], "darker"), "#888888")).toBeGreaterThanOrEqual(4.5);
  const red = readable("#cc3333", ["#402020"], "lighter");
  expect(contrast(red, "#402020")).toBeGreaterThanOrEqual(4.5);
});
