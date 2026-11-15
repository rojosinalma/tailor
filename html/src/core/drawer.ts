// A drawer is a <dialog data-t="dialog drawer">: the dialog script opens it, closes it and keeps the focus inside.
import { swipeCloses, swipeOffset } from "@tailor/packs/core/drawer/logic";
import { register } from "../runtime";
import "./dialog";

const GRIP = ".t-drawer-handle, .t-drawer-header";

/** A downward swipe on the handle or the header of a bottom drawer closes it. */
register("drawer", (element) => {
  if (!(element instanceof HTMLDialogElement)) return;
  const dialog = element;
  element.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (dialog.dataset.side !== "bottom" || event.button !== 0 || !(target instanceof Element)) return;
    const grip = target.closest<HTMLElement>(GRIP);
    if (!grip || target.closest("button, a, input")) return;
    const start = event.clientY;
    // Capture on the grip, so the click that ends the swipe never lands on the dialog (the backdrop).
    grip.setPointerCapture(event.pointerId);
    dialog.setAttribute("data-swiping", "");
    const move = (e: PointerEvent): void => {
      dialog.style.translate = `0 ${swipeOffset(start, e.clientY)}px`;
    };
    const end = (e: PointerEvent): void => {
      grip.removeEventListener("pointermove", move);
      grip.removeEventListener("pointerup", end);
      grip.removeEventListener("pointercancel", end);
      dialog.removeAttribute("data-swiping");
      if (e.type === "pointerup" && swipeCloses(swipeOffset(start, e.clientY), dialog.offsetHeight)) {
        dialog.style.translate = "0 100%";
        dialog.close();
        const clear = (): void => {
          dialog.style.translate = "";
        };
        Promise.all(dialog.getAnimations().map((a) => a.finished)).then(clear, clear);
      } else dialog.style.translate = "";
    };
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", end);
    grip.addEventListener("pointercancel", end);
  });
});
