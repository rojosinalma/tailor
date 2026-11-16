/**
 * The order logic of the sortable lists, shared by the drag and the keyboard. Plain TypeScript, no DOM.
 * A list is an array of item ids; a group of lists is a record from list id to its ids.
 */

export type Lists = Readonly<Record<string, readonly string[]>>;

/** Where an item is: its list and its index in that list. */
export interface Place {
  readonly list: string;
  readonly index: number;
}

/** A copy of the array with the element at `from` moved to `to`. Indexes out of range are clamped. */
export function move<T>(array: readonly T[], from: number, to: number): T[] {
  const out = [...array];
  if (from < 0 || from >= out.length) return out;
  const [item] = out.splice(from, 1);
  if (item === undefined) return out;
  out.splice(Math.max(0, Math.min(to, out.length)), 0, item);
  return out;
}

/** The list and the index of an item, or null when no list holds it. */
export function locate(lists: Lists, id: string): Place | null {
  for (const [list, ids] of Object.entries(lists)) {
    const index = ids.indexOf(id);
    if (index !== -1) return { list, index };
  }
  return null;
}

/**
 * A copy of the lists with the item moved to the list `to` at `index` (clamped to the list).
 * The same lists come back when the item is in no list, the target list does not exist or nothing changes.
 */
export function moveBetween(lists: Lists, id: string, to: string, index: number): Lists {
  const from = locate(lists, id);
  const target = lists[to];
  if (!from || !target) return lists;
  if (from.list === to) {
    const next = move(target, from.index, index);
    return next.every((item, i) => item === target[i]) ? lists : { ...lists, [to]: next };
  }
  const source = lists[from.list] ?? [];
  const inserted = [...target];
  inserted.splice(Math.max(0, Math.min(index, inserted.length)), 0, id);
  return { ...lists, [from.list]: source.filter((item) => item !== id), [to]: inserted };
}

/** Fills the {name} placeholders of a text, such as "Moved to position {position} of {count}." */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

export interface AnnouncementTexts {
  readonly pickedUp: string;
  readonly moved: string;
  readonly movedList: string;
}

/** The sentence a screen reader hears when an item is picked up or moves. Positions count from 1. */
export function announcement(
  kind: "pickedUp" | "moved",
  texts: AnnouncementTexts,
  values: { label: string; index: number; count: number; list?: string },
): string {
  const parts = { label: values.label, position: values.index + 1, count: values.count };
  if (kind === "pickedUp") return fill(texts.pickedUp, parts);
  return values.list === undefined
    ? fill(texts.moved, parts)
    : fill(texts.movedList, { ...parts, list: values.list });
}
