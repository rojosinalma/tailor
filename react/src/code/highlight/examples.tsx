import { defineExamples } from "../../examples";
import { Highlight } from "./highlight";

const query = `-- Hosts that have not reported in the last hour
SELECT name, address, last_seen
FROM hosts
WHERE last_seen < now() - interval '1 hour'
  AND role = 'web'
ORDER BY last_seen DESC
LIMIT 20;`;

const compose = `services:
  web-1:
    image: nginx:1.27
    ports:
      - "8080:80"
    environment:
      TZ: UTC
      WORKERS: 4
    restart: unless-stopped  # start again after a reboot`;

const handler = `import { readFile } from "node:fs/promises";

/** Reads the host list and returns the names of the hosts that are up. */
export async function upHosts(path: string): Promise<string[]> {
  const hosts: { name: string; up: boolean }[] = JSON.parse(await readFile(path, "utf8"));
  return hosts.filter((host) => host.up).map((host) => host.name);
}`;

const response = `{"hosts":[{"name":"web-1","address":"192.0.2.10","up":true,"ports":[80,443]},{"name":"nas","address":"192.0.2.20","up":false,"ports":[]}],"total":2}`;

const script = `#!/usr/bin/env bash
set -euo pipefail
for host in web-1 nas; do
  ssh "admin@$host.example.com" uptime
done`;

export default defineExamples("highlight", [
  {
    id: "sql",
    title: "SQL with a title",
    render: () => <Highlight language="sql" title="stale-hosts.sql" code={query} />,
  },
  {
    id: "yaml",
    title: "YAML",
    render: () => <Highlight language="yaml" title="compose.yaml" code={compose} />,
  },
  {
    id: "line-numbers",
    title: "Line numbers",
    note: "A copied selection leaves the numbers out.",
    render: () => <Highlight language="typescript" title="hosts.ts" code={handler} lineNumbers />,
  },
  {
    id: "scroll",
    title: "A long line scrolls sideways",
    note: "The code takes the focus, so the arrow keys can scroll it.",
    render: () => <Highlight language="json" code={response} label="Hosts response" />,
  },
  {
    id: "wrap",
    title: "A long line wraps",
    render: () => <Highlight language="json" code={response} wrap lineNumbers />,
  },
  {
    id: "auto",
    title: "Language guessed",
    render: () => <Highlight language="auto" code={script} label="Uptime script" />,
  },
  {
    id: "text",
    title: "Plain text",
    note: 'With language="text" the code keeps its plain colour.',
    render: () => (
      <Highlight language="text" code={"web-1  up    12 days\nnas    down  -"} label="Host status" />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <Highlight language="sql" title="stale-hosts.sql" code={query} lineNumbers />,
  },
]);
