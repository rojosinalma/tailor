import { chevronRight } from "@tailor/core/glyphs.gen";
import {
  choose,
  isBranch,
  type ShownItem,
  shownItems,
  TREE_KEYS,
  type TreeKey,
  treeKey,
  typeAhead,
} from "@tailor/packs/data/tree-view/logic";
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Counter } from "../../core/counter/counter";
import { Spinner } from "../../core/spinner/spinner";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { AppLink } from "../../link";

export interface TreeNode {
  /** Unique in the tree. */
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly children?: readonly TreeNode[];
  /** A branch whose children load on first open, through onLoadChildren. */
  readonly hasChildren?: boolean;
  readonly disabled?: boolean;
  /** A number after the label, such as the unread items. */
  readonly counter?: number;
  /** Makes the label a link. */
  readonly to?: string;
}

export interface TreeViewProps {
  /** The accessible name of the tree. */
  label: string;
  nodes: readonly TreeNode[];
  /** The ids of the selected items; one at most unless `multiple`. */
  selected?: readonly string[];
  defaultSelected?: readonly string[];
  onSelectedChange?: (selected: string[]) => void;
  /** The ids of the open branches. */
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  onExpandedChange?: (expanded: string[]) => void;
  multiple?: boolean;
  /** Buttons for an item, shown on the selected item and under the pointer. */
  renderActions?: (node: TreeNode) => ReactNode;
  /** Loads the children of a branch with `hasChildren`; a spinner row shows until they are there. */
  onLoadChildren?: (id: string) => void;
}

const TYPE_AHEAD_MS = 600;

const idPart = (id: string): string => encodeURIComponent(id).replace(/%/g, "_");

function useControlled(
  value: readonly string[] | undefined,
  initial: readonly string[] | undefined,
  onChange: ((next: string[]) => void) | undefined,
): [readonly string[], (next: string[]) => void] {
  const [inner, setInner] = useState<readonly string[]>(initial ?? []);
  return [
    value ?? inner,
    (next) => {
      if (value === undefined) setInner(next);
      onChange?.(next);
    },
  ];
}

interface Shared {
  readonly base: string;
  readonly open: ReadonlySet<string>;
  readonly selected: readonly string[];
  readonly focused: string;
  readonly isStatic: boolean;
  readonly renderActions?: (node: TreeNode) => ReactNode;
}

function Items({ nodes, level, tree }: { nodes: readonly TreeNode[]; level: number; tree: Shared }) {
  return nodes.map((node, i) => {
    const branch = isBranch(node);
    const isOpen = branch && tree.open.has(node.id);
    const labelId = `${tree.base}-${idPart(node.id)}`;
    const isSelected = tree.selected.includes(node.id);
    const live = !tree.isStatic;
    const label = node.to ? (
      <AppLink to={node.to} className="t-tree-label" id={labelId} tabIndex={live ? -1 : undefined}>
        {node.label}
      </AppLink>
    ) : (
      <span className="t-tree-label" id={labelId}>
        {node.label}
      </span>
    );
    const children = node.children ?? [];
    const countId = `${labelId}-count`;
    const groupId = `${labelId}-group`;
    const content = (
      <>
        {live ? <span className="t-tree-toggle">{branch ? <Glyph body={chevronRight} /> : null}</span> : null}
        {node.icon ? <span className="t-tree-icon">{node.icon}</span> : null}
        {label}
        {node.counter !== undefined ? " " : null}
        {node.counter !== undefined ? (
          <span className="t-tree-count" id={countId}>
            <Counter value={node.counter} />
          </span>
        ) : null}
        {tree.renderActions ? <span className="t-tree-actions">{tree.renderActions(node)}</span> : null}
      </>
    );
    const group =
      branch && (isOpen || tree.isStatic) ? (
        <ul className="t-tree-group" id={live ? groupId : undefined} {...(live ? { role: "group" } : {})}>
          {node.children === undefined && live ? (
            <li className="t-tree-loading" role="none">
              <Spinner size="sm" />
            </li>
          ) : (
            <Items nodes={children} level={level + 1} tree={tree} />
          )}
        </ul>
      ) : null;
    if (!live)
      return (
        <li
          key={node.id}
          className="t-tree-item"
          data-id={node.id}
          data-open={isOpen ? "" : undefined}
          data-selected={isSelected ? "" : undefined}
          aria-disabled={node.disabled ? true : undefined}
        >
          <div className="t-tree-row">{content}</div>
          {group}
        </li>
      );
    // The line is the tree item and owns the group next to it, so the name of an item is its own line.
    return (
      <li key={node.id} className="t-tree-item" role="none">
        <div
          className="t-tree-row"
          role="treeitem"
          data-id={node.id}
          aria-labelledby={node.counter !== undefined ? `${labelId} ${countId}` : labelId}
          aria-level={level}
          aria-posinset={i + 1}
          aria-setsize={nodes.length}
          aria-expanded={branch ? isOpen : undefined}
          aria-selected={isSelected}
          aria-disabled={node.disabled ? true : undefined}
          aria-owns={group ? groupId : undefined}
          tabIndex={node.id === tree.focused ? 0 : -1}
        >
          {content}
        </div>
        {group}
      </li>
    );
  });
}

/** A tree of nested items with one tab stop: the arrow keys move, open and close; Enter and Space select. */
export function TreeView({
  label,
  nodes,
  selected: selectedProp,
  defaultSelected,
  onSelectedChange,
  expanded,
  defaultExpanded,
  onExpandedChange,
  multiple = false,
  renderActions,
  onLoadChildren,
}: TreeViewProps) {
  const isStatic = useIsStatic();
  const base = useId();
  const root = useRef<HTMLUListElement>(null);
  const [openList, setOpenList] = useControlled(expanded, defaultExpanded, onExpandedChange);
  const [selected, setSelected] = useControlled(selectedProp, defaultSelected, onSelectedChange);
  const open = useMemo(() => new Set(openList), [openList]);
  const shown = useMemo(() => shownItems(nodes, open), [nodes, open]);
  const [focusedState, setFocused] = useState<string | null>(null);
  const focused =
    focusedState !== null && shown.some((s) => s.item.id === focusedState)
      ? focusedState
      : ((shown.find((s) => selected.includes(s.item.id)) ?? shown[0])?.item.id ?? "");
  const pending = useRef<string | null>(null);
  const typed = useRef({ text: "", at: 0 });

  useLayoutEffect(() => {
    const id = pending.current;
    pending.current = null;
    if (id === null) return;
    for (const item of root.current?.querySelectorAll<HTMLElement>("[role=treeitem]") ?? [])
      if (item.dataset.id === id) item.focus();
  });

  const focus = (id: string): void => {
    setFocused(id);
    pending.current = id;
  };

  const setOpen = (node: TreeNode, next: boolean): void => {
    if (next === open.has(node.id)) return;
    setOpenList(next ? [...openList, node.id] : openList.filter((id) => id !== node.id));
    if (next && node.children === undefined && node.hasChildren) onLoadChildren?.(node.id);
  };

  const select = (node: TreeNode): void => {
    if (!node.disabled) setSelected(choose(selected, node.id, multiple));
  };

  const onClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    // A click on an action is the action's own.
    if (!target || target.closest(".t-tree-actions")) return;
    const id = target.closest<HTMLElement>(".t-tree-row")?.dataset.id;
    const node = id === undefined ? undefined : find(id)?.item;
    if (!node) return;
    focus(node.id);
    select(node);
    if (isBranch(node)) setOpen(node, !open.has(node.id));
  };

  const find = (id: string): ShownItem<TreeNode> | undefined => shown.find((s) => s.item.id === id);

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>): void => {
    if (!(event.target instanceof HTMLElement) || event.target.getAttribute("role") !== "treeitem") return;
    const here = find(focused);
    if (!here) return;
    const { key } = event;
    if (key === "Enter" || key === " ") {
      event.preventDefault();
      if (key === "Enter" && here.item.to) {
        event.target.querySelector<HTMLElement>(":scope > a")?.click();
        return;
      }
      select(here.item);
      if (key === "Enter" && here.branch) setOpen(here.item, !open.has(here.item.id));
      return;
    }
    if (TREE_KEYS.includes(key)) {
      event.preventDefault();
      const action = treeKey(key as TreeKey, focused, shown, open);
      if (!action) return;
      const target = find(action.id);
      if (action.type === "focus") focus(action.id);
      else if (target) setOpen(target.item, action.type === "open");
      return;
    }
    if (key.length === 1 && key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      typed.current = {
        text: now - typed.current.at > TYPE_AHEAD_MS ? key : typed.current.text + key,
        at: now,
      };
      const id = typeAhead(shown, focused, typed.current.text);
      if (id) focus(id);
    }
  };

  const tree: Shared = { base, open, selected, focused, isStatic, renderActions };
  if (isStatic)
    return (
      <ul
        className="t-tree"
        data-t="tree"
        aria-label={label}
        // The script makes the list a tree, which takes this attribute.
        {...(multiple ? { "aria-multiselectable": true } : {})}
      >
        <Items nodes={nodes} level={1} tree={tree} />
      </ul>
    );
  return (
    <ul
      className="t-tree"
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: a tree of nested lists, as the WAI-ARIA pattern shows.
      role="tree"
      aria-label={label}
      aria-multiselectable={multiple ? true : undefined}
      ref={root}
      onKeyDown={onKeyDown}
      onClick={onClick}
      onFocus={(event) => {
        const id = event.target instanceof HTMLElement ? event.target.dataset.id : undefined;
        if (id !== undefined && event.target.getAttribute("role") === "treeitem") setFocused(id);
      }}
    >
      <Items nodes={nodes} level={1} tree={tree} />
    </ul>
  );
}
