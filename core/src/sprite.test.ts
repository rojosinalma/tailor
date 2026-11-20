import { describe, expect, test } from "bun:test";
import { findIconNames } from "./sprite";

describe("icon names in a source text", () => {
  test("finds the set:name form", () => {
    expect(findIconNames('<Icon name="bi:house" /> {{ icon("simple-icons:github") }}')).toEqual([
      "bi:house",
      "simple-icons:github",
    ]);
  });

  test("finds the sprite address that HTML markup writes", () => {
    const html = [
      '<svg class="t-icon"><use href="/tailor/icons.svg#bi-x-lg"></use></svg>',
      "<use xlink:href='icons.svg#simple-icons-github'/>",
      "background: url(/static/tailor/icons.svg#bi-arrow-right);",
    ].join("\n");
    expect(findIconNames(html).sort()).toEqual(["bi:arrow-right", "bi:x-lg", "simple-icons:github"]);
  });

  test("each name once, whatever the form", () => {
    expect(findIconNames('bi:house <use href="/tailor/icons.svg#bi-house"/>')).toEqual(["bi:house"]);
  });

  test("an address that is not the sprite is not an icon", () => {
    expect(
      findIconNames('<a href="#bi-weekly">Plans</a> <a href="page.html#simple-icons-note">x</a>'),
    ).toEqual([]);
  });
});
