import { describe, expect, test } from "bun:test";
import { componentExports, extractRender } from "./reference";

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
