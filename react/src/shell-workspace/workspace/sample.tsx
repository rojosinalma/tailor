/** The sample of the workspace examples: a small file workspace with neutral data. Not a component. */
import type { ReactNode } from "react";
import { Badge } from "../../core/badge/badge";
import { Button } from "../../core/button/button";
import { CodeBlock } from "../../core/code-block/code-block";
import { Facts } from "../../core/facts/facts";
import { Field } from "../../core/field/field";
import { Icon } from "../../core/icon/icon";
import { Input } from "../../core/input/input";
import { List, ListItem } from "../../core/list/list";
import { Page } from "../../core/page/page";
import { Pane } from "../../core/pane/pane";
import { Search } from "../../core/search/search";
import type { FooterFact, NavItem, ShellBrand } from "../../core/shell-base/shell-base";
import { Stack } from "../../core/stack/stack";
import { Switch } from "../../core/switch/switch";
import { Timeline, TimelineItem } from "../../core/timeline/timeline";
import type { WorkspaceBottom, WorkspacePanel } from "./workspace";

export const WS_BRAND: ShellBrand = { name: "Files", icon: "bi:folder2-open", to: "#files" };

export const WS_NAV: NavItem[] = [
  { id: "files", label: "Files", icon: "bi:files", to: "#files", current: true },
  { id: "search", label: "Search", icon: "bi:search", to: "#search" },
];

export const WS_FOOTER: FooterFact[] = [{ id: "version", label: "Version", value: "2.4.1" }];

export const WS_ACTIONS: ReactNode = (
  <Search label="Search files" placeholder="Search files" size="sm" shortcut={false} />
);

const FILES = [
  { name: "compose.yaml", folder: "web-1", current: true },
  { name: "nginx.conf", folder: "web-1" },
  { name: ".env.example", folder: "web-1" },
  { name: "backup.sh", folder: "nas" },
  { name: "restore.sh", folder: "nas" },
  { name: "README.md", folder: "docs" },
  { name: "install.md", folder: "docs" },
  { name: "upgrade.md", folder: "docs" },
];

/** The file list of the sidebar, grouped by folder. */
export const WS_TREE: ReactNode = (
  <Stack gap="3">
    {["web-1", "nas", "docs"].map((folder) => (
      <List key={folder} label={folder} dividers={false}>
        <ListItem leading={<Icon name="bi:folder2" />} title={folder} />
        {FILES.filter((file) => file.folder === folder).map((file) => (
          <ListItem
            key={file.name}
            leading={<Icon name="bi:file-earmark-text" />}
            title={file.name}
            to={`#${folder}/${file.name}`}
            selected={file.current}
          />
        ))}
      </List>
    ))}
  </Stack>
);

const COMPOSE = `services:
  web:
    image: nginx:1.27
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: unless-stopped
  api:
    image: example/api:3.4.1
    environment:
      DATABASE_URL: postgres://api@db/api
    depends_on:
      - db
  db:
    image: postgres:17
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data: {}
`;

/** The centre: a Page in fill mode with the open file in a pane. */
export function FilePage() {
  return (
    <Page
      title="compose.yaml"
      description="web-1"
      mode="fill"
      actions={
        <Button size="sm" variant="primary">
          Save
        </Button>
      }
    >
      <Pane label="compose.yaml" padding="none">
        <CodeBlock code={COMPOSE} title="web-1/compose.yaml" />
      </Pane>
    </Page>
  );
}

const at = (time: string): string => `2026-11-15 ${time}`;

export const WS_PANELS: WorkspacePanel[] = [
  {
    id: "details",
    label: "Details",
    icon: "bi:info-circle",
    content: (
      <Facts
        items={[
          { key: "Path", value: "web-1/compose.yaml", mono: true },
          { key: "Size", value: "412 bytes" },
          { key: "Changed", value: at("11:48") },
          { key: "Owner", value: "alice" },
          { key: "State", value: <Badge tone="success">Saved</Badge> },
        ]}
      />
    ),
  },
  {
    id: "history",
    label: "History",
    icon: "bi:clock-history",
    content: (
      <Timeline label="Changes to compose.yaml">
        <TimelineItem title="Pinned nginx to 1.27" time={at("11:48")} tone="success">
          alice
        </TimelineItem>
        <TimelineItem title="Added the api service" time={at("10:02")}>
          alice
        </TimelineItem>
        <TimelineItem title="Created the file" time="2026-11-12 09:15" />
      </Timeline>
    ),
  },
  {
    id: "notes",
    label: "Notes",
    icon: "bi:sticky",
    content: (
      <Stack gap="3">
        <p>The api waits for the db. Restart both after a change to the database address.</p>
        <p>Port 8080 is open on web-1 only.</p>
      </Stack>
    ),
  },
];

const LOG = Array.from({ length: 24 }, (_, i) => {
  const second = String(i * 2).padStart(2, "0");
  const lines = [
    "web  | starting nginx 1.27",
    "db   | database system is ready to accept connections",
    "api  | listening on :3000",
    "web  | GET /health 200",
  ];
  return `11:48:${second} ${lines[i % lines.length]}`;
}).join("\n");

export const WS_BOTTOM: WorkspaceBottom = {
  label: "Output",
  content: <CodeBlock code={LOG} label="Output" wrap />,
  actions: (
    <Button size="sm" variant="ghost">
      Clear
    </Button>
  ),
};

export const WS_SETTINGS: ReactNode = (
  <Stack gap="4">
    <Field label="Workspace name">
      <Input defaultValue="web-1" />
    </Field>
    <Field label="Tab width" help="Spaces per indent level.">
      <Input defaultValue="2" inputMode="numeric" />
    </Field>
    <Switch label="Save on focus change" defaultChecked />
    <Switch label="Show hidden files" />
  </Stack>
);
