/** The lines a page needs in <head>, made from the release's template and the project's theme settings. */
import { prepaintScript, type ThemeConfig } from "../../core/src/theme";
import type { Manifest } from "./manifest";
import type { State } from "./state";

export const VIEWPORT =
  "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content";

/** The template that the release carries as html/head.html. */
export const HEAD_TEMPLATE = `<meta name="viewport" content="${VIEWPORT}">
<script>{{prepaint}}window.TAILOR_THEME={{theme}};</script>
{{stylesheets}}
{{scripts}}
`;

export function themeConfig(manifest: Manifest, theme: State["theme"]): ThemeConfig {
  return {
    key: theme.key,
    skins: manifest.skins.map((s) => s.id),
    palettes: manifest.palettes.map((p) => p.id),
    defaults: { skin: theme.skin, palette: theme.palette, mode: theme.mode },
    base: theme.base,
    labels: Object.fromEntries([...manifest.skins, ...manifest.palettes].map((x) => [x.id, x.name])),
  };
}

/** The address of tailor/js/ next to tailor/css/. */
const scriptBase = (cssBase: string): string => cssBase.replace(/[^/]+\/$/, "js/");

export function headHtml(
  template: string,
  config: ThemeConfig,
  assets: { readonly stylesheets: readonly string[]; readonly scripts: readonly string[] },
): string {
  const base = config.base ?? "";
  const values: Record<string, string> = {
    prepaint: prepaintScript(config),
    theme: JSON.stringify(config).replaceAll("<", "\\u003c"),
    stylesheets: assets.stylesheets.map((f) => `<link rel="stylesheet" href="${base}${f}">`).join("\n"),
    scripts: assets.scripts.map((f) => `<script defer src="${scriptBase(base)}${f}"></script>`).join("\n"),
  };
  return template
    .replace(/\{\{(\w+)\}\}/g, (all, name: string) => values[name] ?? all)
    .replace(/\n{2,}/g, "\n");
}
