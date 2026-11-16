import type { ThemeConfig } from "@tailor/core/theme";
import type { ReactNode } from "react";
import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { ThemePickers, ThemeProvider } from "./theme-pickers";

const PALETTES = ["gruvbox", "nord", "dracula"];

/**
 * The page's own config when it has one, as the HTML kit's pickers use it; else one that matches the page:
 * its own skin, and three palettes that every build has.
 */
function demoConfig(): ThemeConfig {
  if (typeof window !== "undefined" && window.TAILOR_THEME) return window.TAILOR_THEME;
  const page = typeof document === "undefined" ? {} : document.documentElement.dataset;
  const palette = page.palette && PALETTES.includes(page.palette) ? page.palette : "gruvbox";
  return {
    key: "tailor",
    skins: page.skin ? [page.skin] : [],
    palettes: PALETTES,
    defaults: { skin: page.skin ?? "", palette, mode: page.mode === "light" ? "light" : "dark" },
    labels: { gruvbox: "Gruvbox", nord: "Nord", dracula: "Dracula" },
  };
}

const Demo = ({ children }: { children: ReactNode }) => (
  <ThemeProvider config={demoConfig()}>{children}</ThemeProvider>
);

export default defineExamples("theme-pickers", [
  {
    id: "default",
    title: "Skin, palette and mode",
    render: () => (
      <Demo>
        <ThemePickers />
      </Demo>
    ),
  },
  {
    id: "parts",
    title: "Some parts only, in two sizes",
    note: "Two groups on one page stay in step.",
    render: () => (
      <Demo>
        <Stack>
          <ThemePickers parts={["mode"]} />
          <ThemePickers parts={["palette", "mode"]} size="md" />
        </Stack>
      </Demo>
    ),
  },
  {
    id: "compact",
    title: "Compact, for a narrow column",
    note: "One button shows the skin and the palette and opens their selects; the mode button stays one click away.",
    width: "sm",
    render: () => (
      <Demo>
        <Stack>
          <ThemePickers layout="compact" />
          <ThemePickers layout="compact" parts={["palette", "mode"]} />
        </Stack>
      </Demo>
    ),
  },
]);
