import { t } from "@tailor/core/text";
import { moveLeft, pageLeft, type TrackMetrics, viewOf } from "@tailor/packs/media/carousel/logic";
import { fill } from "@tailor/packs/media/lightbox/logic";
import { h, register } from "../runtime";

const measure = (track: HTMLElement): TrackMetrics => ({
  scrollLeft: track.scrollLeft,
  maxScroll: track.scrollWidth - track.clientWidth,
  trackWidth: track.clientWidth,
  slideWidth: track.firstElementChild?.getBoundingClientRect().width ?? track.clientWidth,
  gap: Number.parseFloat(getComputedStyle(track).columnGap) || 0,
  count: track.childElementCount,
});

const scrollTrack = (track: HTMLElement, left: number | null): void => {
  if (left === null) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  track.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
};

/** Adds the buttons and the dots to a carousel. Without the script, the track still scrolls and snaps. */
register("carousel", (root) => {
  const track = root.querySelector<HTMLElement>(":scope > .t-carousel-track");
  const controls = root.querySelector<HTMLElement>(":scope > .t-carousel-controls");
  const prev = controls?.querySelector<HTMLElement>(".t-carousel-prev");
  const next = controls?.querySelector<HTMLElement>(".t-carousel-next");
  const dots = controls?.querySelector<HTMLElement>(".t-carousel-dots");
  if (!track || !controls || !prev || !next || !dots || track.childElementCount === 0) return;
  const loop = root.dataset.loop !== undefined;

  let frame = 0;
  const update = (): void => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const view = viewOf(measure(track));
      controls.hidden = view.pages < 2;
      const setOff = (button: HTMLElement, off: boolean): void => {
        if (off) button.setAttribute("aria-disabled", "true");
        else button.removeAttribute("aria-disabled");
      };
      setOff(prev, !loop && view.atStart);
      setOff(next, !loop && view.atEnd);
      while (dots.childElementCount > view.pages) dots.lastElementChild?.remove();
      while (dots.childElementCount < view.pages) {
        const page = dots.childElementCount;
        const dot = h("button", {
          type: "button",
          class: "t-carousel-dot",
          "aria-label": fill(t("pageNumber"), { page: page + 1 }),
        });
        dot.addEventListener("click", () => scrollTrack(track, pageLeft(measure(track), page)));
        dots.append(dot);
      }
      [...dots.children].forEach((dot, page) => {
        if (page === view.page) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    });
  };

  const move = (direction: 1 | -1): void => scrollTrack(track, moveLeft(measure(track), direction, loop));
  prev.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  root.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable]"))
      return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  });
  track.addEventListener("scroll", update, { passive: true });
  new ResizeObserver(update).observe(track);
  update();
});
