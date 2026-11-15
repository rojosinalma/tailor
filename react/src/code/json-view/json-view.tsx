import { chevronRight } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  canOpen,
  childrenOf,
  initialOpen,
  type JsonNode,
  leafText,
  type TreeKey,
  topLevel,
  treeKey,
  visibleNodes,
} from "@tailor/packs/code/json-view/logic";
import { type KeyboardEvent, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CodeCopy } from "../../core/code-block/code-block";
import { Glyph } from "../../glyph";

export interface JsonViewProps {
  value: unknown;
  /** The name of the value, shown above the tree. */
  label: string;
  /** How many levels start open: 1 shows the top level closed, 2 opens it. */
  defaultExpandDepth?: number;
}

const TREE_KEYS: readonly string[] = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"];

function count(node: JsonNode): string {
  const one = node.size === 1;
  const text = node.kind === "array" ? t(one ? "jsonItem" : "jsonItems") : t(one ? "jsonKey" : "jsonKeys");
  const [open, close] = node.kind === "array" ? ["[", "]"] : ["{", "}"];
  return `${open} ${text.replace("{count}", String(node.size))} ${close}`;
}

const VALUE_CLASS = {
  string: "hljs-string",
  number: "hljs-number",
  boolean: "hljs-literal",
  null: "hljs-literal",
};

interface TreeState {
  readonly open: ReadonlySet<string>;
  readonly focused: string;
  readonly base: string;
  toggle(id: string): void;
}

function Item({
  node,
  position,
  total,
  tree,
}: {
  node: JsonNode;
  position: number;
  total: number;
  tree: TreeState;
}) {
  const openable = canOpen(node);
  const isOpen = openable && tree.open.has(node.id);
  // The entries sit next to their item and belong to it through aria-owns, so the name of an item is its own line.
  const groupId = `${tree.base}-${encodeURIComponent(node.id)}`;
  const children = isOpen ? childrenOf(node) : [];
  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the tree takes the keys of its items. */}
      <div
        className="t-json-item"
        role="treeitem"
        data-id={node.id}
        aria-level={node.level}
        aria-posinset={position}
        aria-setsize={total}
        aria-expanded={openable ? isOpen : undefined}
        aria-owns={isOpen ? groupId : undefined}
        tabIndex={node.id === tree.focused ? 0 : -1}
        onClick={openable ? () => tree.toggle(node.id) : undefined}
      >
        <span className="t-json-toggle">{openable ? <Glyph body={chevronRight} /> : null}</span>
        {typeof node.key === "number" ? (
          <span className="t-json-index">{node.key}: </span>
        ) : node.key !== null ? (
          <>
            <span className="hljs-attr">{JSON.stringify(node.key)}</span>
            <span className="hljs-punctuation">: </span>
          </>
        ) : null}
        {node.kind === "object" || node.kind === "array" ? (
          <span className="t-json-count">{count(node)}</span>
        ) : (
          <span className={VALUE_CLASS[node.kind]}>{leafText(node)}</span>
        )}
      </div>
      {isOpen ? (
        // biome-ignore lint/a11y/useSemanticElements: a group of tree items is not a fieldset.
        <div className="t-json-group" role="group" id={groupId}>
          {children.map((child, i) => (
            <Item key={child.id} node={child} position={i + 1} total={children.length} tree={tree} />
          ))}
        </div>
      ) : null}
    </>
  );
}

/** A JSON value as a tree: objects and arrays open and close, and only open ones render their entries. */
export function JsonView({ value, label, defaultExpandDepth = 1 }: JsonViewProps) {
  const base = useId();
  const tree = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<ReadonlySet<string>>(() => initialOpen(value, defaultExpandDepth));
  const top = useMemo(() => topLevel(value), [value]);
  const [focused, setFocused] = useState(() => top[0]?.id ?? "");
  // The item to focus after the next render, when the keyboard moved the focus.
  const pending = useRef<string | null>(null);

  useLayoutEffect(() => {
    const id = pending.current;
    pending.current = null;
    if (id === null) return;
    for (const item of tree.current?.querySelectorAll<HTMLElement>("[data-id]") ?? []) {
      if (item.dataset.id === id) item.focus();
    }
  });

  const toggle = (id: string): void => {
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
    setFocused(id);
    pending.current = id;
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const node = visibleNodes(value, open).find((n) => n.id === focused);
      if (node && canOpen(node)) toggle(node.id);
      return;
    }
    if (!TREE_KEYS.includes(event.key)) return;
    event.preventDefault();
    const action = treeKey(event.key as TreeKey, focused, visibleNodes(value, open), open);
    if (!action) return;
    if (action.type === "focus") {
      setFocused(action.id);
      pending.current = action.id;
    } else if ((action.type === "open") !== open.has(action.id)) {
      toggle(action.id);
    }
  };

  // A click on an item makes it the tab stop of the tree.
  const onFocus = (event: { target: EventTarget }): void => {
    const id = event.target instanceof HTMLElement ? event.target.dataset.id : undefined;
    if (id !== undefined) setFocused(id);
  };

  const state: TreeState = { open, focused, base, toggle };
  return (
    <div className="t-code t-json">
      <div className="t-code-header">
        <span className="t-code-title" id={`${base}-label`}>
          {label}
        </span>
        <CodeCopy text={JSON.stringify(value, null, 2)} />
      </div>
      <div
        className="t-json-tree"
        role="tree"
        aria-labelledby={`${base}-label`}
        ref={tree}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
      >
        {top.map((node, i) => (
          <Item key={node.id} node={node} position={i + 1} total={top.length} tree={state} />
        ))}
      </div>
    </div>
  );
}
