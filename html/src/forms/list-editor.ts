import { arrowDown, arrowUp, plus, trash } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { canAdd, joinLines, moveItem, parseLines } from "@tailor/packs/forms/list-editor/logic";
import { glyph, h, register, uid, upgrade } from "../runtime";

interface Option {
  readonly value: string;
  readonly label: string;
}

const readOptions = (json: string | undefined): Option[] | null => {
  if (!json) return null;
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) return null;
  return parsed.filter(
    (o): o is Option => typeof o === "object" && o !== null && "value" in o && "label" in o,
  );
};

export const iconButton = (body: string, label: string, part?: string): HTMLButtonElement =>
  h(
    "button",
    {
      type: "button",
      class: "t-btn",
      "data-variant": "ghost",
      "data-icon-only": "",
      "aria-label": label,
      "data-part": part,
    },
    glyph(body),
  );

/** Upgrades a <textarea data-t="list-editor"> with one value per line, which stays the value holder. */
register("list-editor", (element) => {
  if (!(element instanceof HTMLTextAreaElement)) return;
  const holder = element;
  const label = holder.getAttribute("aria-label") ?? "";
  const options = readOptions(holder.dataset.options);
  const placeholder = holder.dataset.placeholder;
  const max = holder.dataset.max ? Number(holder.dataset.max) : undefined;
  const firstId = holder.id || uid("t-list");
  holder.removeAttribute("id");
  let items = parseLines(holder.value);

  const list = h("ul", { class: "t-list-editor-list" });
  const addButton = h(
    "button",
    { type: "button", class: "t-btn", "data-part": "add" },
    glyph(plus),
    h("span", { class: "t-btn-label" }, t("listAdd")),
  );
  const root = h("fieldset", { class: "t-list-editor", "aria-label": label }, list, addButton);

  const sync = (): void => {
    const text = joinLines(items);
    if (holder.value === text) return;
    holder.value = text;
    holder.dispatchEvent(new Event("input", { bubbles: true }));
    holder.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const control = (index: number, value: string, rowName: string): HTMLElement => {
    const id = index === 0 ? firstId : undefined;
    if (!options) {
      const input = h("input", {
        type: "text",
        class: "t-control t-input",
        id,
        "aria-label": rowName,
        placeholder,
        autocomplete: "off",
        disabled: holder.disabled,
      });
      input.value = value;
      input.addEventListener("input", () => {
        items[index] = input.value;
        sync();
      });
      return input;
    }
    const select = h(
      "select",
      {
        class: "t-control t-select",
        "data-t": "select",
        id,
        "aria-label": rowName,
        "data-placeholder": placeholder ?? t("nothingSelected"),
        disabled: holder.disabled,
      },
      h("option", { value: "", hidden: true }, placeholder ?? t("nothingSelected")),
      ...options.map((o) =>
        h(
          "option",
          {
            value: o.value,
            selected: o.value === value,
            disabled: o.value !== value && items.includes(o.value),
          },
          o.label,
        ),
      ),
    );
    select.addEventListener("change", () => {
      items[index] = select.value;
      sync();
      // A value that one row holds cannot be picked in another.
      for (const other of list.querySelectorAll("select"))
        for (const option of other.options)
          if (option.value) option.disabled = option.value !== other.value && items.includes(option.value);
    });
    return select;
  };

  const render = (focus?: { index: number; part: string }): void => {
    list.replaceChildren(
      ...items.map((value, index) => {
        const rowName = `${label} ${index + 1}`;
        const up = iconButton(arrowUp, `${t("listMoveUp")} ${rowName}`, "up");
        const down = iconButton(arrowDown, `${t("listMoveDown")} ${rowName}`, "down");
        const remove = iconButton(trash, `${t("listRemove")} ${rowName}`);
        up.disabled = holder.disabled || index === 0;
        down.disabled = holder.disabled || index === items.length - 1;
        remove.disabled = holder.disabled;
        const move = (by: -1 | 1): void => {
          const to = index + by;
          items = moveItem(items, index, to);
          sync();
          const edge = to === 0 || to === items.length - 1;
          render({ index: to, part: edge ? (by < 0 ? "down" : "up") : by < 0 ? "up" : "down" });
        };
        up.addEventListener("click", () => move(-1));
        down.addEventListener("click", () => move(1));
        remove.addEventListener("click", () => {
          items.splice(index, 1);
          sync();
          render(items.length > 0 ? { index: Math.min(index, items.length - 1), part: "item" } : undefined);
          if (items.length === 0) addButton.focus();
        });
        return h(
          "li",
          { class: "t-list-editor-row" },
          h("div", { class: "t-list-editor-item" }, control(index, value, rowName)),
          up,
          down,
          remove,
        );
      }),
    );
    list.hidden = items.length === 0;
    addButton.disabled = holder.disabled || !canAdd(items.length, max);
    upgrade(list);
    if (!focus) return;
    const row = list.children[focus.index];
    const target =
      focus.part === "item"
        ? row?.querySelector<HTMLElement>(".t-list-editor-item .t-control:not([data-t-upgraded])")
        : row?.querySelector<HTMLElement>(`[data-part="${focus.part}"]`);
    target?.focus();
  };

  addButton.addEventListener("click", () => {
    items.push("");
    render({ index: items.length - 1, part: "item" });
  });

  holder.setAttribute("data-t-upgraded", "");
  holder.tabIndex = -1;
  holder.setAttribute("aria-hidden", "true");
  holder.removeAttribute("aria-label");
  holder.after(root);
  render();
});
