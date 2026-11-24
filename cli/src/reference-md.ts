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

/** The kinds of page: what the page shows, the layout to copy, the shell that suits it, the Page mode. */
export const PAGE_KINDS: readonly (readonly [string, string, string, string])[] = [
  ["The page shows", "Copy", "Shell", "Page mode"],
  ["A list of records", "`list-page`", "`sidenav` or `topnav`", "`scroll`"],
  ["One record", "`detail-page`", "the shell of its list", "`scroll`"],
  ["The settings of the app", "`settings-page`", "`sidenav` or `topnav`", "`fill`"],
  ["An overview, a dashboard", "`dashboard-page`", "`sidenav` or `topnav`", "`scroll`"],
  [
    "A tool: inputs and a result (a preview, an output, a log)",
    "`tool-page`",
    "`topnav`, also with no links",
    "`fill`",
  ],
  ["Nothing yet: the first run, an empty list", "`first-run-page`", "the shell of the app", "`scroll`"],
  [
    "Sign-in, an error, not found, offline",
    "`sign-in`, `error-page`, `not-found`, `offline-page`",
    '`bare` with `align="center"`',
    "no `Page`",
  ],
  [
    "A form that adds or edits a record",
    "`form-dialog`",
    "the shell of the page under it",
    "that page's mode",
  ],
  [
    "A workspace, an editor: a tree, the item, panels",
    '`page` (example "fill"), `split`, `list-detail`',
    "`workspace`",
    "`fill`",
  ],
];

/** A Markdown table with padded columns; the first row is the header. */
function table(rows: readonly (readonly string[])[]): string {
  const widths = (rows[0] ?? []).map((_, i) => Math.max(...rows.map((r) => (r[i] ?? "").length)));
  const line = (r: readonly string[]) => `| ${r.map((c, i) => c.padEnd(widths[i] ?? 0)).join(" | ")} |`;
  const [head = [], ...body] = rows;
  return [line(head), `| ${widths.map((w) => "-".repeat(w)).join(" | ")} |`, ...body.map(line)].join("\n");
}

const pickPage = (): string => `## Pick the page first

Find the kind of each page in this table; copy its layout (pack \`layouts\`, entries in
[reference/layouts.md](reference/layouts.md)), put it in the shell of the row, and give the \`Page\` that mode
(React \`mode="fill"\`, HTML \`data-mode="fill"\` on \`t-page\`).

${table(PAGE_KINDS)}

1. A page with a part that can grow without limit beside other parts (a picture, an output, a log next to a
   form) is a \`fill\` page: each part goes in a \`Pane\`, which scrolls alone, and a picture goes in a
   \`MediaFit\` (\`t-media-fit\`). The page itself then never scrolls.
2. A \`scroll\` page grows with its content and scrolls as one column. Never put a large picture in a \`Card\`
   of a scroll page: it grows the card and the page.
3. No kind fits: start from the nearest row, and keep its shell and its mode.
`;

const howTo = (shells: readonly string[]): string => `## How to use

1. Pick one shell (${shells.map((s) => `\`${s}\``).join(", ") || "none in this release yet"}) and give it data:
   brand, links, actions. Never write the frame yourself.
2. Each view renders one \`Page\` (title, actions, body) inside the shell, with the mode of its row in the
   table above.
3. All spacing comes from layout parts: \`Stack\`, \`Cluster\`, \`Grid\`, \`Section\`, \`Card\`, \`Split\`. A component
   never sets its own margin; never add one.
4. Never write colours, sizes, fonts or class names of your own: skins and palettes set the look, and the props
   in the pack files list every allowed value.
5. Icons: \`<Icon name="bi:house" />\` in the React kit; in HTML markup
   \`<svg class="t-icon" aria-hidden="true"><use href="/tailor/icons.svg#bi-house"></use></svg>\` (sets \`bi\` and
   \`simple-icons\`). Run \`tailor icons\` after adding a name: it finds both forms and adds them to the sprite.
   The small icons of tailor's own parts (close, chevron, help, the tones of an alert or a state) are in the
   sprite of an HTML kit project already: the reference markup draws them as
   \`<svg class="t-icon" viewBox="0 0 16 16" aria-hidden="true"><use href="/tailor/icons.svg#t-close"></use></svg>\`
   (\`t-chevron-down\`, \`t-help\`, \`t-info\`, \`t-success\`, \`t-warning\`, \`t-danger\`, …). Copy that line;
   never copy or write an icon's drawing (\`<path d="…">\`).
6. Where the files are, after \`tailor add\`:
   - a. React kit: the source in \`<vendor>/tailor/\`, imported as \`tailor/<pack>\`; stylesheets and
     \`icons.svg\` in \`<public>/tailor/\`.
   - b. HTML kit: \`<public>/tailor/css/\`, \`js/\`, \`icons.svg\`, and the markup of every example in
     \`reference/<pack>/<component>.html\`. Copy that markup; the script adds the behaviour.
   - c. The lines for \`<head>\`: \`<public>/tailor/head.html\`.
7. This file lists the components. Read the entry of a component (props, parts, one example in each kit) in
   \`reference/<pack>.md\` before you use it.
8. HTML kit, the page's own script: \`Tailor.toast(tone, text)\`, \`await Tailor.confirm({ title, text, danger })\`,
   \`Tailor.busy(button, on)\` (a spinner in place of the icon; it ignores clicks), \`Tailor.upgrade(node)\`. A
   \`<form data-t="form" data-t-submit="fetch" action="…">\` sends itself and keeps its submit button busy: a JSON
   answer \`{ ok, message, errors }\` shows as a toast and puts the errors on their fields; any other answer (a
   picture, a file) comes in the \`t:submit\` event as \`detail.blob\` with \`detail.response\`, and a picture
   goes into the \`t-media-fit\` that \`data-t-result="<its id>"\` names, where a button with
   \`data-t-download="<its id>"\` saves it. Never write fetch or busy code for a form.
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

/**
 * What the project has and what it can add. An agent that saw only the core pack built a shell and a settings
 * page by hand: nothing said that the layouts and the shells of the table above are one command away.
 */
function installed(ref: Reference, packs: readonly string[]): string {
  const name = (p: ReferencePack) => (p.shell ? p.id.replace(/^shell-/, "") : p.id);
  const have = ref.packs.filter((p) => packs.includes(p.id));
  const shell = have.find((p) => p.shell);
  const missing = ref.packs.filter((p) => !packs.includes(p.id) && !p.shell);
  const shells = ref.packs.filter((p) => p.shell && !packs.includes(p.id));
  const lines = [
    "## Packs and shells of this project",
    "",
    `This project has the packs ${have
      .filter((p) => !p.shell)
      .map((p) => `\`${p.id}\``)
      .join(
        ", ",
      )} and ${shell ? `the shell \`${name(shell)}\`` : "no shell yet"}. This file lists only what it has.`,
    "Before you build a page, add the shell and the packs that its row in the table above names (the layouts are",
    "in the pack `layouts`), in the project folder:",
    "",
    "```sh",
    `tailor add --shell ${shell ? name(shell) : "<shell>"} --packs <pack>,<pack>   # such as: --shell topnav --packs layouts`,
    "```",
    "",
    "It copies their files, adds their entries to this reference, and prints the lines for `<head>` again: the",
    "HTML kit needs the new stylesheet and script lines in every page, the React kit the new `bun add` line. A",
    "project has one shell.",
    "",
  ];
  if (shells.length > 0)
    lines.push(`Shells it can add: ${shells.map((p) => `\`${name(p)}\``).join(", ")}.`, "");
  if (missing.length > 0) {
    lines.push("Packs it can add:", "");
    for (const p of missing)
      lines.push(
        `- \`${p.id}\`: ${firstSentence(p.description)}${p.html === "none" ? " React kit only." : ""}`,
      );
    lines.push("");
  }
  return lines.join("\n");
}

/** The index: the "how to use" screen and one line per component. `packs` limits it to the installed packs. */
export function renderIndex(ref: Reference, packs?: readonly string[]): string {
  const shells = ref.packs.filter((p) => p.shell).map((p) => p.id.replace(/^shell-/, ""));
  const out: string[] = [
    `# tailor ${ref.version}: reference`,
    "",
    pickPage(),
    ...(packs ? [installed(ref, packs)] : []),
    howTo(shells),
    "## Components",
    "",
  ];
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
