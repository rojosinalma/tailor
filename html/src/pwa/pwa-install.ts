import { close } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { canInstall, type InstallSteps } from "@tailor/packs/pwa/pwa/logic";
import { glyph, h, register, uid, upgrade } from "../runtime";
import { pwa } from "./boot";

const STEP_TEXT = {
  ios: "installStepsIos",
  mac: "installStepsMac",
  "firefox-android": "installStepsFirefox",
} as const;

/** The dialog of the manual steps, with the markup of the Dialog component. */
function stepsDialog(steps: InstallSteps): HTMLDialogElement {
  const id = uid("t-install");
  const dialog = h(
    "dialog",
    { class: "t-dialog", id, "data-t": "dialog", "data-size": "sm", "aria-labelledby": `${id}-title` },
    h(
      "header",
      { class: "t-dialog-header" },
      h("h2", { class: "t-dialog-title", id: `${id}-title` }, t("installStepsTitle")),
      h(
        "button",
        { type: "button", class: "t-dialog-close", "aria-label": t("close"), "data-t-close": "" },
        glyph(close),
      ),
    ),
    h("div", { class: "t-dialog-body" }, h("p", {}, t(STEP_TEXT[steps]))),
    h(
      "footer",
      { class: "t-dialog-footer" },
      h("button", { type: "button", class: "t-btn", "data-variant": "primary", "data-t-close": "" }, t("ok")),
    ),
  );
  document.body.append(dialog);
  upgrade(dialog);
  return dialog;
}

register("pwa-install", (element) => {
  const store = pwa();
  let dialog: HTMLDialogElement | null = null;
  const sync = (): void => {
    element.hidden = !canInstall(store.get());
  };
  sync();
  store.subscribe(sync);
  element.addEventListener("click", () => {
    const { installable, steps } = store.get();
    if (installable) void store.install();
    else if (steps) {
      dialog ??= stepsDialog(steps);
      dialog.showModal();
    }
  });
});
