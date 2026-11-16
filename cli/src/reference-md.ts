/** The reference for agents, as data and as Markdown. bin/lib/reference.ts makes the data from the build. */

export interface ReferenceComponent {
  readonly id: string;
  readonly name: string;
  readonly group: string;
  readonly description: string;
  /** The React import line, or null when the component has no exports the import can name. */
  readonly import: string | null;
  readonly root: string;
  readonly parts: Readonly<Record<string, string>>;
  readonly props: Readonly<Record<string, readonly string[]>>;
  readonly html: "markup" | "script" | "none";
  readonly example: { readonly title: string; readonly react: string; readonly html: string | null };
}

export interface ReferencePack {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly requires: readonly string[];
  readonly libraries: Readonly<Record<string, string>>;
  readonly devLibraries?: Readonly<Record<string, string>>;
  readonly html: "full" | "none" | { readonly partial: string };
  readonly shell?: boolean;
  readonly components: readonly ReferenceComponent[];
}

export interface Reference {
  readonly version: string;
  readonly packs: readonly ReferencePack[];
}

const howTo = (shells: readonly string[]): string => `## How to use

1. Pick one shell (${shells.map((s) => `\`${s}\``).join(", ") || "none in this release yet"}) and give it data:
   brand, links, actions. Never write the frame yourself.
2. Each view renders one \`Page\` (title, actions, body) inside the shell.
3. All spacing comes from layout parts: \`Stack\`, \`Cluster\`, \`Grid\`, \`Section\`, \`Card\`, \`Split\`. A component
   never sets its own margin; never add one.
4. Never write colours, sizes, fonts or class names of your own: skins and palettes set the look, and the props
   in the pack files list every allowed value.
5. Icons: \`<Icon name="bi:house" />\` (sets \`bi\` and \`simple-icons\`); run \`tailor icons\` after adding a name.
6. Where the files are, after \`tailor add\`:
   - a. React kit: the source in \`<vendor>/tailor/\`, imported as \`tailor/<pack>\`; stylesheets and
     \`icons.svg\` in \`<public>/tailor/\`.
   - b. HTML kit: \`<public>/tailor/css/\`, \`js/\`, \`icons.svg\`, and the markup of every example in
     \`reference/<pack>/<component>.html\`. Copy that markup; the script adds the behaviour.
   - c. The lines for \`<head>\`: \`<public>/tailor/head.html\`.
7. This file lists the components. Read the entry of a component (props, parts, one example in each kit) in
   \`reference/<pack>.md\` before you use it.
`;

const htmlSupport = (h: ReferencePack["html"]): string =>
  typeof h === "string" ? h : `partial (${h.partial})`;

/** Markup longer than this (a table of 200 rows) is cut at a tag; the HTML kit's markup files keep it whole. */
const HTML_LIMIT = 4000;

/** Drawing data and inline images say nothing to a reader: the Markdown shows them as "…". */
function shorten(html: string, file: string): string {
  const short = html.replace(/ d="[^"]*"/g, ' d="…"').replace(/"data:[^"]*"/g, '"data:…"');
  if (short.length <= HTML_LIMIT) return short;
  const cut = short.lastIndexOf("<", HTML_LIMIT);
  return `${short.slice(0, cut > 0 ? cut : HTML_LIMIT)}\n<!-- … cut here; the whole markup: ${file} -->`;
}

/** The first sentence of a description. */
const firstSentence = (text: string): string => /^.*?[.!?](?=\s|$)/s.exec(text)?.[0] ?? text;

const packLine = (pack: ReferencePack): string => {
  const pinned = (libs: Readonly<Record<string, string>>) =>
    Object.entries(libs).map(([n, v]) => `${n}@${v}`);
  const types = pinned(pack.devLibraries ?? {});
  return `Requires: ${pack.requires.join(", ") || "nothing"}. Libraries (React kit): ${pinned(pack.libraries).join(", ") || "none"}${types.length ? `; types: ${types.join(", ")}` : ""}. HTML kit: ${htmlSupport(pack.html)}.`;
};

/** The path of a pack's file, relative to the index. */
export const packFile = (pack: string): string => `reference/${pack}.md`;

/** The index: the "how to use" screen and one line per component. `packs` limits it to the installed packs. */
export function renderIndex(ref: Reference, packs?: readonly string[]): string {
  const shells = ref.packs.filter((p) => p.shell).map((p) => p.id.replace(/^shell-/, ""));
  const out: string[] = [`# tailor ${ref.version}: reference`, "", howTo(shells), "## Components", ""];
  for (const pack of ref.packs) {
    if (packs && !packs.includes(pack.id)) continue;
    out.push(`### Pack ${pack.id}: ${pack.name} ([${packFile(pack.id)}](${packFile(pack.id)}))`, "");
    if (pack.components.length === 0) out.push("No components yet.");
    for (const c of pack.components)
      out.push(
        `- [${c.name}](${packFile(pack.id)}#${c.id}) (\`${c.id}\`, ${pack.id}): ${firstSentence(c.description)}`,
      );
    out.push("");
  }
  return `${out.join("\n").trimEnd()}\n`;
}

/** The full entries of one pack's components. */
export function renderPack(ref: Reference, pack: ReferencePack): string {
  const out: string[] = [
    `# tailor ${ref.version}: pack ${pack.id} (${pack.name})`,
    "",
    pack.description,
    "",
    packLine(pack),
    "",
    `SVG drawing data in the markup shows as \`d="…"\`, inline images as \`data:…\`, and markup over ${HTML_LIMIT} characters is cut. The HTML kit has each example whole in \`reference/${pack.id}/<component>.html\`.`,
    "",
  ];
  if (pack.components.length === 0) out.push("No components yet.", "");
  for (const c of pack.components) {
    out.push(`<a id="${c.id}"></a>`, "", `## ${c.name} (\`${c.id}\`)`, "", c.description, "");
    if (c.import) out.push(`- React: \`${c.import}\``);
    const parts = Object.entries(c.parts).map(([k, v]) => `\`${k}\` ${v}`);
    out.push(`- Classes: \`${c.root}\`${parts.length ? `; parts: ${parts.join("; ")}` : ""}`);
    const props = Object.entries(c.props).map(
      ([k, v]) => `\`${k}\`: ${v.length ? v.join(" | ") : "text or content"}`,
    );
    if (props.length) out.push(`- Props: ${props.join("; ")}`);
    out.push(
      `- HTML kit: ${c.html}`,
      "",
      `Example: ${c.example.title}`,
      "",
      "```tsx",
      c.example.react,
      "```",
    );
    if (c.example.html)
      out.push("", "```html", shorten(c.example.html, `reference/${pack.id}/${c.id}.html`), "```");
    out.push("");
  }
  return `${out.join("\n").trimEnd()}\n`;
}
