/** What the site shows, read from the registry: a new component, shell or pack shows up by itself. */
import { PACKS, type PackSpec, packById } from "@tailor/core/packs";
import { SPECS } from "@tailor/core/registry.gen";
import { type ComponentSpec, GROUPS, type Group } from "@tailor/core/spec";
import type { ThemeConfig } from "@tailor/core/theme";
import pkg from "../../../package.json";
import site from "../site.gen.json";

const defaultMode = (mode: string): ThemeConfig["defaults"]["mode"] =>
  mode === "dark" || mode === "light" ? mode : "auto";

export const THEME: ThemeConfig = {
  ...site.theme,
  defaults: { ...site.theme.defaults, mode: defaultMode(site.theme.defaults.mode) },
};

export const VERSION: string =
  "version" in site && typeof site.version === "string" ? site.version : pkg.version;

export const REPOSITORY = "https://github.com/rojosinalma/tailor";

export const COMPONENTS: readonly ComponentSpec[] = [...SPECS].sort((a, b) => a.name.localeCompare(b.name));

export const componentById = (id: string): ComponentSpec | undefined => SPECS.find((s) => s.id === id);

/** A shell is the one component of a shell pack. */
export const isShell = (spec: ComponentSpec): boolean => packById(spec.pack)?.shell === true;

export const SHELLS: readonly ComponentSpec[] = COMPONENTS.filter(isShell);

export const PACK_LIST: readonly PackSpec[] = PACKS;

export const GROUP_LABELS: Readonly<Record<Group, string>> = {
  layout: "Layout",
  actions: "Actions",
  display: "Display",
  feedback: "Feedback",
  navigation: "Navigation",
  inputs: "Inputs",
  phone: "Phone",
  pages: "Pages",
  shells: "Shells",
  layouts: "Layouts",
};

/** The component groups of the sidebar, in the order of the spec, each with its components by name. */
export const COMPONENT_GROUPS: readonly { group: Group; items: readonly ComponentSpec[] }[] = GROUPS.filter(
  (g) => g !== "shells" && g !== "layouts",
).map((group) => ({ group, items: COMPONENTS.filter((c) => c.group === group) }));

export const htmlSupportLabel = (html: ComponentSpec["html"]): string =>
  html === "markup" ? "HTML kit: markup" : html === "script" ? "HTML kit: markup + script" : "React kit only";

export const packHtmlLabel = (html: PackSpec["html"]): string =>
  html === "full" ? "Full" : html === "none" ? "None" : `Partial: ${html.partial}`;

export const packName = (id: string): string => packById(id)?.name ?? id;

/** The import path of a component's pack in the React kit. */
export const importPath = (spec: ComponentSpec): string => `tailor/${spec.pack}`;
