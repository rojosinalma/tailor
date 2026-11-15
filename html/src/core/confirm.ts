import { t } from "@tailor/core/text";
import { h, register, uid } from "../runtime";

export interface ConfirmOptions {
  readonly title: string;
  readonly text?: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly danger?: boolean;
}

interface Parts {
  readonly dialog: HTMLDialogElement;
  readonly title: HTMLElement;
  readonly body: HTMLElement;
  readonly text: HTMLElement;
  readonly cancel: HTMLButtonElement;
  readonly ok: HTMLButtonElement;
}

let parts: Parts | null = null;
let settle: ((confirmed: boolean) => void) | null = null;

const answer = (confirmed: boolean): void => {
  const done = settle;
  settle = null;
  parts?.dialog.close();
  done?.(confirmed);
};

/** One dialog for every question, built on the first one. */
function build(): Parts {
  if (parts?.dialog.isConnected) return parts;
  const titleId = uid("t-confirm-title");
  const textId = uid("t-confirm-text");
  const title = h("h2", { class: "t-dialog-title", id: titleId });
  const text = h("p", { id: textId });
  const body = h("div", { class: "t-dialog-body" }, text);
  const cancel = h("button", { type: "button", class: "t-btn" });
  const ok = h("button", { type: "button", class: "t-btn" });
  const dialog = h(
    "dialog",
    {
      class: "t-dialog",
      "data-variant": "confirm",
      role: "alertdialog",
      "aria-labelledby": titleId,
      "aria-describedby": textId,
    },
    h("header", { class: "t-dialog-header" }, title),
    body,
    h("footer", { class: "t-dialog-footer" }, cancel, ok),
  );
  cancel.addEventListener("click", () => answer(false));
  ok.addEventListener("click", () => answer(true));
  // Escape and a click on the backdrop (the dialog element itself) cancel.
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    answer(false);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) answer(false);
  });
  document.body.append(dialog);
  parts = { dialog, title, body, text, cancel, ok };
  return parts;
}

/** Asks a question before a destructive or irreversible action. Resolves true when the user confirms. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  const p = build();
  settle?.(false);
  p.title.textContent = options.title;
  p.text.textContent = options.text ?? "";
  p.body.hidden = !options.text;
  p.cancel.textContent = options.cancelLabel ?? t("cancel");
  p.ok.textContent = options.confirmLabel ?? t("confirm");
  p.ok.dataset.variant = options.danger ? "danger" : "primary";
  if (!p.dialog.open) p.dialog.showModal();
  p.cancel.focus();
  return new Promise((resolve) => {
    settle = resolve;
  });
}

window.Tailor = { ...(window.Tailor ?? {}), confirm };

/**
 * The declarative form: <button data-t="confirm-trigger" data-title="…" data-result-target="#out">.
 * The answer goes into the target as "true" or "false" and out as a bubbling "t-confirm" event.
 */
register("confirm-trigger", (element) => {
  element.addEventListener("click", async () => {
    const { title, text, confirmLabel, cancelLabel, resultTarget } = element.dataset;
    if (!title) return;
    const confirmed = await confirm({
      title,
      text,
      confirmLabel,
      cancelLabel,
      danger: element.hasAttribute("data-danger"),
    });
    const target = resultTarget ? document.querySelector(resultTarget) : null;
    if (target) target.textContent = String(confirmed);
    element.dispatchEvent(new CustomEvent("t-confirm", { bubbles: true, detail: confirmed }));
  });
});
