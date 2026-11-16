import { expect, test } from "bun:test";
import { themeChoices, themeSummary } from "./logic";

const config = {
  key: "demo",
  skins: ["round", "plain"],
  palettes: ["nord", "gruvbox", "dracula"],
  defaults: { skin: "plain", palette: "nord", mode: "auto" },
  labels: { nord: "Nord", gruvbox: "Gruvbox", dracula: "Dracula" },
} as const;

test("palettes are sorted by display name", () => {
  expect(themeChoices(config, "palette")).toEqual([
    { value: "dracula", label: "Dracula" },
    { value: "gruvbox", label: "Gruvbox" },
    { value: "nord", label: "Nord" },
  ]);
});

test("an id without a display name shows the id", () => {
  expect(themeChoices(config, "skin").map((c) => c.label)).toEqual(["plain", "round"]);
});

test("the summary names the shown parts in order, with display names", () => {
  const state = { skin: "plain", palette: "nord" };
  expect(themeSummary(config, state, ["skin", "palette"])).toEqual(["plain", "Nord"]);
  expect(themeSummary(config, state, ["palette"])).toEqual(["Nord"]);
  expect(themeSummary(config, { skin: "", palette: "nord" }, ["skin", "palette"])).toEqual(["Nord"]);
});
