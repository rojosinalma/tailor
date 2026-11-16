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
   below list every allowed value.
5. Icons: \`<Icon name="bi:house" />\` (sets \`bi\` and \`simple-icons\`); run \`tailor icons\` after adding a name.
6. Where the files are, after \`tailor add\`:
   - a. React kit: the source in \`<vendor>/tailor/\`, imported as \`tailor/<pack>\`; stylesheets and
     \`icons.svg\` in \`<public>/tailor/\`.
   - b. HTML kit: \`<public>/tailor/css/\`, \`js/\`, \`icons.svg\`, and the markup of every example in
     \`reference/<pack>/<component>.html\`. Copy that markup; the script adds the behaviour.
   - c. The lines for \`<head>\`: \`<public>/tailor/head.html\`.
7. Below, the HTML markup is shortened: SVG drawing data shows as \`d="…"\`, inline images as \`data:…\`, and
   long markup is cut. The HTML kit's \`reference/\` files hold it whole: copy from there.
`;

const htmlSupport = (h: ReferencePack["html"]): string =>
  typeof h === "string" ? h : `partial (${h.partial})`;

/** Longer markup is cut at a tag; the reference files keep it whole. */
const HTML_LIMIT = 1000;

/** Drawing data and inline images say nothing to a reader: the Markdown shows them as "…". */
function shorten(html: string, file: string): string {
  const short = html.replace(/ d="[^"]*"/g, ' d="…"').replace(/"data:[^"]*"/g, '"data:…"');
  if (short.length <= HTML_LIMIT) return short;
  const cut = short.lastIndexOf("<", HTML_LIMIT);
  return `${short.slice(0, cut > 0 ? cut : HTML_LIMIT)}\n<!-- … the rest is in ${file} -->`;
}

/** The Markdown reference; `packs` limits it to the installed packs. */
export function renderReference(ref: Reference, packs?: readonly string[]): string {
  const shells = ref.packs.filter((p) => p.shell).map((p) => p.id.replace(/^shell-/, ""));
  const out: string[] = [`# tailor ${ref.version}: reference`, "", howTo(shells)];
  for (const pack of ref.packs) {
    if (packs && !packs.includes(pack.id)) continue;
    out.push(`## Pack ${pack.id}: ${pack.name}`, "", pack.description, "");
    const libs = Object.entries(pack.libraries).map(([n, v]) => `${n}@${v}`);
    out.push(
      `Requires: ${pack.requires.join(", ") || "nothing"}. Libraries (React kit): ${libs.join(", ") || "none"}. HTML kit: ${htmlSupport(pack.html)}.`,
      "",
    );
    if (pack.components.length === 0) out.push("No components yet.", "");
    for (const c of pack.components) {
      out.push(`### ${c.name} (\`${c.id}\`)`, "", c.description, "");
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
  }
  return `${out.join("\n").trimEnd()}\n`;
}
