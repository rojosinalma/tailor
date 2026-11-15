import { clear } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { glyph, h, once, register } from "../runtime";

/** True while the focus is in a place that takes text, where / is a character. */
const isTyping = (element: Element | null): boolean =>
  element instanceof HTMLTextAreaElement ||
  element instanceof HTMLSelectElement ||
  (element instanceof HTMLInputElement &&
    !["button", "checkbox", "radio", "range", "submit"].includes(element.type)) ||
  (element instanceof HTMLElement && element.isContentEditable);

/** Adds the clear button, the / shortcut and Escape to a search field. */
register("search", (root) => {
  const input = root.querySelector<HTMLInputElement>("input.t-input-native");
  if (!input) return;
  const set = (next: string): void => {
    if (input.value === next) return;
    input.value = next;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const button = h(
    "button",
    {
      type: "button",
      class: "t-input-action t-search-clear",
      "aria-label": t("clear"),
      disabled: input.disabled,
    },
    glyph(clear),
  );
  button.addEventListener("click", () => {
    set("");
    input.focus();
  });
  root.append(button);
  if (root.dataset.shortcut !== "off") {
    root.setAttribute("data-shortcut", "");
    root.append(h("span", { class: "t-search-key", "aria-hidden": "true" }, "/"));
  }

  input.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (input.value) set("");
    else input.blur();
  });

  once("search-shortcut", () => {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "/" || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey)
        return;
      if (isTyping(document.activeElement)) return;
      const target = document.querySelector<HTMLInputElement>(
        '.t-search[data-shortcut=""] input.t-input-native:not(:disabled)',
      );
      if (!target) return;
      event.preventDefault();
      target.focus();
    });
  });
});
