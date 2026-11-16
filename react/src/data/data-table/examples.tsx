import { matchesFilter, matchesText, pageWindow, sortRows } from "@tailor/packs/data/data-table/logic";
import { useState } from "react";
import { Alert } from "../../core/alert/alert";
import { RelativeTime } from "../../core/relative-time/relative-time";
import { Stack } from "../../core/stack/stack";
import { StateLabel } from "../../core/state-label/state-label";
import { defineExamples } from "../../examples";
import { type DataBulkAction, type DataColumn, DataTable, type DataTableState } from "./data-table";
import { type Service, STATUS_LABEL, STATUS_TONE, services } from "./sample";

const all = services(300);
const few = services(8);

const columns: DataColumn<Service>[] = [
  { key: "name", header: "Name" },
  {
    key: "host",
    header: "Host",
    filter: {
      type: "select",
      options: ["db-1", "edge", "nas", "web-1", "web-2"].map((h) => ({ value: h, label: h })),
    },
  },
  {
    key: "status",
    header: "Status",
    filter: {
      type: "select",
      options: (["running", "degraded", "stopped"] as const).map((s) => ({
        value: s,
        label: STATUS_LABEL[s],
      })),
    },
    render: (s) => <StateLabel tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</StateLabel>,
  },
  { key: "image", header: "Image", priority: "low" },
  { key: "memory", header: "Memory (MB)", kind: "num" },
  { key: "updated", header: "Updated", render: (s) => <RelativeTime date={s.updated} /> },
];

function WithBulk({ narrow }: { narrow?: "scroll" }) {
  const [done, setDone] = useState("");
  const say = (verb: string) => (rows: Service[]) =>
    setDone(`${verb} ${rows.length}: ${rows.map((r) => r.name).join(", ")}`);
  const bulk: DataBulkAction<Service>[] = [
    { id: "restart", label: "Restart", onSelect: say("Restart") },
    { id: "stop", label: "Stop", tone: "danger", onSelect: say("Stop") },
  ];
  return (
    <Stack>
      <DataTable
        label="Services"
        columns={columns}
        rows={all}
        rowKey={(s) => s.id}
        selectable
        bulkActions={bulk}
        initialSort={[{ id: "name", desc: false }]}
        narrow={narrow}
      />
      {done ? <Alert tone="info">{done}</Alert> : null}
    </Stack>
  );
}

/** A stand-in for a server: it sorts, filters and pages the rows for the state it gets. */
function serverPage(state: DataTableState): { rows: Service[]; total: number } {
  const value = (row: Service, id: string): string => String(Reflect.get(row, id) ?? "");
  const matching = all.filter(
    (row) =>
      matchesText(`${row.name} ${row.host} ${row.image}`, state.search) &&
      Object.entries(state.filters).every(([id, filter]) => matchesFilter(value(row, id), filter, "select")),
  );
  const sorted = sortRows(matching, state.sort, value, (id) => (id === "memory" ? "num" : "text"));
  const page = pageWindow(state.page, state.pageSize, sorted.length);
  return { rows: sorted.slice(page.start, page.end), total: sorted.length };
}

function Server() {
  const [state, setState] = useState<DataTableState>({
    sort: [{ id: "memory", desc: true }],
    search: "",
    filters: {},
    page: 1,
    pageSize: 10,
  });
  const page = serverPage(state);
  return (
    <DataTable
      label="Services on the server"
      columns={columns}
      rows={page.rows}
      rowKey={(s) => s.id}
      manual={{ rowCount: page.total, state, onStateChange: setState }}
    />
  );
}

export default defineExamples("data-table", [
  {
    id: "default",
    title: "300 services",
    note: "Click a header to sort, Shift+click to add a second key. Select rows for the bulk actions; Shift+click a box selects a range.",
    render: () => <WithBulk />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    note: "Below 40rem each row is a card: sorting moves into the Sort by control, and every card keeps its box.",
    width: "sm",
    render: () => <WithBulk />,
  },
  {
    id: "scroll",
    title: "Scrolls in a narrow box",
    note: 'narrow="scroll": the columns stay and the table scrolls sideways in its box.',
    width: "sm",
    render: () => <WithBulk narrow="scroll" />,
  },
  {
    id: "compact",
    title: "Compact, ten rows a page",
    render: () => (
      <DataTable
        label="Compact services"
        columns={columns}
        rows={all}
        rowKey={(s) => s.id}
        density="compact"
        pageSize={10}
      />
    ),
  },
  {
    id: "server",
    kit: "react",
    title: "Server-side data",
    note: "With manual, the table shows the rows as they come and reports the sort, search, filters and page.",
    render: () => <Server />,
  },
  {
    id: "few",
    title: "A few rows, no search",
    render: () => (
      <DataTable label="A few services" columns={columns} rows={few} rowKey={(s) => s.id} search={false} />
    ),
  },
  {
    id: "filtered",
    title: "Opened on a filter",
    note: "initialFilters and initialSearch: the table starts on the degraded services on web-2 whose name holds “worker”.",
    render: () => (
      <DataTable
        label="Degraded workers on web-2"
        columns={columns}
        rows={few}
        rowKey={(s) => s.id}
        initialFilters={{ host: "web-2", status: "degraded" }}
        initialSearch="worker"
      />
    ),
  },
  {
    id: "no-matches",
    title: "A filter that matches nothing",
    note: "The table says so and offers Clear filters, which shows every row again.",
    render: () => (
      <DataTable
        label="Services, no match"
        columns={columns}
        rows={few}
        rowKey={(s) => s.id}
        initialSearch="nothing-like-this"
      />
    ),
  },
  {
    id: "loading",
    title: "Loading",
    render: () => (
      <DataTable label="Loading services" columns={columns} rows={[]} rowKey={(s) => s.id} loading />
    ),
  },
  {
    id: "error",
    title: "Error",
    render: () => (
      <DataTable
        label="Services with an error"
        columns={columns}
        rows={[]}
        rowKey={(s) => s.id}
        error="The server did not answer in time."
        onRetry={() => undefined}
      />
    ),
  },
  {
    id: "empty",
    title: "No rows",
    render: () => <DataTable label="No services" columns={columns} rows={[]} rowKey={(s) => s.id} />,
  },
]);
