/**
 * The page's own code for the form dialog in the HTML kit: a form in a dialog that was sent with an ok
 * answer closes its dialog and starts empty again. The form script shows the toast and fires t:submit.
 */
import { once } from "../runtime";

once("form-dialog", () => {
  document.addEventListener("t:submit", (event) => {
    const form = event.target;
    const ok = event instanceof CustomEvent && (event.detail as { ok?: unknown } | null)?.ok === true;
    if (!ok || !(form instanceof HTMLFormElement)) return;
    const dialog = form.closest("dialog.t-dialog");
    if (!(dialog instanceof HTMLDialogElement)) return;
    dialog.close();
    form.reset();
  });
});
