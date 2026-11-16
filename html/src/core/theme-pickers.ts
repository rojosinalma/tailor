import { close, moon, palette as paletteGlyph, sun } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { createTheme, THEME_EVENT, type Theme, type ThemeConfig, type ThemeState } from "@tailor/core/theme";
import { themeChoices, themeSummary } from "@tailor/packs/core/theme-pickers/logic";
import { glyph, h, once, register, uid, upgrade } from "../runtime";

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

type ChoicePart = "skin" | "palette";

/** A select of a skin or a palette; without a label, a field around it names it. */
function choiceSelect(
  theme: Theme,
  part: ChoicePart,
  size: string | undefined,
  label?: string,
): HTMLSelectElement {
  const state = theme.get();
  const select = h(
    "select",
    { class: "t-control t-select", "data-t": "select", "data-size": size, "aria-label": label },
    ...themeChoices(theme.config, part).map((choice) =>
      h("option", { value: choice.value, selected: choice.value === state[part] }, choice.label),
    ),
  );
  select.addEventListener("change", () => theme.set({ [part]: select.value }));
  return select;
}

/** A select in a field with a visible label, as the React kit's Field draws it. */
function field(label: string, select: HTMLSelectElement): HTMLElement {
  const id = uid("t-field");
  select.id = id;
  return h(
    "div",
    { class: "t-field" },
    h("label", { class: "t-field-label", for: id, id: `${id}-label` }, label),
    h("div", { class: "t-field-control" }, select),
    h("p", { class: "t-field-error", id: `${id}-error`, "aria-live": "polite" }),
  );
}

/**
 * Compact: one button with the current skin and palette opens their selects in a popover (the popover
 * script); the mode button stays beside it.
 */
function compact(theme: Theme, choices: ChoicePart[], size: string | undefined) {
  const id = uid("t-theme");
  const value = h("span", { class: "t-btn-label" });
  const trigger = h(
    "button",
    {
      type: "button",
      class: "t-btn t-theme-pickers-trigger",
      "data-variant": "ghost",
      "data-size": size,
      "data-t": "popover",
      "data-t-popover": id,
      "data-side": "top",
    },
    glyph(paletteGlyph),
    value,
  );
  const selects = choices.map((part) => [choiceSelect(theme, part, undefined), part] as const);
  const panel = h(
    "div",
    { class: "t-popup t-popover", id, role: "dialog", "aria-labelledby": `${id}-title`, hidden: true },
    h("h2", { class: "t-popover-title", id: `${id}-title` }, t("theme")),
    h(
      "button",
      { type: "button", class: "t-popover-close", "aria-label": t("close"), "data-t-close": true },
      glyph(close),
    ),
    h(
      "div",
      { class: "t-popover-body" },
      h("div", { class: "t-stack" }, ...selects.map(([select, part]) => field(t(part), select))),
    ),
  );
  const paint = (state: ThemeState): void => {
    const names = themeSummary(theme.config, state, choices);
    value.textContent = names.join(" · ") || t("theme");
    trigger.setAttribute("aria-label", `${t("theme")}: ${names.join(", ")}`);
  };
  return { nodes: [trigger, panel], selects, paint };
}

register("theme-pickers", (element) => {
  if (!theme) return;
  const current = theme;
  const wanted = (element.dataset.parts ?? PARTS.join(" ")).split(/\s+/);
  const size = element.dataset.size ?? "sm";
  const dataSize = size === "md" ? undefined : size;

  const shown = PARTS.filter((part) => wanted.includes(part));
  const choices = shown.filter((part): part is ChoicePart => part !== "mode");
  const mode = h("button", {
    type: "button",
    class: "t-btn t-theme-mode",
    "data-variant": "ghost",
    "data-size": dataSize,
    "data-icon-only": true,
  });

  // A compact root with no skin and no palette shows the mode button only, as the inline form does.
  const form =
    element.dataset.layout === "compact" && choices.length > 0 ? compact(current, choices, dataSize) : null;
  const selects = form
    ? form.selects
    : choices.map((part) => [choiceSelect(current, part, dataSize, t(part)), part] as const);
  const children = form
    ? [...form.nodes, ...(shown.includes("mode") ? [mode] : [])]
    : shown.map((part) => (part === "mode" ? mode : (selects[choices.indexOf(part)]?.[0] ?? mode)));

  const paint = (state: ThemeState): void => {
    for (const [select, part] of selects) {
      if (select.value === state[part]) continue;
      select.value = state[part];
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const dark = state.mode === "dark";
    mode.setAttribute("aria-label", dark ? t("lightMode") : t("darkMode"));
    mode.replaceChildren(glyph(dark ? sun : moon));
    form?.paint(state);
  };

  mode.addEventListener("click", () =>
    current.set({ mode: current.get().mode === "dark" ? "light" : "dark" }),
  );
  document.addEventListener(THEME_EVENT, () => paint(current.get()));
  paint(current.get());
  element.replaceChildren(...children);
  // The selects first, while their labels are in the page: the popover script takes its panel out of it.
  for (const [select] of selects) upgrade(select);
  upgrade(element);
});
