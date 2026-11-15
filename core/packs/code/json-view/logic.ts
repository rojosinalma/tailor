/** The tree model of the JSON view: nodes, which ones start open, the order that the arrow keys walk. */

export type JsonKind = "object" | "array" | "string" | "number" | "boolean" | "null";

export interface JsonNode {
  /** Unique within the tree: the keys from the root, as JSON. */
  readonly id: string;
  /** The key in the parent: a name, an array index, or null for the root. */
  readonly key: string | number | null;
  readonly value: unknown;
  readonly kind: JsonKind;
  /** 1 for the top level. */
  readonly level: number;
  /** The number of entries of an object or an array; 0 for anything else. */
  readonly size: number;
}

export function kindOf(value: unknown): JsonKind {
  if (Array.isArray(value)) return "array";
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") return "object";
  if (typeof value === "number" || typeof value === "bigint") return "number";
  if (typeof value === "boolean") return "boolean";
  return "string";
}

const isContainer = (kind: JsonKind): boolean => kind === "object" || kind === "array";

function makeNode(path: readonly (string | number)[], value: unknown): JsonNode {
  const kind = kindOf(value);
  const size =
    kind === "array"
      ? (value as unknown[]).length
      : kind === "object"
        ? Object.keys(value as object).length
        : 0;
  return { id: JSON.stringify(path), key: path.at(-1) ?? null, value, kind, level: path.length || 1, size };
}

const pathOf = (node: JsonNode): (string | number)[] => JSON.parse(node.id) as (string | number)[];

/** The entries of an object or an array; none for anything else. */
export function childrenOf(node: JsonNode): JsonNode[] {
  const path = pathOf(node);
  if (node.kind === "array") return (node.value as unknown[]).map((v, i) => makeNode([...path, i], v));
  if (node.kind === "object")
    return Object.entries(node.value as object).map(([k, v]) => makeNode([...path, k], v));
  return [];
}

export const canOpen = (node: JsonNode): boolean => isContainer(node.kind) && node.size > 0;

/**
 * The items of the top level: the entries of an object or an array with entries, or else the value itself
 * as one item.
 */
export function topLevel(value: unknown): JsonNode[] {
  const root = makeNode([], value);
  return canOpen(root) ? childrenOf(root) : [root];
}

/** The ids of the nodes that start open: those above the given depth (1 opens only the root). */
export function initialOpen(value: unknown, depth: number): Set<string> {
  const open = new Set<string>();
  const visit = (nodes: readonly JsonNode[]): void => {
    for (const node of nodes) {
      if (node.level >= depth || !canOpen(node)) continue;
      open.add(node.id);
      visit(childrenOf(node));
    }
  };
  visit(topLevel(value));
  return open;
}

/** The shown nodes in reading order: the order of the up and down arrows. */
export function visibleNodes(value: unknown, open: ReadonlySet<string>): JsonNode[] {
  const out: JsonNode[] = [];
  const visit = (nodes: readonly JsonNode[]): void => {
    for (const node of nodes) {
      out.push(node);
      if (open.has(node.id)) visit(childrenOf(node));
    }
  };
  visit(topLevel(value));
  return out;
}

/** The id of the parent, or null at the top level. */
export function parentId(id: string): string | null {
  const path = JSON.parse(id) as unknown[];
  return path.length > 1 ? JSON.stringify(path.slice(0, -1)) : null;
}

/** The text of a value that is not an object or an array. */
export const leafText = (node: JsonNode): string =>
  node.kind === "string" ? JSON.stringify(node.value) : String(node.value ?? "null");

export type TreeKey = "ArrowDown" | "ArrowUp" | "ArrowRight" | "ArrowLeft" | "Home" | "End";

/** What a key does in the tree: move the focus to a node, open one, or close one (the WAI-ARIA tree pattern). */
export type TreeAction =
  | { readonly type: "focus"; readonly id: string }
  | { readonly type: "open" | "close"; readonly id: string }
  | null;

export function treeKey(
  key: TreeKey,
  current: string,
  visible: readonly JsonNode[],
  open: ReadonlySet<string>,
): TreeAction {
  const index = visible.findIndex((n) => n.id === current);
  const node = visible[index];
  if (!node) return null;
  const at = (i: number): TreeAction => {
    const target = visible[i];
    return target ? { type: "focus", id: target.id } : null;
  };
  switch (key) {
    case "ArrowDown":
      return at(index + 1);
    case "ArrowUp":
      return at(index - 1);
    case "Home":
      return at(0);
    case "End":
      return at(visible.length - 1);
    case "ArrowRight":
      if (!canOpen(node)) return null;
      return open.has(node.id) ? at(index + 1) : { type: "open", id: node.id };
    case "ArrowLeft": {
      if (open.has(node.id)) return { type: "close", id: node.id };
      const parent = parentId(node.id);
      return parent ? { type: "focus", id: parent } : null;
    }
  }
}
