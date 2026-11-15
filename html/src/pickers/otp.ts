import { t } from "@tailor/core/text";
import { codeKey, normalizeCode, removeCode, replaceCode, slotFor } from "@tailor/packs/pickers/otp/logic";
import { h, register } from "../runtime";
import { hideNative } from "./date";

/** Draws one box per character over a native one-time code input, which stays in the form as the value holder. */
register("otp", (element) => {
  if (!(element instanceof HTMLInputElement)) return;
  const input = element;
  const length = input.maxLength > 0 ? input.maxLength : 6;
  const numeric = input.inputMode !== "text";
  const label = input.getAttribute("aria-label") ?? undefined;
  const describedBy = input.getAttribute("aria-describedby") ?? undefined;
  const slots = Array.from({ length }, (_, i) =>
    h("input", {
      class: "t-control t-otp-input",
      type: "text",
      inputmode: numeric ? "numeric" : "text",
      autocomplete: i === 0 ? input.autocomplete || "one-time-code" : "off",
      autocorrect: "off",
      spellcheck: "false",
      enterkeyhint: i === length - 1 ? "done" : "next",
      maxlength: i === 0 ? String(length) : undefined,
      id: i === 0 && input.id ? input.id : undefined,
      "aria-label": i === 0 ? label : `${t("otpCharacter")} ${i + 1} ${t("of")} ${length}`,
      "aria-describedby": i === 0 ? describedBy : undefined,
      "aria-invalid": input.getAttribute("aria-invalid") ?? undefined,
      required: input.required,
      disabled: input.disabled,
    }),
  );
  const root = h(
    "div",
    {
      class: "t-otp",
      role: "group",
      "aria-label": label,
      "aria-describedby": describedBy,
      "data-size": input.dataset.size,
      "data-disabled": input.disabled,
    },
    ...slots,
  );
  let code = normalizeCode(input.value, length, numeric);

  const paint = (): void => {
    const active = slotFor(code, length, length);
    slots.forEach((slot, i) => {
      slot.value = code[i] ?? "";
      slot.toggleAttribute("data-filled", i < code.length);
      if (!root.contains(document.activeElement)) slot.tabIndex = i === active ? 0 : -1;
    });
    root.toggleAttribute("data-complete", code.length === length);
  };
  const focus = (index: number): void => {
    const slot = slots[slotFor(code, index, length)];
    if (!slot) return;
    for (const other of slots) other.tabIndex = other === slot ? 0 : -1;
    slot.focus();
    slot.select();
  };
  const commit = (next: string, to: number): void => {
    if (next !== code) {
      code = next;
      input.value = code;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    paint();
    focus(to);
  };

  slots.forEach((slot, index) => {
    slot.addEventListener("mousedown", (event) => {
      if (input.disabled) return;
      event.preventDefault();
      focus(index);
    });
    slot.addEventListener("focus", () => {
      if (index > code.length) focus(code.length);
      else slot.select();
    });
    slot.addEventListener("input", () => {
      const raw = slot.value;
      if (raw === "") return commit(removeCode(code, index), index);
      const added = normalizeCode(raw, length, numeric);
      if (!added) {
        slot.value = code[index] ?? "";
        return slot.select();
      }
      commit(replaceCode(code, index, added, length, numeric), index + added.length);
    });
    slot.addEventListener("paste", (event) => {
      event.preventDefault();
      const added = normalizeCode(event.clipboardData?.getData("text/plain") ?? "", length, numeric);
      if (added) commit(replaceCode(code, index, added, length, numeric), index + added.length);
    });
    slot.addEventListener("keydown", (event) => {
      if (event.key.length === 1 && slot.selectionStart === 0 && slot.value === event.key) {
        event.preventDefault();
        return focus(index + 1);
      }
      const move = codeKey(code, index, event.key, length);
      if (!move) return;
      event.preventDefault();
      commit(move.code, move.focus);
    });
  });

  const id = input.id;
  input.removeAttribute("id");
  hideNative(input);
  input.before(root);
  paint();
  // Inside a Field the label names the first box (by its id) and the group.
  if (id && !label) {
    const named = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`);
    if (named) {
      named.id ||= `${id}-label`;
      root.setAttribute("aria-labelledby", named.id);
    }
  }
});
