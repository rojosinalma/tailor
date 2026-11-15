import {
  parseSize,
  SPLIT_DEFAULTS,
  sizeFromKey,
  sizeFromPointer,
  splitBounds,
} from "@tailor/packs/core/split/logic";
import { register } from "../runtime";

function readStored(key: string | undefined): string | null {
  if (!key) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Makes the handle of a split move the size of its first pane, by pointer and by key. */
register("split", (element) => {
  const handle = element.querySelector<HTMLElement>(":scope > .t-split-handle");
  if (!handle) return;
  const row = element.dataset.direction !== "column";
  const bounds = splitBounds(
    Number(element.dataset.min ?? Number.NaN),
    Number(element.dataset.max ?? Number.NaN),
  );
  const key = element.dataset.storageKey;
  const fallback = parseSize(element.dataset.defaultSize, SPLIT_DEFAULTS.size, bounds);
  let size = parseSize(readStored(key), fallback, bounds);

  const apply = (next: number): void => {
    size = next;
    element.style.setProperty("--t-split-size", `${size}%`);
    handle.setAttribute("aria-valuenow", String(Math.round(size)));
  };
  const save = (): void => {
    if (!key) return;
    try {
      localStorage.setItem(key, String(size));
    } catch {
      // Storage can be full or blocked; the size then lasts for this page only.
    }
  };
  apply(size);

  handle.addEventListener("keydown", (event) => {
    const next = sizeFromKey(event.key, size, bounds);
    if (next === null) return;
    event.preventDefault();
    apply(next);
    save();
  });

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    handle.setAttribute("data-dragging", "");
  });
  handle.addEventListener("pointermove", (event) => {
    if (!handle.hasAttribute("data-dragging")) return;
    const box = element.getBoundingClientRect();
    apply(
      row
        ? sizeFromPointer(event.clientX, box.left, box.width, bounds)
        : sizeFromPointer(event.clientY, box.top, box.height, bounds),
    );
  });
  const end = (event: PointerEvent): void => {
    if (!handle.hasAttribute("data-dragging")) return;
    handle.removeAttribute("data-dragging");
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    save();
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
});
