import { place } from "@tailor/core/position";
import { h, register } from "../runtime";

// Behaviour, not animation: these waits stay under reduced motion. They match the React kit.
const OPEN_DELAY = 400;
const CLOSE_DELAY = 300;

/** Shows the <template> after a link as a card next to it, on mouse hover and on keyboard focus. */
register("hover-card", (link) => {
  const template = link.nextElementSibling;
  if (!(link instanceof HTMLAnchorElement) || !(template instanceof HTMLTemplateElement)) return;
  const panel = h("div", { class: "t-popup t-hover-card-popup" }, template.content.cloneNode(true));
  const positioner = h("div", { class: "t-hover-card-positioner", popover: "manual" }, panel);
  let timer = 0;
  let open = false;

  const update = (): void => {
    const spot = place(
      link.getBoundingClientRect(),
      { width: panel.offsetWidth, height: panel.offsetHeight },
      { width: innerWidth, height: innerHeight },
    );
    positioner.style.setProperty("--available-height", `${spot.available}px`);
    positioner.style.left = `${spot.x}px`;
    positioner.style.top = `${spot.y}px`;
    panel.dataset.side = spot.side;
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") hide();
  };

  const show = (): void => {
    if (open) return;
    open = true;
    document.body.append(positioner);
    positioner.showPopover();
    update();
    link.setAttribute("data-popup-open", "");
    document.addEventListener("keydown", onKeyDown, true);
    addEventListener("scroll", update, true);
    addEventListener("resize", update);
  };

  function hide(): void {
    clearTimeout(timer);
    if (!open) return;
    open = false;
    positioner.hidePopover();
    positioner.remove();
    link.removeAttribute("data-popup-open");
    document.removeEventListener("keydown", onKeyDown, true);
    removeEventListener("scroll", update, true);
    removeEventListener("resize", update);
  }

  const later = (action: () => void, delay: number): void => {
    clearTimeout(timer);
    timer = window.setTimeout(action, delay);
  };

  // A touch screen gets no card: the tap follows the link.
  const targets: HTMLElement[] = [link, positioner];
  for (const target of targets) {
    target.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      if (open) clearTimeout(timer);
      else later(show, OPEN_DELAY);
    });
    target.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" && !link.matches(":focus-visible")) later(hide, CLOSE_DELAY);
    });
  }
  link.addEventListener("focus", () => {
    if (link.matches(":focus-visible")) later(show, OPEN_DELAY);
  });
  link.addEventListener("blur", hide);
});
