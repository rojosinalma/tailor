/** The data table logic that both kits share: sorting, filtering, pages and range selection. */

/** How a column sorts: text in the reading order of the language, numbers, or dates. */
export type SortType = "text" | "num" | "date";

/** One sort key. The same shape as a sort key of TanStack Table. */
export interface SortKey {
  readonly id: string;
  readonly desc: boolean;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const asNumber = (value: string, type: SortType): number =>
  type === "date" ? Date.parse(value) : value.trim() === "" ? Number.NaN : Number(value);

/** Compares two cell values in ascending order. Values that are not a number or a date go last. */
export function compareValues(a: string, b: string, type: SortType): number {
  if (type === "text") return collator.compare(a, b);
  const x = asNumber(a, type);
  const y = asNumber(b, type);
  if (Number.isNaN(x) || Number.isNaN(y)) return Number(Number.isNaN(x)) - Number(Number.isNaN(y));
  return x - y;
}

/**
 * The sort after a click on a column: ascending, then descending, then not sorted.
 * With `multi` (Shift+click) the column is added to or changed in the keys; without, it becomes the only key.
 */
export function nextSort(sort: readonly SortKey[], id: string, multi: boolean): SortKey[] {
  const current = sort.find((key) => key.id === id);
  const next: SortKey | null = !current ? { id, desc: false } : current.desc ? null : { id, desc: true };
  if (!multi) return next ? [next] : [];
  if (!current) return next ? [...sort, next] : [...sort];
  return sort.flatMap((key) => (key.id !== id ? [key] : next ? [next] : []));
}

/** Sorts rows by the keys, the first key first. The sort is stable: equal rows keep their order. */
export function sortRows<T>(
  rows: readonly T[],
  sort: readonly SortKey[],
  value: (row: T, id: string) => string,
  type: (id: string) => SortType,
): T[] {
  if (sort.length === 0) return [...rows];
  return [...rows].sort((a, b) => {
    for (const key of sort) {
      const order = compareValues(value(a, key.id), value(b, key.id), type(key.id));
      if (order !== 0) return key.desc ? -order : order;
    }
    return 0;
  });
}

const words = (query: string): string[] => query.toLocaleLowerCase().split(/\s+/).filter(Boolean);

/** True when the text holds every word of the query, in any case. An empty query matches everything. */
export function matchesText(text: string, query: string): boolean {
  const haystack = text.toLocaleLowerCase();
  return words(query).every((word) => haystack.includes(word));
}

/** How a column filters: one value from a list, or a text that the value contains. */
export type FilterType = "select" | "text";

/** True when a cell value passes a column filter. An empty filter lets everything pass. */
export function matchesFilter(value: string, filter: string, type: FilterType): boolean {
  if (filter === "") return true;
  return type === "select" ? value === filter : matchesText(value, filter);
}

export interface PageWindow {
  /** The current page, from 1, limited to the pages that exist. */
  readonly page: number;
  /** At least 1, also for no rows. */
  readonly pageCount: number;
  /** The index of the first row of the page, from 0. */
  readonly start: number;
  /** The index after the last row of the page. */
  readonly end: number;
}

/** The rows of a page: which page it really is, and where it starts and ends. */
export function pageWindow(page: number, pageSize: number, total: number): PageWindow {
  const size = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const start = Math.min((current - 1) * size, total);
  return { page: current, pageCount, start, end: Math.min(start + size, total) };
}

/** The count line under the table: "21–40 of 312", or "0 of 0". */
export function rangeText(window: PageWindow, total: number, of: string): string {
  if (total === 0) return `0 ${of} 0`;
  return `${window.start + 1}–${window.end} ${of} ${total}`;
}

/**
 * The selection after a click on the box of a row. With `range` (Shift+click) and an anchor, every row from
 * the anchor to the row, in the order shown, takes the new state of the row; else only the row changes.
 */
export function selectRange(
  selected: ReadonlySet<string>,
  order: readonly string[],
  anchor: string | null,
  id: string,
  checked: boolean,
  range: boolean,
): Set<string> {
  const next = new Set(selected);
  const from = anchor === null ? -1 : order.indexOf(anchor);
  const to = order.indexOf(id);
  const ids = range && from >= 0 && to >= 0 ? order.slice(Math.min(from, to), Math.max(from, to) + 1) : [id];
  for (const each of ids) {
    if (checked) next.add(each);
    else next.delete(each);
  }
  return next;
}

/** The state of the box that selects a page: all, some or none of its rows selected. */
export function pageSelection(
  selected: ReadonlySet<string>,
  page: readonly string[],
): "all" | "some" | "none" {
  const count = page.filter((id) => selected.has(id)).length;
  if (count === 0) return "none";
  return count === page.length ? "all" : "some";
}
