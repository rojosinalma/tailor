import { once, register } from "../runtime";

once("dialog-openers", () => {
  document.addEventListener("click", (event) => {
    const opener =
      event.target instanceof Element ? event.target.closest<HTMLElement>("[data-t-open]") : null;
    if (!opener) return;
    const target = document.getElementById(opener.dataset.tOpen ?? "");
    if (target instanceof HTMLDialogElement && !target.open) target.showModal();
  });
});

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

register("dialog", (element) => {
  if (!(element instanceof HTMLDialogElement)) return;
  element.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    // A click on the dialog element itself is a click on the backdrop.
    if (target === element || target.closest("[data-t-close]")) element.close();
  });
  // The browser lets the Tab key leave a modal dialog for its own toolbar. Keep the focus inside.
  element.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const stops = [...element.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    );
    const first = stops[0];
    const last = stops.at(-1);
    if (!first || !last) return;
    const current = document.activeElement;
    if (event.shiftKey && (current === first || current === element)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  });
});
