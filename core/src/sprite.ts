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

export function buildSprite(
  names: readonly string[],
  sets: Readonly<Record<string, IconData>>,
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
  return {
    sprite: `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${symbols.join("")}</svg>\n`,
    missing,
  };
}
