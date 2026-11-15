import { moon, sun } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { createTheme, THEME_EVENT, type Theme, type ThemeConfig, type ThemeState } from "@tailor/core/theme";
import { themeChoices } from "@tailor/packs/core/theme-pickers/logic";
import type spec from "@tailor/packs/core/theme-pickers/spec";
import { createContext, type ReactNode, use, useEffect, useState, useSyncExternalStore } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { Button } from "../button/button";
import { Select } from "../select/select";

declare global {
  interface Window {
    /** The page's theme config, for code that runs without a ThemeProvider. */
    TAILOR_THEME?: ThemeConfig;
  }
}

type ThemePart = (typeof spec.props.parts)[number];
type ThemePickersSize = (typeof spec.props.size)[number];

const ALL_PARTS: readonly ThemePart[] = ["skin", "palette", "mode"];

const ThemeContext = createContext<Theme | null>(null);

/** Keeps a theme in step with every other theme object on the page (another root, the HTML kit). */
function follow(theme: Theme): () => void {
  const listener = (event: Event): void => {
    if (event instanceof CustomEvent) theme.set(event.detail as Partial<ThemeState>);
  };
  document.addEventListener(THEME_EVENT, listener);
  return () => document.removeEventListener(THEME_EVENT, listener);
}

/** Creates the theme once from the config and gives it to useTheme() below. */
export function ThemeProvider({ config, children }: { config: ThemeConfig; children?: ReactNode }) {
  const [theme] = useState(() => createTheme(config));
  useEffect(() => follow(theme), [theme]);
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

let pageTheme: Theme | undefined;

function themeFromPage(): Theme {
  if (pageTheme) return pageTheme;
  const config = typeof window === "undefined" ? undefined : window.TAILOR_THEME;
  if (!config)
    throw new Error(
      "useTheme(): put the app inside <ThemeProvider config={…}>, or set window.TAILOR_THEME first",
    );
  pageTheme = createTheme(config);
  follow(pageTheme);
  return pageTheme;
}

export interface ThemeValue extends ThemeState {
  set: Theme["set"];
  config: ThemeConfig;
}

/** The current skin, palette and mode, and set() to change them. */
export function useTheme(): ThemeValue {
  const theme = use(ThemeContext) ?? themeFromPage();
  const state = useSyncExternalStore(theme.subscribe, theme.get, theme.get);
  return { ...state, set: theme.set, config: theme.config };
}

export interface ThemePickersProps {
  /** The controls to show, always in the order skin, palette, mode. */
  parts?: readonly ThemePart[];
  size?: ThemePickersSize;
}

/** The skin select, the palette select and the mode toggle, in one row that wraps. */
export function ThemePickers({ parts = ALL_PARTS, size = "sm" }: ThemePickersProps) {
  const shown = ALL_PARTS.filter((part) => parts.includes(part));
  if (useIsStatic()) {
    return (
      <div
        className="t-theme-pickers"
        data-t="theme-pickers"
        data-parts={shown.length === ALL_PARTS.length ? undefined : shown.join(" ")}
        data-size={size === "sm" ? undefined : size}
      />
    );
  }
  return <LivePickers parts={shown} size={size} />;
}

function LivePickers({ parts, size }: { parts: readonly ThemePart[]; size: ThemePickersSize }) {
  const theme = useTheme();
  return (
    <div className="t-theme-pickers">
      {parts.map((part) =>
        part === "mode" ? (
          <Button
            key={part}
            className="t-theme-mode"
            variant="ghost"
            size={size}
            icon={<Glyph body={theme.mode === "dark" ? sun : moon} />}
            label={theme.mode === "dark" ? t("lightMode") : t("darkMode")}
            onClick={() => theme.set({ mode: theme.mode === "dark" ? "light" : "dark" })}
          />
        ) : (
          <Select
            key={part}
            options={themeChoices(theme.config, part)}
            value={theme[part]}
            onValueChange={(value) => theme.set({ [part]: value })}
            size={size}
            aria-label={t(part)}
          />
        ),
      )}
    </div>
  );
}
