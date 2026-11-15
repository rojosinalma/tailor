import { chevronLeft, chevronRight } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  type CarouselView,
  moveLeft,
  pageLeft,
  type TrackMetrics,
  viewOf,
} from "@tailor/packs/media/carousel/logic";
import type spec from "@tailor/packs/media/carousel/spec";
import { fill } from "@tailor/packs/media/lightbox/logic";
import { Children, type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "../../core/button/button";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface CarouselProps {
  /** The accessible name of the carousel. */
  label: string;
  /** Slides in one view on a wide container; a narrow one shows fewer. */
  perView?: (typeof spec.props.perView)[number];
  gap?: (typeof spec.props.gap)[number];
  /** Goes on from the last view to the first. */
  loop?: boolean;
  /** The slides, one child each. */
  children: ReactNode;
}

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

const sameView = (a: CarouselView, b: CarouselView): boolean =>
  a.perView === b.perView &&
  a.pages === b.pages &&
  a.page === b.page &&
  a.atStart === b.atStart &&
  a.atEnd === b.atEnd;

/** A row of slides that moves one view at a time. It snaps to the slides and never moves by itself. */
export function Carousel({ label, perView = "1", gap = "4", loop = false, children }: CarouselProps) {
  const isStatic = useIsStatic();
  const slides = Children.toArray(children);
  const count = slides.length;
  const track = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<CarouselView>(() => {
    const per = Number(perView);
    const pages = Math.max(1, Math.ceil(count / per));
    return { perView: per, pages, page: 0, atStart: true, atEnd: pages === 1 };
  });

  useEffect(() => {
    const el = track.current;
    if (!el || count === 0) return;
    let frame = 0;
    const update = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = viewOf(measure(el));
        setView((current) => (sameView(current, next) ? current : next));
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, [count]);

  const move = (direction: 1 | -1): void => {
    const el = track.current;
    if (el) scrollTrack(el, moveLeft(measure(el), direction, loop));
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable]"))
      return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  };

  const prevOff = !loop && view.atStart;
  const nextOff = !loop && view.atEnd;

  return (
    <section
      className="t-carousel"
      aria-roledescription={t("carousel")}
      aria-label={label}
      data-per-view={perView === "1" ? undefined : perView}
      data-gap={gap === "4" ? undefined : gap}
      data-t={isStatic ? "carousel" : undefined}
      data-loop={loop ? "" : undefined}
      onKeyDown={isStatic ? undefined : onKeyDown}
    >
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: the track scrolls, so the keyboard must reach it. */}
      <div className="t-carousel-track" ref={track} tabIndex={0}>
        {slides.map((slide, i) => (
          // biome-ignore lint/a11y/useSemanticElements: a slide is a group of content, not a set of form fields.
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: the slides keep their order.
            key={i}
            className="t-carousel-slide"
            role="group"
            aria-roledescription={t("slide")}
            aria-label={fill(t("itemOf"), { index: i + 1, count })}
          >
            {slide}
          </div>
        ))}
      </div>
      <div className="t-carousel-controls" hidden={isStatic || view.pages < 2}>
        <Button
          className="t-carousel-prev"
          icon={<Glyph body={chevronLeft} />}
          label={t("previous")}
          aria-disabled={prevOff ? true : undefined}
          onClick={() => move(-1)}
        />
        <div className="t-carousel-dots">
          {isStatic
            ? null
            : Array.from({ length: view.pages }, (_, page) => (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: a dot is its page number.
                  key={page}
                  type="button"
                  className="t-carousel-dot"
                  aria-label={fill(t("pageNumber"), { page: page + 1 })}
                  aria-current={page === view.page ? "true" : undefined}
                  onClick={() => {
                    const el = track.current;
                    if (el) scrollTrack(el, pageLeft(measure(el), page));
                  }}
                />
              ))}
        </div>
        <Button
          className="t-carousel-next"
          icon={<Glyph body={chevronRight} />}
          label={t("next")}
          aria-disabled={nextOff ? true : undefined}
          onClick={() => move(1)}
        />
      </div>
    </section>
  );
}
