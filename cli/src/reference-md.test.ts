import { describe, expect, test } from "bun:test";
import { packFile, type Reference, renderIndex, renderPack } from "./reference-md";

const component = (id: string, name: string, description: string, html: string | null) => ({
  id,
  name,
  group: "actions",
  description,
  import: `import { ${name} } from "tailor/core";`,
  root: `t-${id}`,
  parts: { [`t-${id}-label`]: "the text" },
  props: { size: ["sm", "md"], label: [] },
  html: html ? ("markup" as const) : ("none" as const),
  example: { title: "First", react: `<${name} />`, html },
});

const ref: Reference = {
  version: "2.0.0",
  packs: [
    {
      id: "core",
      name: "Core",
      description: "The base.",
      requires: [],
      libraries: { react: "19.0.0" },
      devLibraries: { "@types/react": "19.0.0" },
      html: "full",
      components: [
        component(
          "button",
          "Button",
          "Starts an action. A view has one primary button.",
          '<svg><path d="M0 0L9 9"/></svg>',
        ),
        component("dialog", "Dialog", "Asks for a decision.", null),
      ],
    },
    {
      id: "shell-top",
      name: "Top",
      description: "A bar.",
      requires: ["core"],
      libraries: {},
      html: "full",
      shell: true,
      components: [],
    },
    {
      id: "extra",
      name: "Extra",
      description: "More.",
      requires: ["core"],
      libraries: {},
      html: "none",
      components: [],
    },
  ],
};

describe("the reference", () => {
  test("the index: how to use, then one line per component with its pack file", () => {
    const index = renderIndex(ref);
    expect(index).toContain("## How to use");
    // The kinds of page come first, so an agent picks a layout, a shell and a mode before anything else.
    expect(index.indexOf("## Pick the page first")).toBeLessThan(index.indexOf("## How to use"));
    expect(index).toMatch(/\| A tool: inputs and a result[^|]*\| `tool-page` +\| `topnav`[^|]*\| `fill` +\|/);
    expect(index).toMatch(/\| A list of records +\| `list-page` +\|[^|]*\| `scroll` +\|/);
    expect(index).toContain("icons.svg#bi-house");
    expect(index).toContain("Pick one shell (`top`)");
    expect(index).toContain("- [Button](reference/core.md#button) (`button`, core): Starts an action.\n");
    expect(index).toContain("### Pack extra: Extra ([reference/extra.md](reference/extra.md))");
    expect(index).not.toContain("t-button-label");
    expect(renderIndex(ref, ["core"])).not.toContain("Pack extra");
  });

  test("a project's index says what it has and how to add a shell and the packs of a page", () => {
    const index = renderIndex(ref, ["core"]);
    expect(index).toContain("This project has the packs `core` and no shell yet.");
    expect(index).toContain("tailor add --shell <shell> --packs <pack>,<pack>");
    expect(index).toContain("Shells it can add: `top`.");
    expect(index).toMatch(/- `extra`: /);
    expect(index.indexOf("## Packs and shells of this project")).toBeLessThan(index.indexOf("## How to use"));
    // The release's own index lists everything, so it has no such section.
    expect(renderIndex(ref)).not.toContain("## Packs and shells of this project");
  });

  test("a pack file: the full entries, with an anchor per component", () => {
    const core = ref.packs[0];
    if (!core) throw new Error("fixture");
    const md = renderPack(ref, core);
    expect(packFile("core")).toBe("reference/core.md");
    expect(md).toContain("types: @types/react@19.0.0");
    expect(md).toContain('<a id="button"></a>\n\n## Button (`button`)');
    expect(md).toContain("- Props: `size`: sm | md; `label`: text or content");
    expect(md).toContain('<svg><path d="…"/></svg>');
    expect(md).toContain("```tsx\n<Dialog />\n```");
    expect(md.split("```html").length).toBe(2);
    const long = renderPack(ref, {
      ...core,
      components: [
        component("table", "Table", "Rows.", `<table>${"<tr><td>web-1</td></tr>".repeat(400)}</table>`),
      ],
    });
    expect(long).toContain("<!-- … cut here; the whole markup: reference/core/table.html -->");
    expect(long.length).toBeLessThan(6000);
  });
});
