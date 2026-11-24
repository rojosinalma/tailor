import { describe, expect, test } from "bun:test";
import { PAGE_KINDS } from "../../cli/src/reference-md";
import { SPECS } from "../../core/src/registry.gen";
import { componentExports, extractRender, forProjects } from "./reference";

describe("the example extractor", () => {
  test("takes the JSX inside the brackets, dedented", () => {
    const source = `export default defineExamples("button", [
  {
    id: "variants",
    title: "Variants",
    render: () => (
      <Cluster>
        <Button variant="primary">Save (now)</Button>
        {items.map((i) => (
          <Badge key={i}>{i}</Badge>
        ))}
      </Cluster>
    ),
  },
  { id: "second", title: "Second", render: () => <Button>Other</Button> },
]);`;
    expect(extractRender(source)).toBe(
      [
        "<Cluster>",
        '  <Button variant="primary">Save (now)</Button>',
        "  {items.map((i) => (",
        "    <Badge key={i}>{i}</Badge>",
        "  ))}",
        "</Cluster>",
      ].join("\n"),
    );
  });

  test("takes a bare expression up to the end of the property", () => {
    expect(
      extractRender(
        '[{ id: "a", render: () => <Select options={hosts} label="Host, or none" />, note: "x" }]',
      ),
    ).toBe('<Select options={hosts} label="Host, or none" />');
    expect(extractRender('[{ render: () => <Badge tone="info">it\'s {"}"} here</Badge> }]')).toBe(
      '<Badge tone="info">it\'s {"}"} here</Badge>',
    );
  });

  test("keeps a block body whole", () => {
    expect(extractRender("{ render: () => {\n    const x = 1;\n    return <A x={x} />;\n  } }")).toBe(
      "{\n  const x = 1;\n  return <A x={x} />;\n}",
    );
  });

  test("brackets inside strings, templates and comments do not count", () => {
    expect(extractRender('{ render: () => (\n  <A b=")" c={`(x`} /* ) */ />\n) }')).toBe(
      '<A b=")" c={`(x`} /* ) */ />',
    );
  });

  test("no render or no closing bracket: nothing", () => {
    expect(extractRender("export const x = 1;")).toBeUndefined();
    expect(extractRender("{ render: () => (<A>")).toBeUndefined();
  });

  test("the import names the components and hooks, not constants", () => {
    const source = [
      "export function Button() {}",
      "export const ButtonLink = () => null;",
      "export const TONE_GLYPH = {};",
      "export function useTheme() {}",
      "export interface ButtonProps {}",
      "function helper() {}",
    ].join("\n");
    expect(componentExports(source)).toEqual(["Button", "ButtonLink", "useTheme"]);
  });
});

describe("the page-kind table of the reference", () => {
  test("names only components and shells that exist", () => {
    const ids = new Set(SPECS.map((s) => s.id));
    for (const [, copy, shell] of PAGE_KINDS.slice(1)) {
      for (const id of [...copy.matchAll(/`([a-z-]+)`/g)].map((m) => m[1] ?? "")) expect(ids).toContain(id);
      for (const id of [...shell.matchAll(/`([a-z-]+)`/g)].map((m) => m[1] ?? "")) expect(ids).toContain(id);
    }
  });
});

test("the reference leaves out the preview box of a shell example", () => {
  expect(forProjects('<div class="t-shell" data-shell="topnav" data-contained="" data-t="shell">')).toBe(
    '<div class="t-shell" data-shell="topnav" data-t="shell">',
  );
  expect(
    forProjects("<TopNavShell brand={BRAND} nav={NAV} contained>\n<TopNavShell\n  contained\n  nav={NAV}\n>"),
  ).toBe("<TopNavShell brand={BRAND} nav={NAV}>\n<TopNavShell\n  nav={NAV}\n>");
  expect(forProjects("<p>It contained two</p>")).toBe("<p>It contained two</p>");
});
