import { t } from "@tailor/core/text";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import { Spinner } from "../../core/spinner/spinner";

export interface LongListProps<T> {
  /** The accessible name of the list. */
  label: string;
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemKey: (item: T) => string;
  /** The height of every row in px, when all rows are the same. Leave out to measure each row. */
  rowHeight?: number;
  /** Rows drawn beyond the view at each end. */
  overscan?: number;
  /** Called when the end comes into view: load more rows. A spinner row shows while it is set. */
  onEndReached?: () => void;
}

/** The size that a row of unknown height starts with, until it is measured. */
const ESTIMATE = 48;

/** A list of very many rows: only those in view are in the page. It fills its parent and scrolls. */
export function LongList<T>({
  label,
  items,
  renderItem,
  itemKey,
  rowHeight,
  overscan = 8,
  onEndReached,
}: LongListProps<T>) {
  const scroll = useRef<HTMLElement>(null);
  const inner = useRef<HTMLUListElement>(null);
  const virtual = useVirtualizer({
    count: items.length,
    getScrollElement: () => scroll.current,
    estimateSize: () => rowHeight ?? ESTIMATE,
    overscan,
    // The exact height: a rounded one adds up to a gap over many rows of fractional height.
    measureElement: (element) => element.getBoundingClientRect().height,
    getItemKey: (index) => {
      const item = items[index];
      return item === undefined ? index : itemKey(item);
    },
  });
  const rows = virtual.getVirtualItems();
  const total = virtual.getTotalSize();
  const offset = rows[0]?.start ?? 0;

  useLayoutEffect(() => {
    inner.current?.style.setProperty("--t-long-list-size", `${total}px`);
    inner.current?.style.setProperty("--t-long-list-offset", `${offset}px`);
    if (rowHeight) scroll.current?.style.setProperty("--t-long-list-row", `${rowHeight}px`);
  }, [total, offset, rowHeight]);

  // Once per length of the list: a second call waits until the new rows are there.
  const askedAt = useRef(-1);
  const last = rows.at(-1)?.index ?? -1;
  useEffect(() => {
    if (!onEndReached || last < items.length - 1 || askedAt.current === items.length) return;
    askedAt.current = items.length;
    onEndReached();
  }, [last, items.length, onEndReached]);

  return (
    <section
      className="t-long-list"
      ref={scroll}
      aria-label={label}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the box scrolls, so the keyboard needs to reach it.
      tabIndex={0}
      data-fixed={rowHeight ? "" : undefined}
    >
      <ul className="t-long-list-inner" ref={inner}>
        {rows.map((row) => {
          const item = items[row.index];
          if (item === undefined) return null;
          return (
            <li
              key={row.key}
              className="t-long-list-item"
              aria-setsize={items.length}
              aria-posinset={row.index + 1}
              data-index={row.index}
              ref={rowHeight ? undefined : virtual.measureElement}
            >
              {renderItem(item, row.index)}
            </li>
          );
        })}
      </ul>
      {onEndReached ? (
        <div className="t-long-list-more">
          <Spinner size="sm" label={t("loading")} />
        </div>
      ) : null}
    </section>
  );
}
