import { close, upload } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { addFiles, formatSize, type Refusal, refusalText } from "@tailor/packs/pickers/file/logic";
import { glyph, h, register } from "../runtime";
import { fieldGroup } from "./date";

/** Draws a drop zone and a file list around a native <input type="file">, which stays in the form as the value holder. */
register("file", (element) => {
  if (!(element instanceof HTMLInputElement) || element.type !== "file") return;
  const input = element;
  const rules = {
    accept: input.accept || null,
    multiple: input.multiple,
    maxSize: Number(input.dataset.maxSize) || null,
    maxFiles: Number(input.dataset.maxFiles) || null,
  };
  const texts = { type: t("fileWrongType"), size: t("fileTooLarge"), count: t("fileTooMany") };
  const choose = h(
    "button",
    {
      type: "button",
      class: "t-btn",
      "data-size": "sm",
      disabled: input.disabled,
    },
    t(input.multiple ? "fileChoose" : "fileChooseOne"),
  );
  const hint = input.dataset.hint;
  const list = h("ul", { class: "t-file-list", hidden: true });
  const errors = h("div", { class: "t-file-errors", "aria-live": "polite" });
  const root = h(
    "div",
    {
      class: "t-file",
      role: "group",
      id: input.id || undefined,
      "aria-label": input.getAttribute("aria-label") ?? undefined,
      "aria-labelledby": input.getAttribute("aria-labelledby") ?? undefined,
      "aria-describedby": input.getAttribute("aria-describedby") ?? undefined,
      "aria-invalid": input.getAttribute("aria-invalid") ?? undefined,
      "aria-disabled": input.disabled ? "true" : undefined,
    },
    h(
      "div",
      { class: "t-file-zone" },
      h("span", { class: "t-file-icon" }, glyph(upload)),
      h(
        "div",
        { class: "t-file-text" },
        choose,
        h("span", { class: "t-file-hint" }, t(input.multiple ? "fileDrop" : "fileDropOne")),
        hint ? h("span", { class: "t-file-hint" }, hint) : null,
      ),
    ),
  );
  let files: File[] = [];
  let writing = false;

  const write = (): void => {
    const transfer = new DataTransfer();
    for (const file of files) transfer.items.add(file);
    input.files = transfer.files;
    list.hidden = files.length === 0;
    list.replaceChildren(
      ...files.map((file, index) => {
        const remove = h(
          "button",
          {
            type: "button",
            class: "t-btn t-file-remove",
            "data-variant": "ghost",
            "data-size": "sm",
            "data-icon-only": true,
            "aria-label": `${t("fileRemove")} ${file.name}`,
            disabled: input.disabled,
          },
          glyph(close),
        );
        remove.addEventListener("click", () => {
          files = files.filter((_, i) => i !== index);
          show([]);
          changed();
          const buttons = list.querySelectorAll<HTMLElement>(".t-file-remove");
          (buttons[Math.min(index, files.length - 1)] ?? choose).focus();
        });
        return h(
          "li",
          { class: "t-file-item" },
          h("span", { class: "t-file-name" }, file.name),
          h("span", { class: "t-file-size" }, formatSize(file.size)),
          remove,
        );
      }),
    );
  };
  const show = (refused: Refusal[]): void => {
    errors.replaceChildren(...refused.map((refusal) => h("p", {}, refusalText(refusal, texts))));
  };
  // Tells the form about files that came by a drop or left by a remove button.
  const changed = (): void => {
    write();
    writing = true;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    writing = false;
  };
  const add = (added: File[]): void => {
    const result = addFiles(files, added, rules);
    files = result.files;
    show(result.refused);
  };

  choose.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    if (writing) return;
    add([...(input.files ?? [])]);
    write();
  });
  root.addEventListener("dragover", (event) => {
    if (input.disabled) return;
    event.preventDefault();
    root.setAttribute("data-dragging", "");
  });
  root.addEventListener("dragleave", (event) => {
    if (!(event.relatedTarget instanceof Node && root.contains(event.relatedTarget)))
      root.removeAttribute("data-dragging");
  });
  root.addEventListener("drop", (event) => {
    event.preventDefault();
    root.removeAttribute("data-dragging");
    if (input.disabled) return;
    add([...(event.dataTransfer?.files ?? [])]);
    changed();
  });

  input.before(root);
  root.append(input, list, errors);
  input.hidden = true;
  input.tabIndex = -1;
  input.setAttribute("data-t-upgraded", "");
  // The group takes the input's id, so a <label for> names the group and its click focuses the button.
  input.removeAttribute("id");
  fieldGroup(root, () => choose);
  // A form check or the page's code marks the input or its field later: the group follows.
  const field = root.closest(".t-field");
  const follow = (): void => {
    const invalid = input.getAttribute("aria-invalid") === "true" || field?.hasAttribute("data-invalid");
    if (invalid) root.setAttribute("aria-invalid", "true");
    else root.removeAttribute("aria-invalid");
    const described = input.getAttribute("aria-describedby");
    if (described) root.setAttribute("aria-describedby", described);
    else root.removeAttribute("aria-describedby");
  };
  const watch = new MutationObserver(follow);
  watch.observe(input, { attributes: true, attributeFilter: ["aria-invalid", "aria-describedby"] });
  if (field) watch.observe(field, { attributes: true, attributeFilter: ["data-invalid"] });
});
