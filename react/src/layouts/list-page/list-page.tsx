import { more } from "@tailor/core/glyphs.gen";
import type { Tone } from "@tailor/core/spec";
import { Button } from "../../core/button/button";
import { Icon } from "../../core/icon/icon";
import { Menu } from "../../core/menu/menu";
import { Page, type PageAction } from "../../core/page/page";
import { RelativeTime } from "../../core/relative-time/relative-time";
import { StateLabel } from "../../core/state-label/state-label";
import { useToast } from "../../core/toast/toast";
import { type DataBulkAction, type DataColumn, DataTable } from "../../data/data-table/data-table";
import { Glyph } from "../../glyph";

// Sample data: replace with the records of the app.

export interface ServiceRow {
  readonly id: string;
  readonly name: string;
  readonly host: string;
  readonly status: "running" | "degraded" | "stopped";
  readonly image: string;
  readonly memory: number;
  readonly updated: string;
}

export const SERVICE_STATUS: Record<ServiceRow["status"], { readonly tone: Tone; readonly label: string }> = {
  running: { tone: "success", label: "Running" },
  degraded: { tone: "warning", label: "Degraded" },
  stopped: { tone: "neutral", label: "Stopped" },
};

export const SERVICE_ROWS: readonly ServiceRow[] = [
  {
    id: "api",
    name: "api",
    host: "web-1",
    status: "degraded",
    image: "example/api:3.4.1",
    memory: 812,
    updated: "2026-11-15T11:48:00Z",
  },
  {
    id: "web",
    name: "web",
    host: "web-1",
    status: "running",
    image: "nginx:1.27",
    memory: 96,
    updated: "2026-11-15T10:12:00Z",
  },
  {
    id: "worker",
    name: "worker",
    host: "web-2",
    status: "running",
    image: "example/worker:3.4.1",
    memory: 1240,
    updated: "2026-11-15T09:30:00Z",
  },
  {
    id: "cache",
    name: "cache",
    host: "web-2",
    status: "running",
    image: "redis:7.4",
    memory: 384,
    updated: "2026-11-14T22:05:00Z",
  },
  {
    id: "db",
    name: "db",
    host: "db-1",
    status: "running",
    image: "postgres:17",
    memory: 1890,
    updated: "2026-11-14T18:40:00Z",
  },
  {
    id: "queue",
    name: "queue",
    host: "db-1",
    status: "running",
    image: "rabbitmq:4.0",
    memory: 512,
    updated: "2026-11-14T16:00:00Z",
  },
  {
    id: "auth",
    name: "auth",
    host: "web-1",
    status: "running",
    image: "example/auth:1.9.0",
    memory: 210,
    updated: "2026-11-13T14:22:00Z",
  },
  {
    id: "search",
    name: "search",
    host: "web-2",
    status: "degraded",
    image: "opensearch:2.18",
    memory: 1720,
    updated: "2026-11-13T09:15:00Z",
  },
  {
    id: "mail",
    name: "mail",
    host: "edge",
    status: "running",
    image: "example/mail:2.2.0",
    memory: 148,
    updated: "2026-11-12T20:48:00Z",
  },
  {
    id: "backup",
    name: "backup",
    host: "nas",
    status: "stopped",
    image: "example/backup:2026.11",
    memory: 0,
    updated: "2026-11-12T02:00:00Z",
  },
  {
    id: "metrics",
    name: "metrics",
    host: "nas",
    status: "running",
    image: "prometheus:3.0",
    memory: 640,
    updated: "2026-11-11T13:37:00Z",
  },
  {
    id: "proxy",
    name: "proxy",
    host: "edge",
    status: "running",
    image: "haproxy:3.1",
    memory: 64,
    updated: "2026-11-10T08:00:00Z",
  },
  {
    id: "files",
    name: "files",
    host: "nas",
    status: "running",
    image: "example/files:1.4.2",
    memory: 330,
    updated: "2026-11-09T17:25:00Z",
  },
  {
    id: "status",
    name: "status",
    host: "edge",
    status: "stopped",
    image: "example/status:0.9.1",
    memory: 0,
    updated: "2026-11-08T11:11:00Z",
  },
];

/** The list of services, with filters: the most common page of an app. */
export function ListPageLayout() {
  const toast = useToast();
  const say = (message: string) => () => toast("info", message);

  // Each row's own actions sit in one menu at the end of the row, so the row stays one line wide.
  // The HTML kit marks each item with data-id; the app's script handles the click.
  const rowMenu = (row: ServiceRow) => (
    <Menu
      label={`Actions for ${row.name}`}
      align="end"
      trigger={
        <Button variant="ghost" size="sm" icon={<Glyph body={more} />} label={`Actions for ${row.name}`} />
      }
      items={[
        { id: "open", label: "Open", to: `#services/${row.id}` },
        { id: "logs", label: "Logs", to: `#services/${row.id}/logs` },
        { id: "restart", label: "Restart", onSelect: say(`${row.name} restarts.`) },
        { type: "separator" },
        { id: "remove", label: "Remove", tone: "danger", onSelect: say(`${row.name} would be removed.`) },
      ]}
    />
  );

  const columns: DataColumn<ServiceRow>[] = [
    // The first text column names the row: it is the row header, and the title of the card on a phone.
    { key: "name", header: "Name" },
    { key: "host", header: "Host" },
    {
      key: "status",
      header: "Status",
      // One filter, on the column people ask about most. The search covers the rest.
      filter: {
        type: "select",
        options: Object.entries(SERVICE_STATUS).map(([value, s]) => ({ value, label: s.label })),
      },
      render: (row) => (
        <StateLabel tone={SERVICE_STATUS[row.status].tone}>{SERVICE_STATUS[row.status].label}</StateLabel>
      ),
    },
    // A long, less important value hides first when the table gets narrow.
    { key: "image", header: "Image", priority: "low" },
    { key: "memory", header: "Memory (MB)", kind: "num" },
    { key: "updated", header: "Updated", render: (row) => <RelativeTime date={row.updated} /> },
    { key: "actions", header: "", kind: "actions", render: rowMenu },
  ];

  // Bulk actions show in the toolbar while rows are selected; the HTML kit fires t:bulk with the ids.
  const bulk: DataBulkAction<ServiceRow>[] = [
    {
      id: "restart",
      label: "Restart",
      onSelect: (rows) => toast("info", `${rows.length} services restart.`),
    },
    {
      id: "stop",
      label: "Stop",
      tone: "danger",
      onSelect: (rows) => toast("info", `${rows.length} services would stop.`),
    },
  ];

  // The page actions that are not the main one: buttons in a wide page, one menu on a phone.
  const moreActions: PageAction[] = [
    { id: "import", label: "Import", icon: <Icon name="bi:upload" /> },
    { id: "export", label: "Export", icon: <Icon name="bi:download" /> },
  ];

  return (
    <Page
      title="Services"
      description="What runs on every host."
      // The one primary action of the page stays visible at every width.
      primaryAction={
        <Button variant="primary" icon={<Icon name="bi:plus-lg" />}>
          Add service
        </Button>
      }
      moreActions={moreActions}
    >
      {/* The table brings its own toolbar, pages and empty states: nothing else is needed around it. */}
      <DataTable
        label="Services"
        columns={columns}
        rows={SERVICE_ROWS}
        rowKey={(row) => row.id}
        search
        selectable
        bulkActions={bulk}
        initialSort={[{ id: "name", desc: false }]}
        pageSize={10}
      />
    </Page>
  );
}
