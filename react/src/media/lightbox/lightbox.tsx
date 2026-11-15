import { Dialog as Base } from "@base-ui/react/dialog";
import { chevronLeft, chevronRight, close, download as downloadGlyph } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { fill, keyTarget, stepTo, swipeAction } from "@tailor/packs/media/lightbox/logic";
import type spec from "@tailor/packs/media/lightbox/spec";
import type thumbSpec from "@tailor/packs/media/thumb-grid/spec";
import {
  cloneElement,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  useId,
  useRef,
  useState,
} from "react";
import { Button, ButtonLink } from "../../core/button/button";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { renderThumbGrid } from "../thumb-grid/thumb-grid";

export interface LightboxItem {
  /** The full image, or the video. */
  src: string;
  alt: string;
  caption?: string;
  kind?: (typeof spec.props.kind)[number];
}

export interface LightboxProps {
  items: readonly LightboxItem[];
  /** The accessible name of the viewer, such as the name of the album. */
  label: string;
  /** The item on show, for a viewer that the code controls. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The element that opens the viewer, usually a Button. */
  trigger?: ReactElement;
  /** Goes on from the last item to the first. */
  loop?: boolean;
  /** Adds a download link for the item on show. */
  download?: boolean;
}

interface ViewProps extends LightboxProps {
  /** The element that gets the focus back on close. */
  returnFocus?: () => HTMLElement | null;
}

type Direction = "next" | "prev";

/** The links that the HTML kit builds its viewer from: one per item, with the group name. */
const linkData = (group: string, label: string, item: LightboxItem, loop: boolean, download: boolean) => ({
  "data-t-lightbox": group,
  "data-label": label,
  "data-caption": item.caption,
  "data-kind": item.kind === "video" ? "video" : undefined,
  "data-loop": loop ? "" : undefined,
  "data-download": download ? "" : undefined,
});

function LightboxView({
  items,
  label,
  index,
  defaultIndex = 0,
  onIndexChange,
  open,
  onOpenChange,
  trigger,
  loop = false,
  download = false,
  returnFocus,
}: ViewProps) {
  const group = useId();
  const isStatic = useIsStatic();
  const [ownIndex, setOwnIndex] = useState(defaultIndex);
  const [ownOpen, setOwnOpen] = useState(false);
  const [direction, setDirection] = useState<Direction>();
  const closeButton = useRef<HTMLButtonElement>(null);
  const prevButton = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const swipe = useRef<{ id: number; x: number; y: number } | null>(null);

  if (isStatic) {
    return (
      <>
        {trigger
          ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
              "data-t-lightbox-open": group,
              "data-t-lightbox-index": String(defaultIndex),
            })
          : null}
        <div hidden>
          {items.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the items have no id and keep their order.
            <a key={i} href={item.src} {...linkData(group, label, item, loop, download)}>
              {item.alt}
            </a>
          ))}
        </div>
      </>
    );
  }

  const count = items.length;
  const current = Math.min(Math.max(0, index ?? ownIndex), Math.max(0, count - 1));
  const item = items[current];
  const isOpen = open ?? ownOpen;
  const prev = stepTo(current, -1, count, loop);
  const next = stepTo(current, 1, count, loop);

  const changeOpen = (value: boolean): void => {
    if (open === undefined) setOwnOpen(value);
    if (value && index === undefined) setOwnIndex(defaultIndex);
    if (value) setDirection(undefined);
    onOpenChange?.(value);
  };

  const go = (target: number | null): void => {
    if (target === null || target === current) return;
    setDirection(target > current ? "next" : "prev");
    if (index === undefined) setOwnIndex(target);
    onIndexChange?.(target);
    // A button that hides at an end hands the focus to the other one.
    const active = document.activeElement;
    const hides = !loop && (target === 0 || target === count - 1);
    if (hides && active === prevButton.current && target === 0) nextButton.current?.focus();
    if (hides && active === nextButton.current && target === count - 1) prevButton.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLVideoElement) return;
    const target = keyTarget(event.key, current, count, loop);
    if (target === null) return;
    event.preventDefault();
    go(target);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary || (event.target instanceof Element && event.target.closest("button, a, video")))
      return;
    swipe.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: PointerEvent): void => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== event.pointerId) return;
    const action = swipeAction(event.clientX - start.x, event.clientY - start.y);
    if (action === "close") changeOpen(false);
    else if (action) go(action === "next" ? next : prev);
  };

  return (
    <Base.Root open={isOpen} onOpenChange={changeOpen}>
      {trigger ? <Base.Trigger render={trigger} /> : null}
      <Base.Portal>
        <Base.Popup
          className="t-lightbox"
          aria-label={label}
          initialFocus={closeButton}
          finalFocus={returnFocus ?? true}
          onKeyDown={onKeyDown}
        >
          <div className="t-lightbox-bar">
            {count > 1 ? (
              <span className="t-lightbox-counter" aria-live="polite">
                {fill(t("itemOf"), { index: current + 1, count })}
              </span>
            ) : null}
            <div className="t-lightbox-actions">
              {download && item ? (
                <ButtonLink
                  to={item.src}
                  download
                  icon={<Glyph body={downloadGlyph} />}
                  label={t("download")}
                />
              ) : null}
              <Base.Close
                render={
                  <Button
                    ref={closeButton}
                    className="t-lightbox-close"
                    icon={<Glyph body={close} />}
                    label={t("close")}
                  />
                }
              />
            </div>
          </div>
          <figure
            className="t-lightbox-stage"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              swipe.current = null;
            }}
          >
            {item?.kind === "video" ? (
              // biome-ignore lint/a11y/useMediaCaption: the caption track comes with the video file, which the app provides.
              <video
                key={current}
                className="t-lightbox-media"
                src={item.src}
                aria-label={item.alt}
                controls
                data-direction={direction}
              />
            ) : item ? (
              <img
                key={current}
                className="t-lightbox-media"
                src={item.src}
                alt={item.alt}
                draggable={false}
                data-direction={direction}
              />
            ) : null}
            {item?.caption ? <figcaption className="t-lightbox-caption">{item.caption}</figcaption> : null}
            {prev !== null ? (
              <Button
                ref={prevButton}
                className="t-lightbox-prev"
                icon={<Glyph body={chevronLeft} />}
                label={t("previous")}
                onClick={() => go(prev)}
              />
            ) : null}
            {next !== null ? (
              <Button
                ref={nextButton}
                className="t-lightbox-next"
                icon={<Glyph body={chevronRight} />}
                label={t("next")}
                onClick={() => go(next)}
              />
            ) : null}
          </figure>
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}

/** A full-screen viewer for one image or video of a set. */
export function Lightbox(props: LightboxProps) {
  return <LightboxView {...props} />;
}

export interface GalleryItem extends LightboxItem {
  id: string;
  /** The preview in the grid; the full image when left out. A video needs one: its poster. */
  thumb?: string;
  /** A line of details under the caption in the grid. */
  meta?: string;
}

export interface GalleryProps {
  /** The accessible name of the grid and of the viewer. */
  label: string;
  items: readonly GalleryItem[];
  min?: (typeof thumbSpec.props.min)[number];
  ratio?: (typeof thumbSpec.props.ratio)[number];
  loop?: boolean;
  download?: boolean;
}

/** A thumbnail grid whose tiles open the lightbox at their item. Without a script, a tile opens its image. */
export function Gallery({ label, items, min, ratio, loop = false, download = false }: GalleryProps) {
  const group = useId();
  const isStatic = useIsStatic();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const opened = useRef(0);
  const tile = (i: number): HTMLElement | null =>
    [...document.querySelectorAll<HTMLElement>("[data-t-lightbox]")].filter(
      (el) => el.dataset.tLightbox === group,
    )[i] ?? null;

  const grid = renderThumbGrid(
    {
      label,
      min,
      ratio,
      items: items.map((item, i) => ({
        id: item.id,
        src: item.thumb ?? item.src,
        alt: item.alt,
        caption: item.caption,
        meta: item.meta,
        kind: item.kind,
        to: item.src,
        onSelect: isStatic
          ? undefined
          : () => {
              opened.current = i;
              setIndex(i);
              setOpen(true);
            },
      })),
    },
    (_, i) => {
      const item = items[i];
      return item ? linkData(group, label, item, loop, download) : {};
    },
  );

  if (isStatic) return grid;
  return (
    <>
      {grid}
      <LightboxView
        items={items}
        label={label}
        index={index}
        onIndexChange={setIndex}
        open={open}
        onOpenChange={setOpen}
        loop={loop}
        download={download}
        returnFocus={() => tile(opened.current)}
      />
    </>
  );
}
