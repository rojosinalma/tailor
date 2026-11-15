import { more } from "@tailor/core/glyphs.gen";
import type { Tone } from "@tailor/core/spec";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { Button } from "../button/button";
import { RelativeTime } from "../relative-time/relative-time";
import { StateLabel } from "../state-label/state-label";
import { Table, type TableColumn } from "./table";

interface Service {
  name: string;
  host: string;
  status: "running" | "degraded" | "stopped";
  image: string;
  updated: string;
  memory: number;
}

// Fixed dates, so the pages of both kits stay the same whenever they are built.

const services: Service[] = [
  {
    name: "web-1",
    host: "nas",
    status: "running",
    image: "nginx:1.27",
    updated: "2026-11-15T10:00:00Z",
    memory: 64,
  },
  {
    name: "api",
    host: "nas",
    status: "degraded",
    image: "example/api:3.4.1",
    updated: "2026-11-14T10:00:00Z",
    memory: 412,
  },
  {
    name: "db",
    host: "web-1",
    status: "running",
    image: "postgres:17",
    updated: "2026-11-06T12:00:00Z",
    memory: 1536,
  },
  {
    name: "backup-worker-with-a-long-name",
    host: "nas",
    status: "stopped",
    image: "example/backup:2026.11",
    updated: "2026-10-06T12:00:00Z",
    memory: 0,
  },
];

const TONE: Record<Service["status"], Tone> = { running: "success", degraded: "warning", stopped: "neutral" };
const LABEL: Record<Service["status"], string> = {
  running: "Running",
  degraded: "Degraded",
  stopped: "Stopped",
};

const columns: TableColumn<Service>[] = [
  { key: "name", header: "Name" },
  { key: "host", header: "Host" },
  {
    key: "status",
    header: "Status",
    render: (s) => <StateLabel tone={TONE[s.status]}>{LABEL[s.status]}</StateLabel>,
  },
  { key: "image", header: "Image", priority: "low" },
  { key: "memory", header: "Memory (MB)", kind: "num" },
  { key: "updated", header: "Updated", render: (s) => <RelativeTime date={s.updated} /> },
  {
    key: "actions",
    header: "Actions",
    kind: "actions",
    render: (s) => (
      <Button variant="ghost" size="sm" icon={<Glyph body={more} />} label={`Actions for ${s.name}`} />
    ),
  },
];

export default defineExamples("table", [
  {
    id: "default",
    title: "Services",
    note: "The image column has a low priority: it hides first when the box gets narrow. Below 40rem each row becomes a card.",
    render: () => (
      <Table
        caption="Services"
        columns={columns}
        rows={services}
        rowKey={(s) => s.name}
        rowTone={(s) => TONE[s.status]}
      />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    note: "The table follows its box, not the screen: in a box below 40rem each row is a card.",
    width: "sm",
    render: () => (
      <Table
        caption="Services"
        columns={columns}
        rows={services}
        rowKey={(s) => s.name}
        rowTone={(s) => TONE[s.status]}
      />
    ),
  },
  {
    id: "compact",
    title: "Compact",
    render: () => <Table density="compact" columns={columns} rows={services} rowKey={(s) => s.name} />,
  },
  {
    id: "scroll",
    title: "Scrolls in a narrow box",
    note: 'narrow="scroll": below 40rem the table keeps its columns and scrolls sideways inside its box.',
    width: "sm",
    render: () => (
      <Table caption="Services" narrow="scroll" columns={columns} rows={services} rowKey={(s) => s.name} />
    ),
  },
  {
    id: "widths",
    title: "Fixed widths and numbers",
    render: () => (
      <Table
        columns={[
          { key: "host", header: "Host", width: "xs" },
          { key: "cpu", header: "CPU (%)", kind: "num" },
          { key: "disk", header: "Disk (GB)", kind: "num" },
          { key: "note", header: "Note" },
        ]}
        rows={[
          { host: "nas", cpu: 12.5, disk: 1840, note: "Holds the backups of every host" },
          { host: "web-1", cpu: 3.25, disk: 42, note: "—" },
        ]}
        rowKey={(r) => r.host}
      />
    ),
  },
]);
