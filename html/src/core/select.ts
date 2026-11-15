import { check, chevronExpand } from "@tailor/core/glyphs.gen";
import { createPopup } from "../popup";
import { glyph, h, register, uid } from "../runtime";

/** Draws a tailor select over a native <select>, which stays in the form as the value holder. */
register("select", (element) => {
  if (!(element instanceof HTMLSelectElement) || element.multiple) return;
  const select = element;
  const listId = uid("t-list");
  const placeholder = select.dataset.placeholder ?? "";

  const value = h("span", { class: "t-select-value" });
  const trigger = h(
    "button",
    {
      type: "button",
      class: "t-control t-select-trigger",
      role: "combobox",
      "aria-haspopup": "listbox",
      "aria-expanded": "false",
      "aria-controls": listId,
      "data-size": select.dataset.size,
      "aria-label": select.getAttribute("aria-label") ?? undefined,
      "aria-labelledby": select.getAttribute("aria-labelledby") ?? undefined,
      disabled: select.disabled,
    },
    value,
    h("span", { class: "t-select-icon" }, glyph(chevronExpand)),
  );
  const label = select.labels?.[0];
  if (label && !trigger.hasAttribute("aria-label") && !trigger.hasAttribute("aria-labelledby")) {
    label.id ||= uid("t-label");
    trigger.setAttribute("aria-labelledby", label.id);
    label.addEventListener("click", (event) => {
      event.preventDefault();
      trigger.focus();
    });
  }

  const list = h("div", { class: "t-listbox", role: "listbox", id: listId, tabindex: "-1" });
  const panel = h("div", { class: "t-popup t-select-popup" }, list);
  const popup = createPopup(trigger, panel, {
    onClose: () => {
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("data-popup-open");
      trigger.removeAttribute("aria-activedescendant");
    },
  });

  const choices = (): HTMLOptionElement[] => [...select.options].filter((o) => !o.hidden && o.value !== "");
  let items: HTMLElement[] = [];
  let active = -1;

  const paint = (): void => {
    const current = select.selectedOptions[0];
    const empty = !current || current.value === "";
    value.textContent = empty ? placeholder : current.label;
    value.toggleAttribute("data-placeholder", empty);
  };

  const highlight = (index: number): void => {
    active = index;
    items.forEach((item, i) => {
      item.toggleAttribute("data-highlighted", i === index);
    });
    const item = items[index];
    if (!item) return;
    trigger.setAttribute("aria-activedescendant", item.id);
    item.scrollIntoView({ block: "nearest" });
  };

  const step = (from: number, by: number): number => {
    for (let i = from + by; i >= 0 && i < items.length; i += by) {
      if (items[i]?.getAttribute("aria-disabled") !== "true") return i;
    }
    return from;
  };

  const choose = (index: number): void => {
    const option = choices()[index];
    if (!option || option.disabled) return;
    if (select.value !== option.value) {
      select.value = option.value;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    paint();
    popup.close();
    trigger.focus();
  };

  const open = (): void => {
    if (select.disabled || popup.isOpen()) return;
    items = choices().map((option, index) => {
      const selected = option.selected;
      const item = h(
        "div",
        {
          class: "t-option",
          role: "option",
          id: `${listId}-${index}`,
          "aria-selected": String(selected),
          "aria-disabled": option.disabled ? "true" : undefined,
          "data-selected": selected,
        },
        h("span", { class: "t-option-check" }, selected ? glyph(check) : null),
        h("span", { class: "t-option-label" }, option.label),
      );
      item.addEventListener("click", () => choose(index));
      item.addEventListener("pointermove", () => {
        if (!option.disabled && active !== index) highlight(index);
      });
      return item;
    });
    list.replaceChildren(...items);
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("data-popup-open", "");
    popup.open();
    const selectedIndex = items.findIndex((item) => item.hasAttribute("data-selected"));
    highlight(selectedIndex >= 0 ? selectedIndex : step(-1, 1));
  };

  let typed = "";
  let typedAt = 0;
  const typeAhead = (key: string): void => {
    const now = Date.now();
    typed = now - typedAt > 600 ? key : typed + key;
    typedAt = now;
    const index = choices().findIndex(
      (o) => !o.disabled && o.label.toLowerCase().startsWith(typed.toLowerCase()),
    );
    if (index < 0) return;
    if (popup.isOpen()) highlight(index);
    else choose(index);
  };

  trigger.addEventListener("click", () => (popup.isOpen() ? popup.close() : open()));
  trigger.addEventListener("keydown", (event) => {
    const { key } = event;
    if (!popup.isOpen()) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
        event.preventDefault();
        open();
      } else if (key.length === 1 && !event.ctrlKey && !event.metaKey) typeAhead(key);
      return;
    }
    if (key === "ArrowDown") highlight(step(active, 1));
    else if (key === "ArrowUp") highlight(step(active, -1));
    else if (key === "Home") highlight(step(-1, 1));
    else if (key === "End") highlight(step(items.length, -1));
    else if (key === "Enter" || key === " ") choose(active);
    else if (key === "Tab") {
      popup.close();
      return;
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey) typeAhead(key);
    else return;
    event.preventDefault();
  });

  select.addEventListener("change", paint);
  select.setAttribute("data-t-upgraded", "");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
  select.after(trigger);
  paint();
});
