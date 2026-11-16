import type { ThemeConfig, ThemeState } from "@tailor/core/theme";

export interface ThemeChoice {
  readonly value: string;
  readonly label: string;
}

/** The skins or palettes of a config as select options, sorted by display name. */
export function themeChoices(config: ThemeConfig, part: "skin" | "palette"): ThemeChoice[] {
  return (part === "skin" ? config.skins : config.palettes)
    .map((value) => ({ value, label: config.labels?.[value] ?? value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** The display names of the current skin and palette, in that order, for the compact button. */
export function themeSummary(
  config: ThemeConfig,
  state: Pick<ThemeState, "skin" | "palette">,
  parts: readonly ("skin" | "palette")[],
): string[] {
  return parts
    .map((part) => state[part])
    .filter(Boolean)
    .map((value) => config.labels?.[value] ?? value);
}
