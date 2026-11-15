import { defineExamples } from "../../examples";
import { JsonView } from "./json-view";

const response = {
  hosts: [
    { name: "web-1", address: "192.0.2.10", up: true, ports: [80, 443], tags: { role: "web", zone: "a" } },
    { name: "nas", address: "192.0.2.20", up: false, ports: [], tags: { role: "storage", zone: "b" } },
  ],
  total: 2,
  next: null,
  updated: "2026-11-15T12:00:00Z",
};

const events = Array.from({ length: 340 }, (_, i) => ({
  id: i + 1,
  host: i % 2 ? "nas" : "web-1",
  status: i % 7 ? "ok" : "failed",
}));

const note = {
  host: "web-1",
  note: "The certificate for example.com renews on its own every sixty days; the renewal job writes its log to /var/log/renew.log and sends a notice to alice@example.com when it fails.",
  key: "c2VydmVyLWtleS1leGFtcGxlLWRhdGEtdGhhdC1ydW5zLWxvbmctZW5vdWdoLXRvLXdyYXAtaW4tYS1uYXJyb3ctYm94",
};

export default defineExamples("json-view", [
  {
    id: "response",
    title: "An API response",
    note: "Arrow keys: right opens, left closes or goes to the parent, up and down move.",
    render: () => <JsonView label="GET /api/hosts" value={response} />,
  },
  {
    id: "open",
    title: "Three levels open, the root counted",
    render: () => <JsonView label="GET /api/hosts" value={response} defaultExpandDepth={3} />,
  },
  {
    id: "large",
    title: "A large array",
    note: "Entries render only when their node opens.",
    render: () => <JsonView label="Events" value={{ events, total: events.length }} />,
  },
  {
    id: "long",
    title: "Long strings wrap",
    render: () => <JsonView label="Note" value={note} defaultExpandDepth={2} />,
  },
  {
    id: "plain",
    title: "A plain value",
    render: () => <JsonView label="Status" value="ok" />,
  },
  {
    id: "empty",
    title: "An empty object",
    render: () => <JsonView label="Labels" value={{}} />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <JsonView label="GET /api/hosts" value={response} defaultExpandDepth={3} />,
  },
]);
