/** The tree view logic that both kits share: the list of shown items and what each key does. */

export interface TreeItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly children?: readonly TreeItem[];
  /** A branch whose children are not loaded yet. */
  readonly hasChildren?: boolean;
}

export interface ShownItem<T extends TreeItem> {
  readonly item: T;
  /** 1 for the top level. */
  readonly level: number;
  /** The place among its siblings, from 1. */
  readonly position: number;
  readonly siblings: number;
  readonly parent: string | null;
  readonly branch: boolean;
}

export const isBranch = (item: TreeItem): boolean =>
  (item.children?.length ?? 0) > 0 || item.hasChildren === true;

/** The shown items in reading order: the items of the top level and the children of open branches. */
export function shownItems<T extends TreeItem>(
  items: readonly T[],
  open: ReadonlySet<string>,
): ShownItem<T>[] {
  const out: ShownItem<T>[] = [];
  const visit = (list: readonly T[], level: number, parent: string | null): void => {
    list.forEach((item, i) => {
      const branch = isBranch(item);
      out.push({ item, level, position: i + 1, siblings: list.length, parent, branch });
      if (branch && open.has(item.id) && item.children)
        visit(item.children as readonly T[], level + 1, item.id);
    });
  };
  visit(items, 1, null);
  return out;
}

export type TreeKey = "ArrowDown" | "ArrowUp" | "ArrowRight" | "ArrowLeft" | "Home" | "End";
export const TREE_KEYS: readonly string[] = [
  "ArrowDown",
  "ArrowUp",
  "ArrowRight",
  "ArrowLeft",
  "Home",
  "End",
];

/** What a key does: move the focus, open a branch or close one (the WAI-ARIA tree pattern). */
export type TreeAction = { readonly type: "focus" | "open" | "close"; readonly id: string } | null;

export function treeKey<T extends TreeItem>(
  key: TreeKey,
  current: string,
  shown: readonly ShownItem<T>[],
  open: ReadonlySet<string>,
): TreeAction {
  const index = shown.findIndex((s) => s.item.id === current);
  const here = shown[index];
  if (!here) return null;
  const focus = (target: ShownItem<T> | undefined): TreeAction =>
    target ? { type: "focus", id: target.item.id } : null;
  switch (key) {
    case "ArrowDown":
      return focus(shown[index + 1]);
    case "ArrowUp":
      return focus(shown[index - 1]);
    case "Home":
      return focus(shown[0]);
    case "End":
      return focus(shown.at(-1));
    case "ArrowRight":
      if (!here.branch) return null;
      if (!open.has(current)) return { type: "open", id: current };
      return shown[index + 1]?.parent === current ? focus(shown[index + 1]) : null;
    case "ArrowLeft":
      if (here.branch && open.has(current)) return { type: "close", id: current };
      return here.parent === null ? null : { type: "focus", id: here.parent };
  }
}

/**
 * The item that type-ahead finds: the next shown item, after the current one and round to the start, whose
 * label starts with the typed text. A repeated single letter steps through the matches.
 */
export function typeAhead<T extends TreeItem>(
  shown: readonly ShownItem<T>[],
  current: string,
  typed: string,
): string | null {
  const text = typed.toLocaleLowerCase();
  const start = shown.findIndex((s) => s.item.id === current);
  const from = typed.length === 1 ? start + 1 : Math.max(0, start);
  for (let i = 0; i < shown.length; i++) {
    const candidate = shown[(from + i) % shown.length];
    if (candidate?.item.label.toLocaleLowerCase().startsWith(text)) return candidate.item.id;
  }
  return null;
}

/** The selection after choosing an item: only that item, or with `multiple`, the item added or taken out. */
export function choose(selected: readonly string[], id: string, multiple: boolean): string[] {
  if (!multiple) return [id];
  return selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
}
