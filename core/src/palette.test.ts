import { expect, test } from "bun:test";
import { Glob } from "bun";
import { contrast, type PaletteSpec, paletteContrastProblems, paletteCss } from "./palette";

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
