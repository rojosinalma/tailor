import { useState } from "react";
import { Badge } from "../../core/badge/badge";
import { Card } from "../../core/card/card";
import { Chip } from "../../core/chip/chip";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { Sortable, SortableGroup, SortableHandle, SortableItem, type SortableMove } from "./sortable";

const HOSTS = ["web-1", "web-2", "db-1", "cache-1", "nas"];

const ROLE: Record<string, string> = {
  "web-1": "Web server",
  "web-2": "Web server",
  "db-1": "Database",
  "cache-1": "Cache",
  nas: "File storage",
  "backup-1": "Backups",
  "worker-1": "Jobs",
  "worker-2": "Jobs",
};

function ListRows({ disabled = false }: { disabled?: boolean }) {
  const [items, setItems] = useState(HOSTS);
  return (
    <Sortable as="ul" items={items} onReorder={setItems} label="Boot order" disabled={disabled}>
      {items.map((id) => (
        <SortableItem key={id} id={id}>
          <SortableHandle />
          <Stack gap="0">
            <strong>{id}</strong>
            <span>{ROLE[id]}</span>
          </Stack>
          <Badge tone={id === "db-1" ? "warning" : "success"}>{id === "db-1" ? "degraded" : "running"}</Badge>
        </SortableItem>
      ))}
    </Sortable>
  );
}

function TableRows() {
  const [items, setItems] = useState(HOSTS);
  return (
    <div className="t-table-wrap">
      <table className="t-table">
        <caption>Failover order</caption>
        <thead>
          <tr>
            <th scope="col" data-kind="actions">
              Order
            </th>
            <th scope="col">Host</th>
            <th scope="col">Role</th>
            <th scope="col" data-kind="num">
              Weight
            </th>
          </tr>
        </thead>
        <Sortable as="tbody" items={items} onReorder={setItems} label="Failover order">
          {items.map((id, index) => (
            <SortableItem key={id} id={id}>
              <td data-kind="actions" data-label="Order">
                <SortableHandle />
              </td>
              <th scope="row">{id}</th>
              <td data-label="Role">{ROLE[id]}</td>
              <td data-kind="num" data-label="Weight">
                {100 - index * 10}
              </td>
            </SortableItem>
          ))}
        </Sortable>
      </table>
    </div>
  );
}

function CardGrid() {
  const [items, setItems] = useState(["web-1", "web-2", "db-1", "cache-1", "nas", "backup-1"]);
  return (
    <Sortable orientation="grid" items={items} onReorder={setItems} label="Dashboard tiles">
      {items.map((id) => (
        <SortableItem key={id} id={id}>
          <Card title={id} description={ROLE[id]} actions={<SortableHandle />}>
            Uptime 14 days
          </Card>
        </SortableItem>
      ))}
    </Sortable>
  );
}

function ChipRow() {
  const [items, setItems] = useState(["production", "eu-west", "web", "nginx", "monitored"]);
  return (
    <Sortable orientation="horizontal" handle={false} items={items} onReorder={setItems} label="Tags">
      {items.map((id) => (
        <SortableItem key={id} id={id}>
          <Chip>{id}</Chip>
        </SortableItem>
      ))}
    </Sortable>
  );
}

const POOLS: Record<string, string[]> = {
  active: ["web-1", "web-2", "worker-1"],
  standby: ["worker-2", "backup-1"],
  retired: [],
};

const POOL_NAME: Record<string, string> = { active: "Active", standby: "Standby", retired: "Retired" };

function Pools() {
  const [lists, setLists] = useState(POOLS);
  const apply = ({ id, from, to, index }: SortableMove): void =>
    setLists((current) => {
      const next = { ...current, [from]: (current[from] ?? []).filter((item) => item !== id) };
      const target = [...(next[to] ?? [])];
      target.splice(index, 0, id);
      return { ...next, [to]: target };
    });
  return (
    <SortableGroup onMove={apply}>
      <Stack gap="4">
        {Object.entries(lists).map(([listId, items]) => (
          <Stack key={listId} gap="2">
            <strong>{POOL_NAME[listId]}</strong>
            <Sortable
              as="ul"
              listId={listId}
              items={items}
              label={POOL_NAME[listId] ?? listId}
              empty="No hosts"
            >
              {items.map((id) => (
                <SortableItem key={id} id={id}>
                  <SortableHandle />
                  <span>{id}</span>
                </SortableItem>
              ))}
            </Sortable>
          </Stack>
        ))}
      </Stack>
    </SortableGroup>
  );
}

export default defineExamples("sortable", [
  {
    id: "list",
    title: "Rows of a list",
    note: "Drag the grip, or focus it and press Space, the arrow keys and Space again. Escape puts the row back.",
    render: () => <ListRows />,
  },
  {
    id: "table",
    title: "Rows of a table",
    render: () => <TableRows />,
  },
  {
    id: "grid",
    title: "Cards in a grid",
    render: () => <CardGrid />,
  },
  {
    id: "chips",
    title: "Chips in a row, without a handle",
    note: "The whole chip drags. The arrow keys move a focused chip after Space.",
    render: () => <ChipRow />,
  },
  {
    id: "group",
    title: "Between lists",
    note: "The left and right arrow keys, or up past the first row and down past the last, move to the next list.",
    render: () => <Pools />,
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <ListRows disabled />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <ListRows />,
  },
]);
