import { Tabs } from "@base-ui/react/tabs";
import { more, plus } from "@tailor/core/glyphs.gen";
import type { Tone } from "@tailor/core/spec";
import { t } from "@tailor/core/text";
import { type BoardMove, columnCards } from "@tailor/packs/board/board/logic";
import { fill } from "@tailor/packs/sortable/sortable/logic";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Avatar } from "../../core/avatar/avatar";
import { Badge } from "../../core/badge/badge";
import { Button } from "../../core/button/button";
import { Card } from "../../core/card/card";
import { Cluster } from "../../core/cluster/cluster";
import { Counter } from "../../core/counter/counter";
import { Menu } from "../../core/menu/menu";
import { Glyph } from "../../glyph";
import { Sortable, SortableGroup, SortableHandle, SortableItem } from "../../sortable/sortable/sortable";

export type { BoardMove } from "@tailor/packs/board/board/logic";
export { applyBoardMove } from "@tailor/packs/board/board/logic";

export interface BoardColumn {
  readonly id: string;
  readonly title: string;
  /** The most cards the column should hold. Over it, the count turns to the warning tone and says so. */
  readonly limit?: number;
  /** A thin edge in the tone over the column. */
  readonly tone?: Tone;
}

export interface BoardBadge {
  readonly label: string;
  readonly tone?: Tone;
}

export interface BoardCard {
  readonly id: string;
  readonly columnId: string;
  readonly title: string;
  readonly description?: string;
  readonly badges?: readonly BoardBadge[];
  /** The name of the person on the card; it shows as an avatar. */
  readonly assignee?: string;
  /** Makes the title a link to this address. */
  readonly to?: string;
  /** A row at the bottom of the card. */
  readonly footer?: ReactNode;
}

export interface BoardProps {
  /** The accessible name of the board. */
  label: string;
  columns: readonly BoardColumn[];
  /** The cards of every column, in order. */
  cards: readonly BoardCard[];
  /** Called when a card moves, by drag or by its menu. The app applies it, for example with applyBoardMove. */
  onMove: (move: BoardMove) => void;
  /** Shows an Add button under each column. */
  onAdd?: (columnId: string) => void;
  /** The body of a card in place of its badges and avatar. */
  renderCard?: (card: BoardCard) => ReactNode;
}

function Count({ count, limit }: { count: number; limit?: number }) {
  const over = limit !== undefined && count > limit;
  const text =
    limit === undefined
      ? String(count)
      : fill(t(over ? "boardOverLimit" : "boardCountLimit"), { count, limit });
  return (
    <span className="t-board-count">
      <Badge tone={over ? "warning" : "neutral"}>{text}</Badge>
    </span>
  );
}

interface CardViewProps {
  card: BoardCard;
  columns: readonly BoardColumn[];
  onMoveTo: (columnId: string) => void;
  renderCard?: (card: BoardCard) => ReactNode;
}

function CardView({ card, columns, onMoveTo, renderCard }: CardViewProps) {
  const others = columns.filter((column) => column.id !== card.columnId);
  const actions = (
    <>
      {others.length > 0 ? (
        <Menu
          label={t("boardMoveMenu")}
          align="end"
          trigger={
            <Button
              className="t-board-move"
              data-id={card.id}
              variant="ghost"
              size="sm"
              icon={<Glyph body={more} />}
              label={fill(t("boardMoveTo"), { title: card.title })}
            />
          }
          items={others.map((column) => ({
            id: column.id,
            label: column.title,
            onSelect: () => onMoveTo(column.id),
          }))}
        />
      ) : null}
      <SortableHandle />
    </>
  );
  const plain =
    card.badges?.length || card.assignee ? (
      <Cluster gap="2" justify="between">
        <Cluster gap="1">
          {card.badges?.map((badge) => (
            <Badge key={badge.label} tone={badge.tone}>
              {badge.label}
            </Badge>
          ))}
        </Cluster>
        {card.assignee ? <Avatar name={card.assignee} size="sm" /> : null}
      </Cluster>
    ) : undefined;
  const body = renderCard ? renderCard(card) : plain;
  const shared = { description: card.description, actions, footer: card.footer, children: body };
  return (
    <div className="t-board-card">
      {card.to === undefined ? (
        <Card title={card.title} {...shared} />
      ) : (
        <Card title={card.title} to={card.to} {...shared} />
      )}
    </div>
  );
}

/** A kanban board. Controlled: it reports each move and the app applies it. */
export function Board({ label, columns, cards, onMove, onAdd, renderCard }: BoardProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(columns[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [focusCard, setFocusCard] = useState<string | null>(null);
  const shown = columns.some((column) => column.id === selected) ? selected : (columns[0]?.id ?? "");

  // After a move by the menu the card is in another column: its menu button takes the focus again.
  useEffect(() => {
    if (focusCard === null) return;
    const button = [...(root.current?.querySelectorAll<HTMLElement>(".t-board-move") ?? [])].find(
      (element) => element.dataset.id === focusCard,
    );
    if (button) {
      button.focus();
      setFocusCard(null);
    }
  });

  const moveTo = (card: BoardCard, columnId: string): void => {
    const index = columnCards(cards, columnId).length;
    const column = columns.find((c) => c.id === columnId);
    onMove({ cardId: card.id, toColumnId: columnId, index });
    setSelected(columnId);
    setFocusCard(card.id);
    setMessage(
      fill(t("sortableMovedList"), {
        list: column?.title ?? columnId,
        position: index + 1,
        count: index + 1,
      }),
    );
  };

  return (
    <div className="t-board" ref={root}>
      <Tabs.Root
        className="t-tabs t-board-switch"
        value={shown}
        onValueChange={(value: string) => setSelected(value)}
      >
        <Tabs.List className="t-tabs-list" aria-label={`${label}: ${t("boardColumns")}`}>
          {columns.map((column) => {
            const count = columnCards(cards, column.id).length;
            const over = column.limit !== undefined && count > column.limit;
            return (
              <Tabs.Tab
                key={column.id}
                className="t-tab"
                value={column.id}
                aria-controls={`${id}-${column.id}`}
              >
                <span className="t-tab-label">{column.title}</span>
                <Counter value={count} tone={over ? "warning" : "neutral"} />
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </Tabs.Root>
      <SortableGroup onMove={({ id: cardId, to, index }) => onMove({ cardId, toColumnId: to, index })}>
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls sideways takes the focus, so the keyboard can scroll it. */}
        <section className="t-board-columns" aria-label={label} tabIndex={0}>
          {columns.map((column) => {
            const mine = columnCards(cards, column.id);
            const titleId = `${id}-${column.id}-title`;
            return (
              <section
                key={column.id}
                id={`${id}-${column.id}`}
                className="t-board-column"
                aria-labelledby={titleId}
                data-tone={column.tone}
                data-selected={column.id === shown ? "" : undefined}
              >
                <header className="t-board-column-header">
                  <h2 className="t-board-column-title" id={titleId}>
                    {column.title}
                  </h2>
                  <Count count={mine.length} limit={column.limit} />
                </header>
                <div className="t-board-column-body">
                  <Sortable
                    listId={column.id}
                    label={column.title}
                    items={mine.map((card) => card.id)}
                    empty={t("boardEmpty")}
                  >
                    {mine.map((card) => (
                      <SortableItem key={card.id} id={card.id} label={card.title}>
                        <CardView
                          card={card}
                          columns={columns}
                          onMoveTo={(to) => moveTo(card, to)}
                          renderCard={renderCard}
                        />
                      </SortableItem>
                    ))}
                  </Sortable>
                  {onAdd ? (
                    <div className="t-board-column-footer">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Glyph body={plus} />}
                        aria-label={fill(t("boardAddTo"), { column: column.title })}
                        onClick={() => onAdd(column.id)}
                      >
                        {t("boardAdd")}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </section>
      </SortableGroup>
      <div className="t-sr-only" role="status" aria-live="polite">
        {message}
      </div>
    </div>
  );
}
