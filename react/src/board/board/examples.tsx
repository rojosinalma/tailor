import { useState } from "react";
import { Button } from "../../core/button/button";
import { Progress } from "../../core/progress/progress";
import { defineExamples } from "../../examples";
import { applyBoardMove, Board, type BoardCard, type BoardColumn } from "./board";

const COLUMNS: readonly BoardColumn[] = [
  { id: "backlog", title: "Backlog" },
  { id: "doing", title: "In progress", limit: 3, tone: "info" },
  { id: "review", title: "Review", limit: 2 },
  { id: "done", title: "Done", tone: "success" },
];

const CARDS: readonly BoardCard[] = [
  {
    id: "c1",
    columnId: "backlog",
    title: "Rotate TLS certificates",
    badges: [{ label: "security", tone: "danger" }],
  },
  { id: "c2", columnId: "backlog", title: "Move nas backups to the new bucket", assignee: "alice" },
  {
    id: "c3",
    columnId: "backlog",
    title: "Upgrade the database to 17",
    description: "db-1 first, then the replica",
  },
  { id: "c4", columnId: "doing", title: "Deploy web-2 behind the load balancer", assignee: "bob" },
  {
    id: "c5",
    columnId: "doing",
    title: "Add health checks to cache-1",
    badges: [{ label: "monitoring", tone: "info" }],
    assignee: "alice",
  },
  { id: "c6", columnId: "doing", title: "Pin the base image", to: "#pin-image" },
  { id: "c7", columnId: "doing", title: "Clean up old releases on web-1", assignee: "carol" },
  {
    id: "c8",
    columnId: "review",
    title: "New firewall rules for example.com",
    badges: [{ label: "network" }, { label: "urgent", tone: "warning" }],
    assignee: "bob",
  },
  { id: "c9", columnId: "review", title: "Log rotation for worker-1" },
  { id: "c10", columnId: "done", title: "Set the time zone to UTC everywhere", assignee: "carol" },
  { id: "c11", columnId: "done", title: "Restart policy for every service" },
  {
    id: "c12",
    columnId: "done",
    title: "Document the release steps",
    footer: (
      <Button variant="ghost" size="sm">
        Open notes
      </Button>
    ),
  },
];

let added = 0;

function Deploys({ withAdd = false, empty = false }: { withAdd?: boolean; empty?: boolean }) {
  const [cards, setCards] = useState(empty ? CARDS.filter((card) => card.columnId !== "review") : CARDS);
  return (
    <Board
      label="Deploy tasks"
      columns={COLUMNS}
      cards={cards}
      onMove={(move) => setCards((current) => applyBoardMove(current, move))}
      onAdd={
        withAdd
          ? (columnId) => {
              added += 1;
              setCards((current) => [
                ...current,
                { id: `new-${added}`, columnId, title: `New task ${added}` },
              ]);
            }
          : undefined
      }
    />
  );
}

const STEPS: Record<string, number> = { c4: 60, c5: 30, c6: 80, c7: 10 };

function CustomCards() {
  const [cards, setCards] = useState(
    CARDS.filter((card) => card.columnId === "doing" || card.columnId === "review"),
  );
  return (
    <Board
      label="Deploy progress"
      columns={COLUMNS.filter((column) => column.id === "doing" || column.id === "review")}
      cards={cards}
      onMove={(move) => setCards((current) => applyBoardMove(current, move))}
      renderCard={(card) => <Progress label="Done" value={STEPS[card.id] ?? 100} />}
    />
  );
}

export default defineExamples("board", [
  {
    id: "default",
    title: "Four columns",
    note: "Drag a card by its grip, or focus the grip and use Space and the arrow keys; left and right go to the next column. The menu on a card moves it too. In progress is over its limit.",
    render: () => <Deploys />,
  },
  {
    id: "add",
    title: "With an Add button and an empty column",
    render: () => <Deploys withAdd empty />,
  },
  {
    id: "custom",
    title: "Own card content",
    render: () => <CustomCards />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    note: "One column at a time, picked with the tabs; the card menu moves a card to another column.",
    width: "sm",
    render: () => <Deploys withAdd />,
  },
  {
    id: "frame",
    title: "Filling a page",
    note: "The columns scroll by themselves; the board scrolls sideways when they do not fit.",
    display: "frame",
    render: () => <Deploys withAdd />,
  },
]);
