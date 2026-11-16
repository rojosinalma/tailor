/** The packs: what a project can add, what each one needs and which kit provides it. */

export interface PackSpec {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Packs that must be present too. */
  readonly requires: readonly string[];
  /** Libraries the React kit needs for this pack, with their pinned versions. */
  readonly libraries: Readonly<Record<string, string>>;
  /** What the HTML kit provides: all of the pack, a named part of it, or nothing. */
  readonly html: "full" | "none" | { readonly partial: string };
  /** A shell pack holds one shell. */
  readonly shell?: boolean;
}

const pack = (p: PackSpec): PackSpec => p;

export const PACKS: readonly PackSpec[] = [
  pack({
    id: "core",
    name: "Core",
    description:
      "Tokens, skins, palettes, theme switch, icons, layout parts and the components that nearly every UI uses.",
    requires: [],
    libraries: {
      react: "19.3.1",
      "react-dom": "19.3.1",
      "@base-ui/react": "1.9.0",
      "@tanstack/react-router": "1.170.46",
    },
    html: "full",
  }),
  pack({
    id: "shell-topnav",
    name: "Top navigation shell",
    description: "Brand, links and actions in a top bar.",
    requires: ["core"],
    libraries: {},
    html: "full",
    shell: true,
  }),
  pack({
    id: "shell-sidenav",
    name: "Side navigation shell",
    description: "Grouped links in a left column that collapses.",
    requires: ["core"],
    libraries: {},
    html: "full",
    shell: true,
  }),
  pack({
    id: "shell-bare",
    name: "Bare shell",
    description: "A frame with no navigation, for sign-in, error and full-screen views.",
    requires: ["core"],
    libraries: {},
    html: "full",
    shell: true,
  }),
  pack({
    id: "shell-workspace",
    name: "Workspace shell",
    description: "Sidebars, a centre and panels that fill the screen and never scroll as a page.",
    requires: ["core"],
    libraries: {},
    html: "full",
    shell: true,
  }),
  pack({
    id: "forms",
    name: "Forms",
    description: "Validated forms, the settings page and the list and key-value editors.",
    requires: ["core"],
    libraries: { "@tanstack/react-form": "1.33.5", "@tanstack/react-pacer": "0.24.1" },
    html: "full",
  }),
  pack({
    id: "pickers",
    name: "Pickers",
    description: "Date, time, date range, colour, file upload, rating and one-time code.",
    requires: ["core"],
    libraries: {},
    html: "full",
  }),
  pack({
    id: "data",
    name: "Data",
    description: "Data table, long list, tree view, log viewer and the views for loading, error and empty.",
    requires: ["core"],
    libraries: {
      "@tanstack/react-table": "9.3.1",
      "@tanstack/react-virtual": "3.14.26",
      "@tanstack/react-query": "5.107.1",
    },
    html: "full",
  }),
  pack({
    id: "command",
    name: "Command",
    description: "Command palette, shortcuts and the shortcuts help.",
    requires: ["core"],
    libraries: { "@tanstack/react-hotkeys": "0.25.1" },
    html: "none",
  }),
  pack({
    id: "charts",
    name: "Charts",
    description: "Line, area, donut and bar charts that follow the palette.",
    requires: ["core"],
    libraries: { "chart.js": "4.6.1" },
    html: "full",
  }),
  pack({
    id: "code",
    name: "Code",
    description: "Code colouring, code field, JSON viewer and diff viewer.",
    requires: ["core"],
    libraries: { "highlight.js": "11.12.0", diff: "9.0.0" },
    html: { partial: "code colouring" },
  }),
  pack({
    id: "markdown",
    name: "Markdown",
    description: "Markdown view and an editor with preview.",
    requires: ["core"],
    libraries: { marked: "18.2.0", dompurify: "3.4.18" },
    html: { partial: "the view" },
  }),
  pack({
    id: "chat",
    name: "Chat",
    description: "Message list, composer and notices.",
    requires: ["markdown"],
    libraries: {},
    html: "none",
  }),
  pack({
    id: "sortable",
    name: "Sortable",
    description: "Drag to reorder lists, rows and cards.",
    requires: ["core"],
    libraries: { "@dnd-kit/react": "0.5.3", "@dnd-kit/dom": "0.5.3" },
    html: "none",
  }),
  pack({
    id: "board",
    name: "Board",
    description: "Kanban board.",
    requires: ["sortable"],
    libraries: {},
    html: "none",
  }),
  pack({
    id: "calendar",
    name: "Calendar",
    description: "Calendar view of events.",
    requires: ["pickers"],
    libraries: {},
    html: "none",
  }),
  pack({
    id: "map",
    name: "Map",
    description: "A map frame with controls that follow the palette.",
    requires: ["core"],
    libraries: { leaflet: "1.9.4" },
    html: "full",
  }),
  pack({
    id: "media",
    name: "Media",
    description: "Lightbox, carousel and thumbnail grid.",
    requires: ["core"],
    libraries: {},
    html: "full",
  }),
  pack({
    id: "cropper",
    name: "Cropper",
    description: "Image cropper with zoom.",
    requires: ["core"],
    libraries: { "react-easy-crop": "6.2.5" },
    html: "none",
  }),
  pack({
    id: "tour",
    name: "Tour",
    description: "Guided tour of a UI.",
    requires: ["core"],
    libraries: {},
    html: "none",
  }),
  pack({
    id: "pwa",
    name: "PWA",
    description: "Install item, update notice, offline banner and offline data.",
    requires: ["core"],
    libraries: { "@tanstack/react-query-persist-client": "5.107.1" },
    html: { partial: "install and offline frame" },
  }),
  pack({
    id: "windows",
    name: "Windows",
    description: "Floating windows that move, resize and minimise.",
    requires: ["core"],
    libraries: {},
    html: "none",
  }),
  pack({
    id: "layouts",
    name: "Layouts",
    description:
      "Standard page layouts with sample content, to copy: list with filters, detail, settings, dashboard, form dialog, first run.",
    requires: ["core", "forms", "data"],
    libraries: {},
    html: "full",
  }),
];

export const packById = (id: string): PackSpec | undefined => PACKS.find((p) => p.id === id);

/** A pack and every pack it requires, each once, requirements first. */
export function withRequirements(ids: readonly string[]): string[] {
  const out: string[] = [];
  const visit = (id: string): void => {
    const p = packById(id);
    if (!p) throw new Error(`Unknown pack: ${id}`);
    for (const r of p.requires) visit(r);
    if (!out.includes(id)) out.push(id);
  };
  for (const id of ids) visit(id);
  return out;
}
