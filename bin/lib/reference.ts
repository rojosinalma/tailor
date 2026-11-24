/**
 * The reference for agents (REFERENCE.md, reference.json), made from the specs and the examples:
 * the React source of each component's first example and its static markup, as the HTML kit uses it.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Reference, ReferenceComponent } from "../../cli/src/reference-md";
import type { PackSpec } from "../../core/src/packs";
import type { ComponentSpec } from "../../core/src/spec";
import { IconSprite } from "../../react/src/core/icon/icon";
import type { Example, ExampleSet } from "../../react/src/examples";
import { StaticKit } from "../../react/src/kit";
import { at } from "./paths";

/** The sprite address a project has by default. */
const SPRITE = "/tailor/icons.svg";

const CLOSE: Record<string, string> = { "(": ")", "[": "]", "{": "}" };

/** The index of the bracket that closes the one at `open`. Skips strings, templates and block comments. */
function closing(source: string, open: number): number {
  const stack: string[] = [];
  for (let i = open; i < source.length; i++) {
    const c = source[i] ?? "";
    if (c === '"' || c === "`") {
      for (i++; i < source.length && source[i] !== c; i++) if (source[i] === "\\") i++;
    } else if (c === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end === -1 ? source.length : end + 1;
    } else if (CLOSE[c]) stack.push(CLOSE[c]);
    else if (c === ")" || c === "]" || c === "}") {
      if (stack.pop() !== c) return -1;
      if (stack.length === 0) return i;
    }
  }
  return -1;
}

/** Removes the common indentation. A first line that starts mid-line (no newline before it) stays as it is. */
function dedent(text: string): string {
  const inline = !/^\s*\n/.test(text);
  const lines = text
    .replace(/^\s*\n/, "")
    .trimEnd()
    .split("\n");
  const rest = inline ? lines.slice(1) : lines;
  const indents = rest.filter((l) => l.trim()).map((l) => /^ */.exec(l)?.[0].length ?? 0);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((l, i) => (inline && i === 0 ? l : l.slice(cut))).join("\n");
}

/** The body of the first `render: () => …` in an examples file, or undefined when there is none. */
export function extractRender(source: string): string | undefined {
  const match = /\brender\s*:\s*\(\s*\)\s*=>\s*/.exec(source);
  if (!match) return undefined;
  const start = match.index + match[0].length;
  const first = source[start];
  if (first === "(" || first === "{") {
    const end = closing(source, start);
    if (end === -1) return undefined;
    return dedent(first === "(" ? source.slice(start + 1, end) : source.slice(start, end + 1));
  }
  // An expression with no brackets around it: up to the comma or bracket that ends the property.
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const c = source[i] ?? "";
    if (c === '"' || c === "`") {
      for (i++; i < source.length && source[i] !== c; i++) if (source[i] === "\\") i++;
    } else if (CLOSE[c]) depth++;
    else if (c === ")" || c === "]" || c === "}" || (c === "," && depth === 0)) {
      if (depth === 0) return dedent(source.slice(start, i)) || undefined;
      depth--;
    }
  }
  return undefined;
}

/** The names a component file exports that an app imports: components and hooks. */
export function componentExports(source: string): string[] {
  return [...source.matchAll(/^export (?:function|const|class) ([A-Z]\w*|use[A-Z]\w*)/gm)].flatMap((m) =>
    m[1] && !/^[A-Z0-9_]+$/.test(m[1]) ? [m[1]] : [],
  );
}

// The glyph sprite ids come from a generated file, which a fresh checkout has only after gen(): it is
// loaded with the first examples, never at import time.
let glyphIds: ReadonlyMap<string, string> | undefined;

export async function loadExamples(spec: ComponentSpec): Promise<ExampleSet> {
  glyphIds ??= (
    (await import(at("core/src/glyph-icons.gen.ts"))) as { GLYPH_IDS: ReadonlyMap<string, string> }
  ).GLYPH_IDS;
  return ((await import(at(`react/src/${spec.pack}/${spec.id}/examples.tsx`))) as { default: ExampleSet })
    .default;
}

/**
 * The code of an example as a project should copy it: a shell in an example fills its preview box
 * (`contained`), and an app's shell fills the screen, so the reference leaves the prop and attribute out.
 * Every agent copied `data-contained` into its real app.
 */
export const forProjects = (code: string): string =>
  code.replaceAll(' data-contained=""', "").replace(/(<[A-Z]\w*\b[^<>]*?)\s+contained(?=[\s/>])/g, "$1");

/** The static markup of one example, as the build renders it for the HTML kit, as a project copies it. */
export function renderExample(example: Example): string {
  return forProjects(renderStatic(example));
}

function renderStatic(example: Example): string {
  if (!glyphIds) throw new Error("renderExample: load the examples first (loadExamples)");
  const body = example.render();
  // biome-ignore lint/correctness/noChildrenProp: both components declare children as a required prop.
  const sprite = createElement(IconSprite, { href: SPRITE, children: body });
  // biome-ignore lint/correctness/noChildrenProp: as above.
  return renderToStaticMarkup(createElement(StaticKit, { children: sprite, glyphs: glyphIds }));
}

export async function buildReference(
  version: string,
  packs: readonly PackSpec[],
  specs: readonly ComponentSpec[],
): Promise<Reference> {
  const problems: string[] = [];
  const component = async (spec: ComponentSpec): Promise<ReferenceComponent | undefined> => {
    const dir = `react/src/${spec.pack}/${spec.id}`;
    const set = await loadExamples(spec);
    const first = set.examples[0];
    const source = extractRender(await Bun.file(at(dir, "examples.tsx")).text());
    const react = source ? forProjects(source) : undefined;
    if (!first || !react) {
      problems.push(`${spec.id}: ${dir}/examples.tsx has no example to show (a first render: () => …)`);
      return undefined;
    }
    const names = componentExports(await Bun.file(at(dir, `${spec.id}.tsx`)).text());
    return {
      id: spec.id,
      name: spec.name,
      group: spec.group,
      description: spec.description,
      import: names.length ? `import { ${names.join(", ")} } from "tailor/${spec.pack}";` : null,
      root: spec.root,
      parts: spec.parts ?? {},
      props: spec.props ?? {},
      html: spec.html,
      example: { title: first.title, react, html: spec.html === "none" ? null : renderExample(first) },
    };
  };
  const out = [];
  for (const pack of packs) {
    const components: ReferenceComponent[] = [];
    for (const spec of specs.filter((s) => s.pack === pack.id)) {
      const c = await component(spec);
      if (c) components.push(c);
    }
    out.push({ ...pack, components });
  }
  if (problems.length) throw new Error(`The reference cannot be made:\n${problems.join("\n")}`);
  return { version, packs: out };
}

/** The code of each component's first example in each kit, for the showcase: whole, not shortened. */
export interface ShowcaseReference {
  readonly components: Readonly<Record<string, { readonly react?: string; readonly html?: string }>>;
}

export const SHOWCASE_REFERENCE = "showcase/src/reference.gen.json";

export async function showcaseReference(specs: readonly ComponentSpec[]): Promise<ShowcaseReference> {
  const components: Record<string, { react?: string; html?: string }> = {};
  for (const spec of specs) {
    const first = (await loadExamples(spec)).examples[0];
    const source = extractRender(await Bun.file(at(`react/src/${spec.pack}/${spec.id}/examples.tsx`)).text());
    const react = source ? forProjects(source) : undefined;
    const html = first && spec.html !== "none" ? renderExample(first) : undefined;
    components[spec.id] = { ...(react ? { react } : {}), ...(html ? { html } : {}) };
  }
  return { components };
}

/** Writes showcase/src/reference.gen.json, only when its content changed. */
export async function writeShowcaseReference(specs: readonly ComponentSpec[]): Promise<void> {
  const text = `${JSON.stringify(await showcaseReference(specs), null, 2)}\n`;
  const file = Bun.file(at(SHOWCASE_REFERENCE));
  if (!(await file.exists()) || (await file.text()) !== text) await Bun.write(file, text);
}
