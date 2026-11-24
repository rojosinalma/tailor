import { check, chevronExpand, clear } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { customText, matches } from "@tailor/packs/core/combobox/logic";
import { createPopup } from "../popup";
import { glyph, h, register, uid } from "../runtime";

export interface Choice {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly disabled: boolean;
  readonly selected: boolean;
}

export interface ChoiceList {
  open(): void;
  close(): void;
  isOpen(): boolean;
  /** Shows the choices; "loading" shows the loading line instead of the empty line. */
  show(choices: readonly Choice[], loading: boolean): void;
  /** Moves the highlight: 1 or -1 steps, past the ends back to no highlight. */
  move(by: 1 | -1): void;
  highlighted(): Choice | undefined;
  /** Whether a node is inside the list. */
  contains(node: Node): boolean;
}

/**
 * The listbox under a text input: the shared popup, the options, the highlight that the input points at with
 * aria-activedescendant. The multi-select uses it too.
 */
export function createChoiceList(
  input: HTMLInputElement,
  anchor: HTMLElement,
  options: { part: string; multiple: boolean; onPick: (choice: Choice) => void; onClose?: () => void },
): ChoiceList {
  const listId = uid("t-list");
  const list = h("div", {
    class: "t-listbox",
    role: "listbox",
    id: listId,
    tabindex: "-1",
    "aria-multiselectable": options.multiple ? "true" : undefined,
  });
  const empty = h("div", { class: `${options.part}-empty` });
  const status = h("div", { class: `${options.part}-status`, role: "status" });
  const panel = h("div", { class: `t-popup ${options.part}-popup` }, status, empty, list);
  // A pointer press in the list keeps the focus in the input.
  panel.addEventListener("pointerdown", (event) => event.preventDefault());
  input.setAttribute("aria-controls", listId);
  input.setAttribute("aria-expanded", "false");

  let shown: readonly Choice[] = [];
  let items: HTMLElement[] = [];
  let active = -1;

  const popup = createPopup(anchor, panel, {
    onClose: () => {
      input.setAttribute("aria-expanded", "false");
      anchor.removeAttribute("data-popup-open");
      highlight(-1);
      options.onClose?.();
    },
  });

  function highlight(index: number): void {
    active = index;
    items.forEach((item, i) => {
      item.toggleAttribute("data-highlighted", i === index);
    });
    const item = items[index];
    if (!item) {
      input.removeAttribute("aria-activedescendant");
      return;
    }
    input.setAttribute("aria-activedescendant", item.id);
    item.scrollIntoView({ block: "nearest" });
  }

  return {
    open() {
      if (popup.isOpen()) return;
      // On a phone the list is a sheet over the lower part of the screen: the box moves to the top.
      if (matchMedia("(max-width: 40rem)").matches) anchor.scrollIntoView({ block: "start" });
      input.setAttribute("aria-expanded", "true");
      anchor.setAttribute("data-popup-open", "");
      popup.open();
      // The list opens at the chosen value (a time zone far down a long list), as the React kit's does.
      const chosen = items.find((item) => item.hasAttribute("data-selected"));
      for (let box = chosen?.parentElement; chosen && box && panel.contains(box); box = box.parentElement) {
        if (box.scrollHeight <= box.clientHeight) continue;
        const top = chosen.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
        box.scrollTop = top - (box.clientHeight - chosen.offsetHeight) / 2;
        break;
      }
    },
    close: () => popup.close(),
    isOpen: () => popup.isOpen(),
    show(choices, loading) {
      const keep = shown[active]?.value;
      shown = choices;
      items = choices.map((choice, index) => {
        const item = h(
          "div",
          {
            class: "t-option",
            role: "option",
            id: `${listId}-${index}`,
            "aria-selected": String(choice.selected),
            "aria-disabled": choice.disabled ? "true" : undefined,
            "data-selected": choice.selected,
          },
          h("span", { class: "t-option-check" }, choice.selected ? glyph(check) : null),
          h(
            "span",
            { class: "t-option-label" },
            choice.label,
            choice.description
              ? h("span", { class: `${options.part}-description` }, choice.description)
              : null,
          ),
        );
        item.addEventListener("click", () => {
          if (!choice.disabled) options.onPick(choice);
        });
        item.addEventListener("pointermove", () => {
          if (!choice.disabled && active !== index) highlight(index);
        });
        return item;
      });
      list.replaceChildren(...items);
      status.replaceChildren(
        ...(loading
          ? [h("span", { class: "t-spinner", "data-size": "sm", "aria-hidden": "true" }), t("loading")]
          : []),
      );
      empty.textContent = !loading && choices.length === 0 ? t("noResults") : "";
      highlight(choices.findIndex((c) => c.value === keep));
    },
    move(by) {
      // The input itself sits between the last and the first choice, as in Base UI.
      for (let i = active + by, n = 0; n <= shown.length; i += by, n++) {
        if (i < -1) i = shown.length - 1;
        if (i >= shown.length) i = -1;
        if (i === -1 || !shown[i]?.disabled) {
          highlight(i);
          return;
        }
      }
    },
    highlighted: () => shown[active],
    contains: (node) => panel.contains(node),
  };
}

/** True while the focus stays inside the box or its list. */
export const focusInside = (box: HTMLElement, list: ChoiceList, next: EventTarget | null): boolean =>
  next instanceof Node && (box.contains(next) || list.contains(next));

/** Takes over the label and the name of a native select for a drawn text input. */
export function adoptLabel(select: HTMLSelectElement, input: HTMLInputElement): void {
  for (const name of ["aria-label", "aria-labelledby", "aria-describedby", "aria-invalid"]) {
    const value = select.getAttribute(name);
    if (value !== null) input.setAttribute(name, value);
  }
  if (select.required) input.setAttribute("aria-required", "true");
  // The label points at the input from now on, so a click on it focuses the input.
  if (select.id) {
    input.id = select.id;
    select.removeAttribute("id");
  }
  input.disabled = select.disabled;
  select.setAttribute("data-t-upgraded", "");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
}

export const fire = (select: HTMLSelectElement): void => {
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
};

/** Draws a combobox over a native <select>, which stays in the form as the value holder. */
register("combobox", (element) => {
  if (!(element instanceof HTMLSelectElement) || element.multiple) return;
  const select = element;
  const allowCustom = select.hasAttribute("data-allow-custom");
  const input = h("input", {
    type: "text",
    class: "t-input-native",
    role: "combobox",
    "aria-autocomplete": "list",
    autocomplete: "off",
    spellcheck: "false",
    placeholder: select.dataset.placeholder,
  });
  const clearButton = h(
    "button",
    { type: "button", class: "t-input-action t-combobox-clear", tabindex: "-1", "aria-label": t("clear") },
    glyph(clear),
  );
  const trigger = h(
    "button",
    {
      type: "button",
      class: "t-input-action t-combobox-trigger",
      tabindex: "-1",
      "aria-label": t("showOptions"),
    },
    glyph(chevronExpand),
  );
  const box = h(
    "div",
    {
      class: "t-control t-input-group t-combobox",
      role: "group",
      "data-size": select.dataset.size,
      "data-invalid": select.getAttribute("aria-invalid") === "true",
      "data-disabled": select.disabled,
    },
    input,
    clearButton,
    trigger,
  );
  adoptLabel(select, input);
  clearButton.disabled = select.disabled;
  trigger.disabled = select.disabled;

  const choices = (query: string): Choice[] =>
    [...select.options]
      .filter((o) => o.value !== "" && matches(o.label, query))
      .map((o) => ({
        value: o.value,
        label: o.label,
        description: o.dataset.description,
        disabled: o.disabled,
        selected: o.selected,
      }));
  const selectedLabel = (): string => (select.value === "" ? "" : (select.selectedOptions[0]?.label ?? ""));
  const paint = (): void => {
    input.value = selectedLabel();
    clearButton.hidden = select.value === "";
  };
  const setValue = (value: string): void => {
    if (select.value === value) return;
    select.value = value;
    fire(select);
  };

  const list = createChoiceList(input, box, {
    part: "t-combobox",
    multiple: false,
    onPick: (choice) => {
      setValue(choice.value);
      list.close();
      paint();
      input.focus();
    },
  });
  // The list shows every choice when it opens, and filters by what is typed after that.
  const refresh = (query: string): void => list.show(choices(query), select.hasAttribute("data-loading"));
  const open = (): void => {
    if (input.disabled) return;
    if (!list.isOpen()) refresh("");
    list.open();
  };

  input.addEventListener("click", open);
  trigger.addEventListener("click", () => {
    if (list.isOpen()) list.close();
    else open();
    input.focus();
  });
  clearButton.addEventListener("click", () => {
    setValue("");
    paint();
    input.focus();
  });
  input.addEventListener("input", () => {
    refresh(input.value);
    list.open();
  });
  input.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    const { key } = event;
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      if (!list.isOpen()) open();
      list.move(key === "ArrowDown" ? 1 : -1);
    } else if (key === "Enter") {
      if (!list.isOpen()) return;
      event.preventDefault();
      const choice = list.highlighted();
      if (choice) {
        setValue(choice.value);
      } else if (allowCustom) {
        const typed = customText(input.value, choices(""));
        if (typed !== null) {
          select.append(new Option(typed, typed));
          setValue(typed);
        }
      }
      list.close();
      paint();
    } else if (key === "Escape") {
      // The popup closes itself on the first Escape; a second one clears the value.
      event.preventDefault();
      setValue("");
      paint();
    } else if (key === "Tab") {
      list.close();
    }
  });
  box.addEventListener("focusout", (event) => {
    if (focusInside(box, list, event.relatedTarget)) return;
    list.close();
    paint();
  });
  select.addEventListener("change", paint);

  select.after(box);
  paint();
});
