import { moon, sun } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { createTheme, THEME_EVENT, type Theme, type ThemeConfig, type ThemeState } from "@tailor/core/theme";
import { themeChoices } from "@tailor/packs/core/theme-pickers/logic";
import { glyph, h, once, register, upgrade } from "../runtime";

declare global {
  interface Window {
    /** The page's theme config, for code that runs without a ThemeProvider. */
    TAILOR_THEME?: ThemeConfig;
  }
}

/** Without a config, the page's current skin and palette are the only choices. */
function configFromPage(): ThemeConfig {
  const { skin, palette, mode } = document.documentElement.dataset;
  return {
    key: "tailor",
    skins: skin ? [skin] : [],
    palettes: palette ? [palette] : [],
    defaults: { skin: skin ?? "", palette: palette ?? "", mode: mode === "light" ? "light" : "dark" },
  };
}

let theme: Theme | undefined;

once("theme", () => {
  const created = createTheme(window.TAILOR_THEME ?? configFromPage());
  theme = created;
  window.Tailor.theme = created;
  // Another theme object on the page (a React root) keeps this one in step.
  document.addEventListener(THEME_EVENT, (event) => {
    if (event instanceof CustomEvent) created.set(event.detail as Partial<ThemeState>);
  });
});

const PARTS = ["skin", "palette", "mode"] as const;

register("theme-pickers", (element) => {
  if (!theme) return;
  const current = theme;
  const wanted = (element.dataset.parts ?? PARTS.join(" ")).split(/\s+/);
  const size = element.dataset.size ?? "sm";
  const dataSize = size === "md" ? undefined : size;

  const selects: [HTMLSelectElement, "skin" | "palette"][] = [];
  const mode = h("button", {
    type: "button",
    class: "t-btn t-theme-mode",
    "data-variant": "ghost",
    "data-size": dataSize,
    "data-icon-only": true,
  });

  const paint = (state: ThemeState): void => {
    for (const [select, part] of selects) {
      if (select.value === state[part]) continue;
      select.value = state[part];
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const dark = state.mode === "dark";
    mode.setAttribute("aria-label", dark ? t("lightMode") : t("darkMode"));
    mode.replaceChildren(glyph(dark ? sun : moon));
  };

  const state = current.get();
  const children = PARTS.filter((part) => wanted.includes(part)).map((part) => {
    if (part === "mode") return mode;
    const select = h(
      "select",
      { class: "t-control t-select", "data-t": "select", "data-size": dataSize, "aria-label": t(part) },
      ...themeChoices(current.config, part).map((choice) =>
        h("option", { value: choice.value, selected: choice.value === state[part] }, choice.label),
      ),
    );
    select.addEventListener("change", () => current.set({ [part]: select.value }));
    selects.push([select, part]);
    return select;
  });

  mode.addEventListener("click", () =>
    current.set({ mode: current.get().mode === "dark" ? "light" : "dark" }),
  );
  document.addEventListener(THEME_EVENT, () => paint(current.get()));
  paint(state);
  element.replaceChildren(...children);
  upgrade(element);
});
