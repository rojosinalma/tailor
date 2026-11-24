import { Accessibility, Feedback, PointerActivationConstraints, PointerSensor } from "@dnd-kit/dom";
import { SortableKeyboardPlugin } from "@dnd-kit/dom/sortable";
import { DragDropProvider, KeyboardSensor, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { grip } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  announcement,
  type Lists,
  locate,
  move,
  moveBetween,
  type Place,
} from "@tailor/packs/sortable/sortable/logic";
import type spec from "@tailor/packs/sortable/sortable/spec";
import {
  Children,
  type ComponentProps,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "../../core/button/button";
import { Glyph } from "../../glyph";

type Orientation = (typeof spec.props.orientation)[number];
type ListTag = (typeof spec.props.as)[number];
type ItemTag = (typeof spec.props.itemAs)[number];

/** A move that a drop asks for: the item, the list it left, the list it lands in and its new index there. */
export interface SortableMove {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly index: number;
}

interface ListInfo {
  readonly label: string;
  readonly group: string;
  readonly dropId: string;
  readonly items: readonly string[];
}

interface Motion {
  readonly duration: number;
  readonly easing: string;
}

interface RootValue {
  readonly id: string;
  readonly lists: Map<string, ListInfo>;
  /** The SortableItem element of each item id, so that a list can show an item that came from another list. */
  readonly elements: Map<string, ReactElement<SortableItemProps>>;
  readonly handles: Map<string, HTMLElement>;
  readonly preview: Lists | null;
  readonly motion: Motion | null;
  readonly setMotion: (motion: Motion | null) => void;
  readonly instructions: string;
}

const RootContext = createContext<RootValue | null>(null);

interface ListValue {
  readonly listId: string;
  readonly group: string;
  readonly order: readonly string[];
  readonly handle: boolean;
  readonly disabled: boolean;
  readonly itemAs: ItemTag;
}

const ListContext = createContext<ListValue | null>(null);

interface ItemValue {
  readonly id: string;
  readonly label: string;
  readonly handleRef: (element: Element | null) => void;
  readonly disabled: boolean;
}

const ItemContext = createContext<ItemValue | null>(null);

const ITEM_TAG: Record<ListTag, ItemTag> = { div: "div", ul: "li", ol: "li", tbody: "tr" };

/**
 * The collision priorities of the list itself (CollisionPriority Low and Normal). Under its items, so a pointer
 * over an item finds the item; an empty list competes with the items of other lists, so the keyboard reaches it.
 */
const LIST_PRIORITY = { items: 1, empty: 2 } as const;

/** A drag starts after a few pixels with a mouse or a pen, after a short press on a touch screen. */
const pointer = PointerSensor.configure({
  activationConstraints: (event) =>
    event.pointerType === "touch"
      ? [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })]
      : [new PointerActivationConstraints.Distance({ value: 4 })],
});

const SENSORS = [pointer, KeyboardSensor];

type PluginList = Exclude<
  NonNullable<ComponentProps<typeof DragDropProvider>["plugins"]>,
  (...args: never) => unknown
>;

/** Reads a duration token such as "180ms" or "0.2s" in milliseconds. */
const toMs = (value: string): number => {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return 0;
  return value.trim().endsWith("ms") ? n : n * 1000;
};

/** The motion tokens of the element; null when motion is off (reduced motion sets the tokens to 0). */
const readMotion = (element: Element): Motion | null => {
  const style = getComputedStyle(element);
  const duration = toMs(style.getPropertyValue("--t-motion-base"));
  const easing = style.getPropertyValue("--t-ease").trim() || "ease";
  return duration > 0 ? { duration, easing } : null;
};

/**
 * Moving an element in the page takes the focus away from it: a keyboard move, a move to another list (which
 * mounts the item again) and the landing of a drop. The focus goes back to the handle, for a few frames at most.
 */
function refocus(handles: Map<string, HTMLElement>, id: string, dragging = false, frames = 30): void {
  requestAnimationFrame(() => {
    const handle = handles.get(id);
    const landed =
      handle?.isConnected && (dragging || !handle.closest("[data-dnd-dragging], [data-dnd-dropping]"));
    if (handle && landed) {
      if (document.activeElement !== handle) handle.focus();
      // While dragging, the list renders the move a little later: keep watching for the whole window.
      if ((document.activeElement === handle && !dragging) || frames <= 0) return;
    }
    if (frames > 0) refocus(handles, id, dragging, frames - 1);
  });
}

const snapshot = (lists: Map<string, ListInfo>): Lists =>
  Object.fromEntries([...lists].map(([id, list]) => [id, list.items]));

/** The drag context of one Sortable or of a SortableGroup. */
function Root({ onMove, children }: { onMove: (move: SortableMove) => void; children: ReactNode }) {
  const id = useId();
  const lists = useRef(new Map<string, ListInfo>()).current;
  const elements = useRef(new Map<string, ReactElement<SortableItemProps>>()).current;
  const handles = useRef(new Map<string, HTMLElement>()).current;
  const [preview, setPreviewState] = useState<Lists | null>(null);
  // The drag handlers read the order of this drag before it renders.
  const current = useRef<Lists | null>(null);
  const setPreview = (next: Lists | null): void => {
    current.current = next;
    setPreviewState(next);
  };
  const [motion, setMotion] = useState<Motion | null>(null);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const start = useRef<{ id: string; place: Place; keyboard: boolean } | null>(null);
  const instructions = `${id}-instructions`;

  useEffect(() => setMounted(true), []);

  const plugins = useMemo(
    () =>
      (defaults: PluginList): PluginList => [
        // The kit names, describes and announces the items itself, with its own texts.
        ...defaults.filter((plugin) => plugin !== Accessibility && plugin !== Feedback),
        Feedback.configure({ dropAnimation: motion ?? { duration: 0 }, keyboardTransition: motion }),
      ],
    [motion],
  );

  const labelOf = (item: string): string => elements.get(item)?.props.label ?? item;

  const say = (text: string): void => setMessage(text);

  const texts = {
    pickedUp: t("sortablePickedUp"),
    moved: t("sortableMoved"),
    movedList: t("sortableMovedList"),
  };

  const value = useMemo<RootValue>(
    () => ({ id, lists, elements, handles, preview, motion, setMotion, instructions }),
    [id, lists, elements, handles, preview, motion, instructions],
  );

  return (
    <RootContext value={value}>
      <DragDropProvider
        sensors={SENSORS}
        plugins={plugins}
        onDragStart={(event) => {
          const source = event.operation.source;
          if (!source) return;
          const item = String(source.id);
          const all = snapshot(lists);
          const place = locate(all, item);
          if (!place) return;
          const keyboard = event.nativeEvent instanceof KeyboardEvent;
          start.current = { id: item, place, keyboard };
          setPreview(all);
          say(
            announcement("pickedUp", texts, {
              label: labelOf(item),
              index: place.index,
              count: all[place.list]?.length ?? 0,
            }),
          );
        }}
        onDragOver={(event) => {
          const { source, target } = event.operation;
          if (!source || !target || source.id === target.id) return;
          // A move puts the item elsewhere in the page, or mounts it again in another list: the focus follows.
          if (start.current?.keyboard) refocus(handles, String(source.id), true);
          const order = current.current;
          if (!order) return;
          const item = String(source.id);
          const from = locate(order, item);
          if (!from) return;
          const targetId = String(target.id);
          const list = [...lists].find(([, info]) => info.dropId === targetId);
          const to: Place | null = list
            ? { list: list[0], index: from.list === list[0] ? from.index : (order[list[0]]?.length ?? 0) }
            : locate(order, targetId);
          if (!to || lists.get(to.list)?.group !== lists.get(from.list)?.group) return;
          const next = moveBetween(order, item, to.list, to.index);
          if (next === order) return;
          setPreview(next);
          const count = next[to.list]?.length ?? 0;
          say(
            announcement("moved", texts, {
              label: labelOf(item),
              index: Math.min(to.index, count - 1),
              count,
              list: to.list === from.list ? undefined : lists.get(to.list)?.label,
            }),
          );
        }}
        onDragEnd={(event) => {
          const began = start.current;
          start.current = null;
          const final = current.current;
          setPreview(null);
          if (!began) return;
          if (began.keyboard) refocus(handles, began.id);
          if (event.canceled || !final) {
            say(t("sortableCancelled"));
            return;
          }
          say(t("sortableDropped"));
          const place = locate(final, began.id);
          if (place && (place.list !== began.place.list || place.index !== began.place.index))
            onMove({ id: began.id, from: began.place.list, to: place.list, index: place.index });
        }}
      >
        {children}
      </DragDropProvider>
      {mounted
        ? createPortal(
            <>
              <div className="t-sr-only" role="status" aria-live="polite" aria-atomic="true">
                {message}
              </div>
              <div id={instructions} hidden>
                {t("sortableInstructions")}
              </div>
            </>,
            document.body,
          )
        : null}
    </RootContext>
  );
}

export interface SortableGroupProps {
  /** Called on a drop that changes the place of an item, inside one list or between two. The app applies it. */
  onMove: (move: SortableMove) => void;
  /** Sortable lists with a `listId`, anywhere inside. */
  children: ReactNode;
}

/** Lets items move between the Sortable lists inside it, by pointer, touch and keyboard. */
export function SortableGroup({ onMove, children }: SortableGroupProps) {
  return <Root onMove={onMove}>{children}</Root>;
}

interface SortableBase {
  /** The ids of the items, in order. The children are a SortableItem for each. */
  items: readonly string[];
  /** The accessible name of the list. */
  label: string;
  orientation?: Orientation;
  /** true (default): only the SortableHandle in an item starts a drag. false: the whole item does. */
  handle?: boolean;
  disabled?: boolean;
  /** The element of the list. Its items follow: li in a ul or an ol, tr in a tbody. */
  as?: ListTag;
  /** Shown when the list has no items. The list stays a drop target. */
  empty?: ReactNode;
  children?: ReactNode;
}

interface StandaloneProps extends SortableBase {
  /** Called with the new order after a drop. The app applies it. */
  onReorder: (items: string[]) => void;
  listId?: never;
  group?: never;
}

interface GroupedProps extends SortableBase {
  /** Names the list in the moves of its SortableGroup. */
  listId: string;
  /** Lists of the same group exchange items. Default: all lists of the SortableGroup. */
  group?: string;
  onReorder?: never;
}

export type SortableProps = StandaloneProps | GroupedProps;

/** A list whose items reorder by dragging, by touch and by keyboard. */
export function Sortable(props: SortableProps) {
  const root = use(RootContext);
  if (props.listId === undefined) {
    if (root) throw new Error("Sortable: a list inside a SortableGroup needs a listId");
    const { onReorder, items } = props;
    return (
      <Root onMove={({ id, index }) => onReorder(move(items, items.indexOf(id), index))}>
        <List {...props} listId="" group="" />
      </Root>
    );
  }
  if (!root) throw new Error("Sortable: a list with a listId belongs inside a SortableGroup");
  return <List {...props} listId={props.listId} group={props.group ?? ""} />;
}

function List({
  items,
  label,
  orientation = "vertical",
  handle = true,
  disabled = false,
  as = "div",
  empty,
  listId,
  group,
  children,
}: SortableBase & { listId: string; group: string }) {
  const root = use(RootContext);
  if (!root) throw new Error("Sortable: no drag context");
  const dropId = `${root.id}-list-${listId}`;
  const type = `${root.id}-group-${group}`;
  root.lists.set(listId, { label, group, dropId, items });

  // The items of this list by id; a list shows an item of another list while it is dragged over.
  for (const child of Children.toArray(children)) {
    if (isValidElement<SortableItemProps>(child) && typeof child.props.id === "string")
      root.elements.set(child.props.id, child);
  }

  const { lists } = root;
  useEffect(
    () => () => {
      lists.delete(listId);
    },
    [lists, listId],
  );

  const element = useRef<HTMLElement | null>(null);
  const { setMotion } = root;
  useLayoutEffect(() => {
    if (element.current) setMotion(readMotion(element.current));
  }, [setMotion]);

  const { ref } = useDroppable({
    id: dropId,
    type,
    accept: type,
    collisionPriority:
      (root.preview?.[listId] ?? items).length > 0 ? LIST_PRIORITY.items : LIST_PRIORITY.empty,
    disabled,
  });

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      element.current = node;
      ref(node);
    },
    [ref],
  );

  const order = root.preview?.[listId] ?? items;
  const itemAs = ITEM_TAG[as];
  const value = useMemo<ListValue>(
    () => ({ listId, group: type, order, handle, disabled, itemAs }),
    [listId, type, order, handle, disabled, itemAs],
  );

  const shown = order.map((item) => root.elements.get(item)).filter((child) => child !== undefined);
  const Tag = as;
  const tableRow = as === "tbody";
  return (
    <ListContext value={value}>
      <Tag
        ref={setRef as Ref<never>}
        className="t-sortable"
        // A <div> takes a name only with a role: a labelled group (ARIA 1.2).
        role={as === "div" ? "group" : undefined}
        aria-label={tableRow ? undefined : label}
        data-orientation={orientation === "vertical" ? undefined : orientation}
        data-handle={handle ? undefined : "false"}
        aria-disabled={disabled ? true : undefined}
      >
        {shown}
        {shown.length === 0 && empty !== undefined ? <Empty as={itemAs}>{empty}</Empty> : null}
      </Tag>
    </ListContext>
  );
}

function Empty({ as, children }: { as: ItemTag; children: ReactNode }) {
  if (as === "tr")
    return (
      <tr className="t-sortable-empty">
        <td colSpan={999}>{children}</td>
      </tr>
    );
  const Tag = as;
  return <Tag className="t-sortable-empty">{children}</Tag>;
}

export interface SortableItemProps {
  /** The id of the item, as in the `items` of its list. */
  id: string;
  /** The name of the item in the handle and the announcements. Default: the id. */
  label?: string;
  /** Leave out: the list sets it (li in a ul or an ol, tr in a tbody, else div). */
  as?: ItemTag;
  disabled?: boolean;
  children?: ReactNode;
}

/** One item of a Sortable. With a handle (the default), put a SortableHandle in it. */
export function SortableItem({ id, label = id, as, disabled = false, children }: SortableItemProps) {
  const root = use(RootContext);
  const list = use(ListContext);
  if (!root || !list) throw new Error("SortableItem: put it inside a Sortable");
  const off = disabled || list.disabled;
  const { ref, handleRef, isDragging, isDropping } = useSortable({
    id,
    index: list.order.indexOf(id),
    group: list.listId,
    type: list.group,
    accept: list.group,
    disabled: off,
    transition: root.motion ? { ...root.motion, idle: false } : null,
    plugins: [SortableKeyboardPlugin],
  });
  const item = useMemo<ItemValue>(
    () => ({ id, label, handleRef, disabled: off }),
    [id, label, handleRef, off],
  );
  const Tag = as ?? list.itemAs;
  const whole = !list.handle;
  const { handles } = root;
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      ref(node);
      if (whole) {
        if (node) handles.set(id, node);
        else handles.delete(id);
      }
    },
    [ref, whole, handles, id],
  );
  return (
    <ItemContext value={item}>
      <Tag
        ref={setRef as Ref<never>}
        className="t-sortable-item"
        data-dragging={isDragging ? "" : undefined}
        data-dropping={isDropping ? "" : undefined}
        // Without a handle the whole item takes the focus and the keys.
        {...(whole
          ? {
              tabIndex: off ? undefined : 0,
              role: Tag === "div" ? "button" : undefined,
              "aria-label": Tag === "div" ? t("sortableHandle").replace("{label}", label) : undefined,
              "aria-describedby": root.instructions,
              "aria-disabled": off ? true : undefined,
            }
          : {})}
      >
        {Tag === "li" ? <div className="t-sortable-row">{children}</div> : children}
      </Tag>
    </ItemContext>
  );
}

/** The grip that starts a drag of its item, by pointer, touch or keyboard. */
export function SortableHandle() {
  const root = use(RootContext);
  const item = use(ItemContext);
  if (!root || !item) throw new Error("SortableHandle: put it inside a SortableItem");
  const { handleRef, id: ownId } = item;
  const { handles } = root;
  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      handleRef(node);
      if (node) handles.set(ownId, node);
      else handles.delete(ownId);
    },
    [handleRef, handles, ownId],
  );
  return (
    <Button
      ref={setRef}
      className="t-sortable-handle"
      variant="ghost"
      size="sm"
      icon={<Glyph body={grip} />}
      label={t("sortableHandle").replace("{label}", item.label)}
      aria-describedby={root.instructions}
      disabled={item.disabled}
    />
  );
}
