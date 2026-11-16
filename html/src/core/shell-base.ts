import { once, register } from "../runtime";

const FIELD = "input, textarea, select, [contenteditable]";

/** Follows the visual viewport (the on-screen keyboard, the browser bars) in --t-viewport-h on <html>. */
function followViewport(): void {
  const viewport = window.visualViewport;
  if (!viewport) return;
  const update = (): void => {
    document.documentElement.style.setProperty("--t-viewport-h", `${viewport.height + viewport.offsetTop}px`);
    const field = document.activeElement;
    if (field instanceof HTMLElement && field.matches(FIELD)) field.scrollIntoView({ block: "nearest" });
  };
  update();
  viewport.addEventListener("resize", update);
  viewport.addEventListener("scroll", update);
}

/** The frame of a shell: the skip link moves the focus to the main region; a full-screen shell follows the viewport. */
register("shell", (root) => {
  const skip = root.querySelector<HTMLAnchorElement>(":scope > .t-shell-skip");
  skip?.addEventListener("click", (event) => {
    const main = document.getElementById((skip.getAttribute("href") ?? "").slice(1));
    if (!main) return;
    event.preventDefault();
    main.focus();
  });
  if (!root.hasAttribute("data-contained")) once("shell-viewport", followViewport);
});
