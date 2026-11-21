import { expect, test } from "bun:test";
import { cssProblems, markupProblems, parseBrief, prompt } from "./agent";

test("a brief gives its kit, the parts to open and the text for the agent", () => {
  const brief = parseBrief("add-device", "<!-- kit: html; open: Add device, Edit -->\n\nA page.\n");
  expect(brief).toEqual({ id: "add-device", kit: "html", open: ["Add device", "Edit"], text: "A page." });
  expect(() => parseBrief("x", "<!-- kit: vue -->\ntext")).toThrow("kit must be html or react");
  expect(prompt(brief)).toContain("read public/tailor/REFERENCE.md first");
  expect(prompt(parseBrief("y", "<!-- kit: react -->\nA page."))).toContain("vendor/tailor/REFERENCE.md");
});

test("a stylesheet of the project with its own colours, sizes and tailor rules is found", () => {
  const rules = cssProblems(
    "app.css",
    ".box { color: #ff0000; margin: 12px; padding: 1rem; border-width: 2px; --x: 3px }\n.t-card { gap: 0 }",
  ).map((p) => `${p.rule} ${p.where}`);
  expect(rules).toEqual([
    "own-colour app.css:1",
    "own-size app.css:1",
    "own-size app.css:1",
    "tailor-class app.css:2",
  ]);
  expect(cssProblems("ok.css", ".preview { display: none; color: var(--t-muted) }")).toEqual([]);
});

test("style blocks, style attributes and React style objects are read", () => {
  const html = `<div>\n<style>.a { margin-top: 8px }</style>\n<p style="color: rgb(1, 2, 3)">x</p><a href="#main">skip</a></div>`;
  expect(markupProblems("index.html", html).map((p) => `${p.rule} ${p.where}`)).toEqual([
    "own-size index.html:2",
    "own-colour index.html:3",
  ]);
  const tsx = `export const A = () => <div style={{ width: 320, display: "flex" }} />;\nconst B = () => <div style={{ display: "none" }} />;`;
  expect(markupProblems("app.tsx", tsx).map((p) => p.rule)).toEqual(["own-size"]);
});
