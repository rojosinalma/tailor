import { danger, plus, trash } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  duplicateKeys,
  isSecretKey,
  joinPairs,
  type Pair,
  parsePairs,
  pastedPairs,
} from "@tailor/packs/forms/key-value-editor/logic";
import { glyph, h, register, uid, upgrade } from "../runtime";
import { iconButton } from "./list-editor";

/** Upgrades a <textarea data-t="key-value-editor"> of KEY=value lines, which stays the value holder. */
register("key-value-editor", (element) => {
  if (!(element instanceof HTMLTextAreaElement)) return;
  const holder = element;
  const label = holder.getAttribute("aria-label") ?? "";
  const { keyPlaceholder, valuePlaceholder } = holder.dataset;
  const secretWords = holder.dataset.secretKeys?.split(/\s+/);
  const firstId = holder.id || uid("t-kv");
  holder.removeAttribute("id");
  const pairs: Pair[] = parsePairs(holder.value);

  const list = h("ul", { class: "t-kv-editor-list" });
  const addButton = h(
    "button",
    { type: "button", class: "t-btn", "data-part": "add", disabled: holder.disabled },
    glyph(plus),
    h("span", { class: "t-btn-label" }, t("listAdd")),
  );
  const root = h("fieldset", { class: "t-kv-editor", "aria-label": label }, list, addButton);

  const sync = (): void => {
    const text = joinPairs(pairs);
    if (holder.value === text) return;
    holder.value = text;
    holder.dispatchEvent(new Event("input", { bubbles: true }));
    holder.dispatchEvent(new Event("change", { bubbles: true }));
  };

  /** Marks the keys used twice. */
  const mark = (): void => {
    const twice = duplicateKeys(pairs);
    [...list.children].forEach((row, index) => {
      const key = row.querySelector<HTMLInputElement>(".t-kv-editor-key input");
      const duplicate = twice.has(pairs[index]?.key.trim() ?? "");
      const error = row.querySelector(".t-kv-editor-error");
      if (!key) return;
      if (duplicate && !error) {
        const errorId = uid("t-kv-error");
        row.append(
          h("p", { class: "t-kv-editor-error", id: errorId }, glyph(danger), h("span", {}, t("kvDuplicate"))),
        );
        key.setAttribute("aria-invalid", "true");
        key.setAttribute("aria-describedby", errorId);
      } else if (!duplicate && error) {
        error.remove();
        key.removeAttribute("aria-invalid");
        key.removeAttribute("aria-describedby");
      }
    });
  };

  const valueControl = (index: number): HTMLElement => {
    const pair = pairs[index];
    const secret = isSecretKey(pair?.key ?? "", secretWords);
    const input = h("input", {
      type: secret ? "password" : "text",
      class: secret ? "t-input-native" : "t-control t-input",
      "aria-label": `${t("kvValue")} ${index + 1}`,
      placeholder: valuePlaceholder,
      autocomplete: "off",
      spellcheck: secret ? "false" : undefined,
      disabled: holder.disabled,
    });
    input.value = pair?.value ?? "";
    input.addEventListener("input", () => {
      const current = pairs[index];
      if (current) pairs[index] = { ...current, value: input.value };
      sync();
    });
    return secret
      ? h("div", { class: "t-control t-input-group t-secret", "data-t": "secret" }, input)
      : input;
  };

  const render = (focus?: string): void => {
    list.replaceChildren(
      ...pairs.map((pair, index) => {
        const n = index + 1;
        const key = h("input", {
          type: "text",
          class: "t-control t-input",
          id: index === 0 ? firstId : undefined,
          "aria-label": `${t("kvKey")} ${n}`,
          placeholder: keyPlaceholder,
          autocomplete: "off",
          disabled: holder.disabled,
        });
        key.value = pair.key;
        const valueBox = h("div", { class: "t-kv-editor-value" }, valueControl(index));
        key.addEventListener("input", () => {
          const current = pairs[index];
          if (!current) return;
          const wasSecret = isSecretKey(current.key, secretWords);
          pairs[index] = { ...current, key: key.value };
          if (wasSecret !== isSecretKey(key.value, secretWords)) {
            valueBox.replaceChildren(valueControl(index));
            upgrade(valueBox);
          }
          sync();
          mark();
        });
        key.addEventListener("paste", (event) => {
          const pasted = pastedPairs(event.clipboardData?.getData("text") ?? "");
          if (!pasted) return;
          event.preventDefault();
          pairs.splice(index, 1, ...pasted);
          sync();
          render(`li:nth-child(${index + pasted.length}) .t-kv-editor-value input`);
        });
        const remove = iconButton(trash, `${t("kvRemove")} ${n}`);
        remove.disabled = holder.disabled;
        remove.addEventListener("click", () => {
          pairs.splice(index, 1);
          sync();
          if (pairs.length === 0) {
            render();
            addButton.focus();
          } else render(`li:nth-child(${Math.min(index, pairs.length - 1) + 1}) .t-kv-editor-key input`);
        });
        return h(
          "li",
          { class: "t-kv-editor-row" },
          h("div", { class: "t-kv-editor-key" }, key),
          valueBox,
          remove,
        );
      }),
    );
    list.hidden = pairs.length === 0;
    upgrade(list);
    mark();
    if (focus) list.querySelector<HTMLElement>(focus)?.focus();
  };

  addButton.addEventListener("click", () => {
    pairs.push({ key: "", value: "" });
    render(`li:last-child .t-kv-editor-key input`);
  });

  holder.setAttribute("data-t-upgraded", "");
  holder.tabIndex = -1;
  holder.setAttribute("aria-hidden", "true");
  holder.removeAttribute("aria-label");
  holder.after(root);
  render();
});
