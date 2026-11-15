/** The logic that both kits share for the carousel: views, pages and where a move scrolls to. */

/** The layout of the track, as the kit measures it. Lengths are in CSS pixels. */
export interface TrackMetrics {
  readonly scrollLeft: number;
  /** The widest scroll position: scrollWidth - clientWidth. */
  readonly maxScroll: number;
  readonly trackWidth: number;
  readonly slideWidth: number;
  readonly gap: number;
  readonly count: number;
}

export interface CarouselView {
  /** Slides in one view. */
  readonly perView: number;
  readonly pages: number;
  readonly page: number;
  readonly atStart: boolean;
  readonly atEnd: boolean;
}

/** A scroll position counts as an end within this many pixels: snapping lands on fractions. */
const EDGE = 1;

const stepOf = (m: TrackMetrics): number => Math.max(1, m.slideWidth + m.gap);

export function viewOf(m: TrackMetrics): CarouselView {
  const perView = Math.max(1, Math.round((m.trackWidth + m.gap) / stepOf(m)));
  const pages = Math.max(1, Math.ceil(m.count / perView));
  const atStart = m.scrollLeft <= EDGE;
  const atEnd = m.scrollLeft >= m.maxScroll - EDGE;
  const page = atEnd ? pages - 1 : Math.min(pages - 1, Math.round(m.scrollLeft / (stepOf(m) * perView)));
  return { perView, pages, page, atStart, atEnd };
}

/** The scroll position of a page. */
export function pageLeft(m: TrackMetrics, page: number): number {
  return Math.min(m.maxScroll, Math.max(0, page * viewOf(m).perView * stepOf(m)));
}

/** The scroll position one view further (1) or back (-1), or null at an end of a carousel that does not loop. */
export function moveLeft(m: TrackMetrics, direction: 1 | -1, loop: boolean): number | null {
  const view = viewOf(m);
  if (direction > 0 && view.atEnd) return loop && !view.atStart ? 0 : null;
  if (direction < 0 && view.atStart) return loop && !view.atEnd ? m.maxScroll : null;
  const slide = Math.round(m.scrollLeft / stepOf(m)) + direction * view.perView;
  return Math.min(m.maxScroll, Math.max(0, slide * stepOf(m)));
}
