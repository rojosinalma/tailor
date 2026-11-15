import {
  clampSize,
  parseSize,
  SPLIT_DEFAULTS,
  type SplitBounds,
  sizeFromKey,
  sizeFromPointer,
  splitBounds,
} from "@tailor/packs/core/split/logic";
import type spec from "@tailor/packs/core/split/spec";
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useIsStatic } from "../../kit";

export interface SplitProps {
  /** "row": side by side (stacked in a narrow space). "column": one above the other. */
  direction?: (typeof spec.props.direction)[number];
  /** The size of the first pane at the start, in percent. */
  defaultSize?: number;
  /** The least size of the first pane, in percent. */
  min?: number;
  /** The most size of the first pane, in percent. */
  max?: number;
  /** When set, the size is remembered in localStorage under this key. */
  storageKey?: string;
  /** The accessible name of the handle, for example "Resize the host list". */
  label: string;
  first: ReactNode;
  second: ReactNode;
}

function readStored(key: string | undefined): string | null {
  if (!key) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string | undefined, size: number): void {
  if (!key) return;
  try {
    localStorage.setItem(key, String(size));
  } catch {
    // Storage can be full or blocked; the size then lasts for this page only.
  }
}

interface Parts {
  id: string;
  direction: (typeof spec.props.direction)[number];
  size: number;
  bounds: SplitBounds;
  label: string;
  first: ReactNode;
  second: ReactNode;
}

/** Two panes with a handle between them that the user drags or moves with the keys. */
export function Split(props: SplitProps) {
  return useIsStatic() ? <StaticSplit {...props} /> : <LiveSplit {...props} />;
}

function StaticSplit({
  direction = "row",
  defaultSize = SPLIT_DEFAULTS.size,
  min,
  max,
  storageKey,
  label,
  first,
  second,
}: SplitProps) {
  const id = useId();
  const bounds = splitBounds(min, max);
  return (
    <div
      className="t-split"
      data-t="split"
      data-direction={direction === "row" ? undefined : direction}
      data-default-size={defaultSize}
      data-min={bounds.min}
      data-max={bounds.max}
      data-storage-key={storageKey}
    >
      <SplitParts
        id={id}
        direction={direction}
        size={clampSize(defaultSize, bounds)}
        bounds={bounds}
        label={label}
        first={first}
        second={second}
      />
    </div>
  );
}

function SplitParts({
  id,
  direction,
  size,
  bounds,
  label,
  first,
  second,
  handlers,
  dragging,
}: Parts & {
  handlers?: {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  };
  dragging?: boolean;
}) {
  return (
    <>
      <div className="t-split-pane" id={`${id}-first`}>
        {first}
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: a focusable separator is a widget; <hr> cannot take focus or a value. */}
      <div
        className="t-split-handle"
        role="separator"
        tabIndex={0}
        aria-orientation={direction === "row" ? "vertical" : "horizontal"}
        aria-valuenow={Math.round(size)}
        aria-valuemin={bounds.min}
        aria-valuemax={bounds.max}
        aria-label={label}
        aria-controls={`${id}-first`}
        data-dragging={dragging ? "" : undefined}
        {...handlers}
      />
      <div className="t-split-pane">{second}</div>
    </>
  );
}

function LiveSplit({
  direction = "row",
  defaultSize = SPLIT_DEFAULTS.size,
  min,
  max,
  storageKey,
  label,
  first,
  second,
}: SplitProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const bounds = splitBounds(min, max);
  const [size, setSize] = useState(() => parseSize(readStored(storageKey), defaultSize, bounds));
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    root.current?.style.setProperty("--t-split-size", `${size}%`);
  }, [size]);

  const fromPointer = (event: PointerEvent<HTMLDivElement>): number | null => {
    const box = root.current?.getBoundingClientRect();
    if (!box) return null;
    return direction === "row"
      ? sizeFromPointer(event.clientX, box.left, box.width, bounds)
      : sizeFromPointer(event.clientY, box.top, box.height, bounds);
  };

  const end = (event: PointerEvent<HTMLDivElement>): void => {
    if (!dragging) return;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    store(storageKey, size);
  };

  return (
    <div className="t-split" ref={root} data-direction={direction === "row" ? undefined : direction}>
      <SplitParts
        id={id}
        direction={direction}
        size={size}
        bounds={bounds}
        label={label}
        first={first}
        second={second}
        dragging={dragging}
        handlers={{
          onPointerDown: (event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          },
          onPointerMove: (event) => {
            if (!dragging) return;
            const next = fromPointer(event);
            if (next !== null) setSize(next);
          },
          onPointerUp: end,
          onPointerCancel: end,
          onKeyDown: (event) => {
            const next = sizeFromKey(event.key, size, bounds);
            if (next === null) return;
            event.preventDefault();
            setSize(next);
            store(storageKey, next);
          },
        }}
      />
    </div>
  );
}
