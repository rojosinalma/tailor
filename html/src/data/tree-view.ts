import { chevronRight } from "@tailor/core/glyphs.gen";
import {
  choose,
  shownItems,
  TREE_KEYS,
  type TreeItem,
  type TreeKey,
  treeKey,
  typeAhead,
} from "@tailor/packs/data/tree-view/logic";
import { glyph, h, register, uid } from "../runtime";

interface Item extends TreeItem {
  /** The line: the tree item that takes the focus. */
  readonly li: HTMLElement;
  readonly children?: readonly Item[];
}

const TYPE_AHEAD_MS = 600;

/** Makes a nested list a tree: roles, one tab stop, the arrow keys, opening and selecting. */
register("tree", (root) => {
  if (!(root instanceof HTMLUListElement)) return;
  const multiple = root.getAttribute("aria-multiselectable") === "true";
  root.setAttribute("role", "tree");
  const byId = new Map<string, Item>();

  const build = (list: HTMLUListElement, level: number): Item[] => {
    const lis = [...list.children].filter((el): el is HTMLLIElement => el instanceof HTMLLIElement);
    return lis.map((li, i) => {
      const group = li.querySelector<HTMLUListElement>(":scope > ul");
      let row = li.querySelector<HTMLElement>(":scope > .t-tree-row");
      if (!row) {
        row = h("div", { class: "t-tree-row" });
        row.append(...[...li.childNodes].filter((node) => node !== group));
        li.prepend(row);
      }
      const label = row.querySelector<HTMLElement>("a, .t-tree-label") ?? row;
      label.id ||= uid("t-tree");
      if (label instanceof HTMLAnchorElement) label.tabIndex = -1;
      const count = row.querySelector<HTMLElement>(".t-tree-count");
      if (count) count.id ||= uid("t-tree");
      const children = group ? build(group, level + 1) : [];
      // A list with no items yet is a branch whose children the page loads.
      const branch = group !== null;
      if (group) {
        group.classList.add("t-tree-group");
        group.setAttribute("role", "group");
        group.id ||= uid("t-tree");
      }
      row.prepend(h("span", { class: "t-tree-toggle" }, branch ? glyph(chevronRight) : null));
      li.classList.add("t-tree-item");
      li.setAttribute("role", "none");
      // The line is the tree item and owns the group next to it, so the name of an item is its own line.
      const disabled = li.getAttribute("aria-disabled") === "true";
      for (const [name, value] of Object.entries({
        role: "treeitem",
        "data-id": li.dataset.id ?? label.id,
        "aria-labelledby": count ? `${label.id} ${count.id}` : label.id,
        "aria-level": String(level),
        "aria-posinset": String(i + 1),
        "aria-setsize": String(lis.length),
        "aria-selected": String(li.hasAttribute("data-selected")),
        "aria-expanded": branch ? String(li.hasAttribute("data-open")) : undefined,
        "aria-owns": branch ? group?.id : undefined,
        "aria-disabled": disabled ? "true" : undefined,
      }))
        if (value !== undefined) row.setAttribute(name, value);
      li.removeAttribute("aria-disabled");
      row.tabIndex = -1;
      const item: Item = {
        id: row.dataset.id ?? label.id,
        label: (label.textContent ?? "").trim(),
        disabled,
        children: branch ? children : undefined,
        hasChildren: branch,
        li: row,
      };
      byId.set(item.id, item);
      return item;
    });
  };
  const items = build(root, 1);
  const all = [...byId.values()];
  const open = new Set(all.filter((i) => i.li.getAttribute("aria-expanded") === "true").map((i) => i.id));
  let selected = all.filter((i) => i.li.getAttribute("aria-selected") === "true").map((i) => i.id);
  const shown = () => shownItems(items, open);

  const tabStop = (id: string): void => {
    for (const item of all) item.li.tabIndex = item.id === id ? 0 : -1;
  };
  let focused = (shown().find((s) => selected.includes(s.item.id)) ?? shown()[0])?.item.id ?? "";
  tabStop(focused);

  const focus = (id: string): void => {
    focused = id;
    tabStop(id);
    byId.get(id)?.li.focus();
  };
  const setOpen = (item: Item, next: boolean): void => {
    if (!item.children) return;
    if (next) open.add(item.id);
    else open.delete(item.id);
    item.li.setAttribute("aria-expanded", String(next));
  };
  const select = (item: Item): void => {
    if (item.disabled) return;
    selected = choose(selected, item.id, multiple);
    for (const each of all) each.li.setAttribute("aria-selected", String(selected.includes(each.id)));
    root.dispatchEvent(new CustomEvent("t:select", { bubbles: true, detail: { ids: [...selected] } }));
  };

  root.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const row = target?.closest<HTMLElement>(".t-tree-row");
    if (!row || target?.closest(".t-tree-actions")) return;
    const item = byId.get(row.dataset.id ?? "");
    if (!item) return;
    focus(item.id);
    select(item);
    if (item.children) setOpen(item, !open.has(item.id));
  });
  root.addEventListener("focusin", (event) => {
    const row = event.target instanceof HTMLElement ? event.target : null;
    const id = row?.dataset.id;
    if (row?.getAttribute("role") === "treeitem" && id !== undefined && byId.has(id)) {
      focused = id;
      tabStop(id);
    }
  });

  let typed = "";
  let typedAt = 0;
  root.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLElement) || event.target.getAttribute("role") !== "treeitem") return;
    const item = byId.get(focused);
    if (!item) return;
    const { key } = event;
    if (key === "Enter" || key === " ") {
      event.preventDefault();
      const link = item.li.querySelector<HTMLAnchorElement>(":scope > a");
      if (key === "Enter" && link) {
        link.click();
        return;
      }
      select(item);
      if (key === "Enter" && item.children) setOpen(item, !open.has(item.id));
    } else if (TREE_KEYS.includes(key)) {
      event.preventDefault();
      const action = treeKey(key as TreeKey, focused, shown(), open);
      const target = action ? byId.get(action.id) : undefined;
      if (!action || !target) return;
      if (action.type === "focus") focus(target.id);
      else setOpen(target, action.type === "open");
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      typed = now - typedAt > TYPE_AHEAD_MS ? key : typed + key;
      typedAt = now;
      const id = typeAhead(shown(), focused, typed);
      if (id) focus(id);
    }
  });
});
