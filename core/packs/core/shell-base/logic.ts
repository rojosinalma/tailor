/** The navigation data of every shell, and the rules both kits share to read it. */

/** The parts of a navigation item that the rules below read. */
export interface NavEntry {
  readonly id: string;
  readonly label: string;
  readonly to?: string;
  readonly exact?: boolean;
  readonly current?: boolean;
  readonly items?: readonly NavEntry[];
}

export interface NavSet<I extends NavEntry> {
  readonly id: string;
  readonly label?: string;
  readonly items: readonly I[];
}

const ITEM_ONLY = ["to", "icon", "counter", "current", "exact"];

/** An entry is a group when it holds items and nothing that only an item has. */
const isGroup = (entry: object): boolean =>
  "items" in entry && Array.isArray(entry.items) && !ITEM_ONLY.some((key) => key in entry);

/**
 * The navigation as groups. A list of groups stays as it is; a plain list of items is one group without a
 * label. A list counts as groups when every entry holds items and none has an address, icon or counter.
 */
export function toGroups<I extends NavEntry>(nav: readonly I[] | readonly NavSet<I>[]): NavSet<I>[] {
  if (nav.length === 0) return [];
  if (nav.every(isGroup)) return [...(nav as readonly NavSet<I>[])];
  return [{ id: "nav", items: nav as readonly I[] }];
}

/** The first-level items of every group, in order. */
export const firstLevel = <I extends NavEntry>(groups: readonly NavSet<I>[]): I[] =>
  groups.flatMap((group) => [...group.items]);

/** True when the address `path` is the page of `to`: the same page, or one under it unless `exact`. */
export function matches(path: string, to: string, exact = false): boolean {
  const clean = (p: string): string => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  const [a, b] = [clean(path.split(/[?#]/)[0] ?? ""), clean(to.split(/[?#]/)[0] ?? "")];
  if (a === b) return true;
  return !exact && b !== "/" && b !== "" && a.startsWith(`${b}/`);
}

/** The item is the current page: forced by `current`, or its address matches the path. */
export const isCurrent = (item: NavEntry, path: string | null): boolean =>
  item.current === true || (path !== null && item.to !== undefined && matches(path, item.to, item.exact));

/** A sub-item of the item is the current page. */
export const holdsCurrent = (item: NavEntry, path: string | null): boolean =>
  (item.items ?? []).some((sub) => isCurrent(sub, path) || holdsCurrent(sub, path));

/** The first letter of a label, for an item without an icon. */
export const initial = (label: string): string => (label.trim()[0] ?? "?").toLocaleUpperCase();

/** The items of a bottom bar: all of them up to `max`, or the first `max - 1` and a "More" entry. */
export function barItems<I>(items: readonly I[], max = 5): { shown: I[]; more: boolean } {
  return items.length > max
    ? { shown: items.slice(0, max - 1), more: true }
    : { shown: [...items], more: false };
}

/** The forms of a shell. Its root is as wide as the screen, or as its box in a preview. */
export type ShellForm = "phone" | "tablet" | "desktop";

/** The widths, in rem, at and under which the phone and the tablet forms show (the stylesheet's 40rem and 64rem). */
export const PHONE_REM = 40;
export const TABLET_REM = 64;

/** The form of a shell whose root is `width` px wide, with `rem` px to the rem. */
export function shellForm(width: number, rem: number): ShellForm {
  const at = width / rem;
  return at <= PHONE_REM ? "phone" : at <= TABLET_REM ? "tablet" : "desktop";
}

/** The region after (or before) the one at `index` in a cycle of `count`; from outside (-1), the first or last. */
export function nextRegion(index: number, count: number, back: boolean): number {
  if (count === 0) return -1;
  if (index < 0) return back ? count - 1 : 0;
  return (index + (back ? count - 1 : 1)) % count;
}
