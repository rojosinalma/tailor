import { more } from "@tailor/core/glyphs.gen";
import type { Tone } from "@tailor/core/spec";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { Button } from "../button/button";
import { RelativeTime } from "../relative-time/relative-time";
import { Table, type TableColumn } from "./table";

interface Service {
  name: string;
  host: string;
  status: "running" | "degraded" | "stopped";
  image: string;
  updated: string;
  memory: number;
}

const HOUR = 3_600_000;
const ago = (hours: number): string => new Date(Date.now() - hours * HOUR).toISOString();

const services: Service[] = [
  { name: "web-1", host: "nas", status: "running", image: "nginx:1.27", updated: ago(2), memory: 64 },
  { name: "api", host: "nas", status: "degraded", image: "example/api:3.4.1", updated: ago(26), memory: 412 },
  { name: "db", host: "web-1", status: "running", image: "postgres:17", updated: ago(24 * 9), memory: 1536 },
  {
    name: "backup-worker-with-a-long-name",
    host: "nas",
    status: "stopped",
    image: "example/backup:2026.11",
    updated: ago(24 * 40),
    memory: 0,
  },
];

const TONE: Record<Service["status"], Tone> = { running: "success", degraded: "warning", stopped: "neutral" };

const columns: TableColumn<Service>[] = [
  { key: "name", header: "Name" },
  { key: "host", header: "Host" },
  { key: "status", header: "Status" },
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
    id: "compact",
    title: "Compact",
    render: () => <Table density="compact" columns={columns} rows={services} rowKey={(s) => s.name} />,
  },
  {
    id: "scroll",
    title: "Scrolls in a narrow box",
    note: 'narrow="scroll": below 40rem the table keeps its columns and scrolls sideways inside its box.',
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
