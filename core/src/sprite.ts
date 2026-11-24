/** Builds one SVG sprite from icon names such as "bi:house". The icon data is Iconify JSON. */

export interface IconData {
  readonly prefix: string;
  readonly icons: Readonly<
    Record<string, { readonly body: string; readonly width?: number; readonly height?: number }>
  >;
  readonly width?: number;
  readonly height?: number;
}

export const ICON_SETS = ["bi", "simple-icons"] as const;
export type IconSetId = (typeof ICON_SETS)[number];

const NAME = "[a-z0-9]+(?:-[a-z0-9]+)*";
const PLAIN = new RegExp(`\\b(?:bi|simple-icons):${NAME}`, "g");
/** A sprite address as HTML markup writes it: `/tailor/icons.svg#bi-house`. */
const SPRITE_ID = new RegExp(`icons\\.svg#(bi|simple-icons)-(${NAME})`, "g");

/** Finds every icon name in a source text: `bi:house`, and the sprite address `icons.svg#bi-house`. */
export function findIconNames(source: string): string[] {
  const names: string[] = [...(source.match(PLAIN) ?? [])];
  for (const [, set, id] of source.matchAll(SPRITE_ID)) names.push(`${set}:${id}`);
  return [...new Set(names)];
}

/**
 * `glyphs` maps a glyph's sprite id (`t-close`) to its Bootstrap icon. A glyph is a plain group, not a symbol:
 * markup draws it with the viewBox of the inline form (`<svg viewBox="0 0 16 16"><use href="…#t-close">`), and
 * it lands on the same pixels as the React kit's inline glyph. A symbol makes a viewport of its own, which
 * the browser draws a little differently at a size between pixels.
 */
export function buildSprite(
  names: readonly string[],
  sets: Readonly<Record<string, IconData>>,
  glyphs: Readonly<Record<string, string>> = {},
): { sprite: string; missing: string[] } {
  const missing: string[] = [];
  const symbols: string[] = [];
  for (const name of [...new Set(names)].sort()) {
    const [prefix = "", id = ""] = name.split(":");
    const set = sets[prefix];
    const icon = set?.icons[id];
    if (!set || !icon) {
      missing.push(name);
      continue;
    }
    const width = icon.width ?? set.width ?? 16;
    const height = icon.height ?? set.height ?? 16;
    symbols.push(`<symbol id="${prefix}-${id}" viewBox="0 0 ${width} ${height}">${icon.body}</symbol>`);
  }
  const groups: string[] = [];
  for (const [id, icon] of Object.entries(glyphs).sort(([a], [b]) => (a < b ? -1 : 1))) {
    const body = sets.bi?.icons[icon]?.body;
    if (body) groups.push(`<g id="${id}">${body}</g>`);
    else missing.push(`bi:${icon}`);
  }
  const defs = groups.length > 0 ? `<defs>${groups.join("")}</defs>` : "";
  return {
    sprite: `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${symbols.join("")}${defs}</svg>\n`,
    missing,
  };
}
