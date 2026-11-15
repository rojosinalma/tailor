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

/** Finds every icon name in a source text. */
export function findIconNames(source: string): string[] {
  return [...new Set(source.match(/\b(?:bi|simple-icons):[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [])];
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
