import { chevronExpand, close } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { customText, matches } from "@tailor/packs/core/combobox/logic";
import { glyph, h, register } from "../runtime";
import { adoptLabel, type Choice, createChoiceList, fire, focusInside } from "./combobox";

/** Draws a multi-select over a native <select multiple>, which stays in the form as the value holder. */
register("multi-select", (element) => {
  if (!(element instanceof HTMLSelectElement) || !element.multiple) return;
  const select = element;
  const allowCustom = select.hasAttribute("data-allow-custom");
  const max = select.dataset.max ? Number(select.dataset.max) : Infinity;
  const placeholder = select.dataset.placeholder ?? "";

  const input = h("input", {
    type: "text",
    class: "t-multi-select-input",
    role: "combobox",
    "aria-autocomplete": "list",
    autocomplete: "off",
    spellcheck: "false",
  });
  const chips = h("div", { class: "t-multi-select-chips" }, input);
  const trigger = h(
    "button",
    {
      type: "button",
      class: "t-input-action t-multi-select-trigger",
      tabindex: "-1",
      "aria-label": t("showOptions"),
    },
    glyph(chevronExpand),
  );
  const box = h(
    "div",
    {
      class: "t-control t-multi-select",
      role: "group",
      "data-size": select.dataset.size,
      "data-invalid": select.getAttribute("aria-invalid") === "true",
      "data-disabled": select.disabled,
    },
    chips,
    trigger,
  );
  adoptLabel(select, input);
  trigger.disabled = select.disabled;

  const picked = (): HTMLOptionElement[] => [...select.selectedOptions];
  const choices = (query: string): Choice[] => {
    const full = picked().length >= max;
    return [...select.options]
      .filter((o) => matches(o.label, query))
      .map((o) => ({
        value: o.value,
        label: o.label,
        description: o.dataset.description,
        disabled: o.disabled || (full && !o.selected),
        selected: o.selected,
      }));
  };

  const list = createChoiceList(input, box, {
    part: "t-multi-select",
    multiple: true,
    onPick: (choice) => {
      toggle(choice.value);
      input.focus();
    },
  });
  const refresh = (): void => list.show(choices(input.value), select.hasAttribute("data-loading"));

  const chipFor = (option: HTMLOptionElement): HTMLElement => {
    const remove = h(
      "button",
      {
        type: "button",
        class: "t-chip-remove",
        tabindex: "-1",
        "aria-label": t("removeItem").replace("{label}", option.label),
        // As Base UI: a disabled chip stays in the page's reading order, marked, not removed from it.
        "aria-disabled": select.disabled ? "true" : undefined,
        "data-disabled": select.disabled,
      },
      glyph(close),
    );
    const chip = h(
      "div",
      {
        class: "t-chip",
        tabindex: "-1",
        "aria-disabled": select.disabled ? "true" : undefined,
        "data-disabled": select.disabled,
      },
      h("span", { class: "t-chip-label" }, option.label),
      remove,
    );
    remove.addEventListener("click", () => {
      if (select.disabled) return;
      unpick(option);
      input.focus();
    });
    chip.addEventListener("keydown", (event) => {
      const all = [...chips.querySelectorAll<HTMLElement>(".t-chip")];
      const at = all.indexOf(chip);
      if (event.key === "ArrowLeft") (all[at - 1] ?? chip).focus();
      else if (event.key === "ArrowRight") (all[at + 1] ?? input).focus();
      else if (event.key === "Backspace" || event.key === "Delete") {
        unpick(option);
        // The chips are drawn again: the one that took this place gets the focus.
        (chips.querySelectorAll<HTMLElement>(".t-chip")[at] ?? input).focus();
      } else return;
      event.preventDefault();
    });
    return chip;
  };

  const paint = (): void => {
    const options = picked();
    // The input stays where it is, so it keeps the focus.
    for (const chip of chips.querySelectorAll(".t-chip")) chip.remove();
    input.before(...options.map(chipFor));
    input.placeholder = options.length > 0 ? "" : placeholder;
    if (list.isOpen()) refresh();
  };
  const unpick = (option: HTMLOptionElement): void => {
    option.selected = false;
    fire(select);
    paint();
  };
  const toggle = (value: string): void => {
    const option = [...select.options].find((o) => o.value === value);
    if (!option || option.disabled) return;
    if (!option.selected && picked().length >= max) return;
    option.selected = !option.selected;
    fire(select);
    paint();
  };
  const open = (): void => {
    if (input.disabled) return;
    if (!list.isOpen()) refresh();
    list.open();
  };

  input.addEventListener("click", open);
  box.addEventListener("pointerdown", (event) => {
    if (event.target === box || event.target === chips) {
      event.preventDefault();
      input.focus();
    }
  });
  trigger.addEventListener("click", () => {
    if (list.isOpen()) list.close();
    else open();
    input.focus();
  });
  input.addEventListener("input", () => {
    refresh();
    list.open();
  });
  input.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    const { key } = event;
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      if (!list.isOpen()) open();
      list.move(key === "ArrowDown" ? 1 : -1);
    } else if (key === "Enter") {
      if (!list.isOpen()) return;
      event.preventDefault();
      const choice = list.highlighted();
      if (choice) toggle(choice.value);
      else if (allowCustom && picked().length < max) {
        const typed = customText(input.value, choices(""));
        if (typed === null) return;
        select.append(new Option(typed, typed, true, true));
        input.value = "";
        fire(select);
        paint();
      }
    } else if (key === "Backspace" && input.value === "") {
      const last = picked().at(-1);
      if (last) unpick(last);
    } else if (key === "ArrowLeft" && atStart) {
      const last = chips.querySelector<HTMLElement>(".t-chip:last-of-type");
      if (!last) return;
      event.preventDefault();
      list.close();
      last.focus();
    } else if (key === "Escape") {
      // The popup closes itself on the first Escape; a second one clears every value, as in Base UI.
      event.preventDefault();
      if (picked().length === 0) return;
      for (const option of picked()) option.selected = false;
      fire(select);
      paint();
    } else if (key === "Tab") {
      list.close();
    }
  });
  box.addEventListener("focusout", (event) => {
    if (focusInside(box, list, event.relatedTarget)) return;
    list.close();
    input.value = "";
  });
  select.addEventListener("change", paint);

  select.after(box);
  paint();
});
