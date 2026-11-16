import { Dialog } from "@base-ui/react/dialog";
import { place } from "@tailor/core/position";
import { t } from "@tailor/core/text";
import { cutout, nextPresent, position, scrollAboveSheet, settle } from "@tailor/packs/tour/tour/logic";
import type spec from "@tailor/packs/tour/tour/spec";
import { type KeyboardEvent, type ReactNode, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../../core/button/button";
import { isDevelopment } from "../../kit";

export interface TourStep {
  /** The element the step points at: an element id, or a CSS selector. */
  readonly target: string;
  readonly title: string;
  readonly text: ReactNode;
  /** The side of the target where the text goes, when there is room. */
  readonly side?: (typeof spec.props.side)[number];
  readonly align?: (typeof spec.props.align)[number];
}

export interface TourProps {
  steps: readonly TourStep[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Done on the last step. */
  onFinish?: () => void;
  /** Skip, or Escape. */
  onSkip?: () => void;
  /** The accessible name of the tour. */
  label?: string;
}

/** Room around the target inside the cut-out, and between the cut-out and the text, in pixels. */
const PADDING = 6;
const GAP = 12;
const MARGIN = 16;
const PHONE = "(max-width: 40rem)";

const fill = (text: string, values: Record<string, number>): string =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/** The element of a step: by id first, then by selector. */
function findTarget(target: string): HTMLElement | null {
  const byId = document.getElementById(target);
  if (byId) return byId;
  try {
    return document.querySelector<HTMLElement>(target);
  } catch {
    return null;
  }
}

const warn = (message: string): void => {
  if (!isDevelopment()) return;
  console.warn(message);
};

const setBox = (element: HTMLElement, values: Record<string, number>): void => {
  for (const [name, value] of Object.entries(values)) element.style.setProperty(name, `${value}px`);
};

/** The state of a tour that a button starts: `<Tour steps={…} {...tour} />` and `onClick={tour.start}`. */
export function useTour(): { open: boolean; onOpenChange: (open: boolean) => void; start: () => void } {
  const [open, setOpen] = useState(false);
  return { open, onOpenChange: setOpen, start: () => setOpen(true) };
}

/** A guided tour: each step dims the page around one element and explains it. */
export function Tour({
  steps,
  open,
  defaultOpen = false,
  onOpenChange,
  onFinish,
  onSkip,
  label = t("tourLabel"),
}: TourProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const shown = open ?? ownOpen;
  const [index, setIndex] = useState(0);
  const [present, setPresent] = useState<readonly boolean[]>([]);
  const [popup, setPopup] = useState<HTMLDivElement | null>(null);
  const cut = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const direction = useRef<1 | -1>(1);
  const labelId = useId();
  const titleId = useId();

  // On opening: start at the first step and remember where the focus was, to give it back at the end.
  const [wasShown, setWasShown] = useState(false);
  if (wasShown !== shown) {
    setWasShown(shown);
    if (shown) {
      setIndex(0);
      direction.current = 1;
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
  }

  const setShown = (next: boolean): void => {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };
  const finish = (): void => {
    setShown(false);
    onFinish?.();
  };
  const skip = (): void => {
    setShown(false);
    onSkip?.();
  };

  const step = steps[index];

  // Find the targets; pass over a step whose target is missing.
  // biome-ignore lint/correctness/useExhaustiveDependencies: setShown changes on every render; the targets are looked up per step.
  useLayoutEffect(() => {
    if (!shown) return;
    const found = steps.map((s) => findTarget(s.target) !== null);
    if (!found[index]) {
      warn(`Tour: no element matches "${steps[index]?.target}"; the step is skipped.`);
      const next =
        nextPresent(index, direction.current, found) ??
        (direction.current === 1 ? null : settle(index, found));
      if (next === null) setShown(false);
      else setIndex(next);
      return;
    }
    setPresent(found);
  }, [shown, index, steps]);

  // Bring the target into view, then keep the cut-out and the text on it while the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!shown || !step || !popup || !present[index]) return;
    const target = findTarget(step.target);
    if (!target) return;
    const phone = window.matchMedia(PHONE).matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: phone ? "nearest" : "center", behavior: reduced ? "instant" : "smooth" });
    if (phone) {
      const delta = scrollAboveSheet(
        target.getBoundingClientRect(),
        window.innerHeight,
        popup.offsetHeight,
        MARGIN,
      );
      if (delta !== 0) window.scrollBy({ top: delta, behavior: reduced ? "instant" : "smooth" });
    }

    let frame = 0;
    const layout = (): void => {
      frame = 0;
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const box = cutout(target.getBoundingClientRect(), PADDING, viewport);
      if (cut.current)
        setBox(cut.current, { "--t-x": box.x, "--t-y": box.y, "--t-w": box.width, "--t-h": box.height });
      if (window.matchMedia(PHONE).matches) return;
      const size = popup.getBoundingClientRect();
      const spot = place(box, size, viewport, {
        side: step.side,
        align: step.align,
        gap: GAP,
        margin: MARGIN,
      });
      setBox(popup, { "--t-x": spot.x, "--t-y": spot.y });
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(layout);
    };
    layout();
    const observer = new ResizeObserver(schedule);
    observer.observe(target);
    observer.observe(popup);
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    primary.current?.focus();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, [shown, step, popup, present, index]);

  if (!step) return null;
  const at = position(index, present);
  const last = nextPresent(index, 1, present) === null;

  const go = (by: 1 | -1): void => {
    const next = nextPresent(index, by, present);
    if (next === null) {
      if (by === 1) finish();
      return;
    }
    direction.current = by;
    setIndex(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "ArrowRight") go(1);
    else if (event.key === "ArrowLeft") go(-1);
    else return;
    event.preventDefault();
  };

  const count = fill(t("tourStep"), at);

  return (
    <Dialog.Root
      open={shown && present[index] === true}
      modal="trap-focus"
      disablePointerDismissal
      onOpenChange={(next) => {
        if (!next) skip();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="t-tour-layer" />
        <div className="t-tour-cutout" ref={cut} aria-hidden="true" />
        <Dialog.Popup
          ref={setPopup}
          className="t-popup t-tour"
          aria-labelledby={`${labelId} ${titleId}`}
          initialFocus={primary}
          finalFocus={returnTo}
          onKeyDown={onKeyDown}
        >
          <span className="t-sr-only" id={labelId}>
            {label}
          </span>
          <p className="t-tour-count">{count}</p>
          <Dialog.Title className="t-tour-title" id={titleId}>
            {step.title}
          </Dialog.Title>
          <Dialog.Description className="t-tour-text">{step.text}</Dialog.Description>
          <div className="t-tour-actions">
            <Button variant="ghost" size="sm" onClick={skip}>
              {t("tourSkip")}
            </Button>
            {at.index > 1 ? (
              <Button size="sm" onClick={() => go(-1)}>
                {t("back")}
              </Button>
            ) : null}
            <Button ref={primary} variant="primary" size="sm" onClick={() => go(1)}>
              {last ? t("stepDone") : t("next")}
            </Button>
          </div>
          <span className="t-sr-only" aria-live="polite">
            {`${count}: ${step.title}`}
          </span>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
